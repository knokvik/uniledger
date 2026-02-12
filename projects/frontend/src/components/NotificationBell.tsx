import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    related_id?: string;
    related_type?: string;
}

const fetchNotifications = async () => {
    const response = await axios.get(`${API_URL}/api/notifications`, {
        withCredentials: true
    });
    // Return default structure if successful, or throw
    if (response.data.success) {
        return {
            notifications: response.data.notifications as Notification[],
            unreadCount: response.data.unreadCount as number
        };
    }
    throw new Error(response.data.message || 'Failed to fetch notifications');
};

const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Use React Query for notifications
    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
        refetchInterval: 30000, // Poll every 30 seconds
        staleTime: 10000,
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    const markAsRead = async (notificationId: string) => {
        try {
            await axios.put(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {},
                { withCredentials: true }
            );
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(
                `${API_URL}/api/notifications/read-all`,
                {},
                { withCredentials: true }
            );
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            await axios.delete(
                `${API_URL}/api/notifications/${notificationId}`,
                { withCredentials: true }
            );
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'join_request':
                return '👥';
            case 'join_accepted':
                return '✅';
            case 'join_rejected':
                return '❌';
            case 'join_hold':
                return '⏸️';
            case 'payment_verified':
                return '💰';
            default:
                return '🔔';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                title="Notifications"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Notification Panel */}
                    <div className="absolute right-0 top-12 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-600">
                                    You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-500">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <span className="text-6xl opacity-20">🔔</span>
                                    <p className="mt-4 text-gray-500 font-medium">No notifications</p>
                                    <p className="text-sm text-gray-400">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition ${!notification.is_read ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Icon */}
                                                <div className="flex-shrink-0 text-2xl">
                                                    {getNotificationIcon(notification.type)}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="text-sm font-semibold text-gray-900">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.is_read && (
                                                            <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatTime(notification.created_at)}
                                                    </p>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-3 mt-2">
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                            >
                                                                Mark as read
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteNotification(notification.id)}
                                                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // TODO: Navigate to full notifications page
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
