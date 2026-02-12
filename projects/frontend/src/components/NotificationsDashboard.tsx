import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

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
    if (response.data.success) {
        return {
            notifications: response.data.notifications as Notification[],
            unreadCount: response.data.unreadCount as number
        };
    }
    throw new Error(response.data.message || 'Failed to fetch notifications');
};

const NotificationsDashboard: React.FC = () => {
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
        refetchInterval: 30000,
        staleTime: 10000,
    });

    const notifications = data?.notifications || [];
    const unreadCount = data?.unreadCount || 0;

    // Filter notifications
    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            await axios.put(
                `${API_URL}/api/notifications/${notificationId}/read`,
                {},
                { withCredentials: true }
            );
        },
        onMutate: async (notificationId) => {
            setProcessingIds(prev => new Set(prev).add(notificationId));
            const previousData = queryClient.getQueryData(['notifications']);
            queryClient.setQueryData(['notifications'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    notifications: old.notifications.map((n: Notification) =>
                        n.id === notificationId ? { ...n, is_read: true } : n
                    ),
                    unreadCount: Math.max(0, old.unreadCount - 1)
                };
            });
            return { previousData };
        },
        onError: (err, notificationId, context) => {
            queryClient.setQueryData(['notifications'], context?.previousData);
            toast.error('Failed to mark as read');
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        },
        onSuccess: () => {
            toast.success('Marked as read');
        },
        onSettled: (_, __, notificationId) => {
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                setProcessingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(notificationId);
                    return newSet;
                });
            }, 300);
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            await axios.delete(
                `${API_URL}/api/notifications/${notificationId}`,
                { withCredentials: true }
            );
        },
        onMutate: async (notificationId) => {
            setProcessingIds(prev => new Set(prev).add(notificationId));
            const previousData = queryClient.getQueryData(['notifications']);
            queryClient.setQueryData(['notifications'], (old: any) => {
                if (!old) return old;
                const deletedNotif = old.notifications.find((n: Notification) => n.id === notificationId);
                return {
                    ...old,
                    notifications: old.notifications.filter((n: Notification) => n.id !== notificationId),
                    unreadCount: deletedNotif && !deletedNotif.is_read
                        ? Math.max(0, old.unreadCount - 1)
                        : old.unreadCount
                };
            });
            return { previousData };
        },
        onError: (err, notificationId, context) => {
            queryClient.setQueryData(['notifications'], context?.previousData);
            toast.error('Failed to delete notification');
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(notificationId);
                return newSet;
            });
        },
        onSuccess: () => {
            toast.success('Notification deleted');
        },
        onSettled: (_, __, notificationId) => {
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                setProcessingIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(notificationId);
                    return newSet;
                });
            }, 300);
        }
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await axios.put(
                `${API_URL}/api/notifications/read-all`,
                {},
                { withCredentials: true }
            );
        },
        onMutate: async () => {
            const previousData = queryClient.getQueryData(['notifications']);
            queryClient.setQueryData(['notifications'], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    notifications: old.notifications.map((n: Notification) => ({ ...n, is_read: true })),
                    unreadCount: 0
                };
            });
            return { previousData };
        },
        onError: (err, _, context) => {
            queryClient.setQueryData(['notifications'], context?.previousData);
            toast.error('Failed to mark all as read');
        },
        onSuccess: () => {
            toast.success('All notifications marked as read');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'join_request': return '👥';
            case 'join_accepted': return '✅';
            case 'join_rejected': return '❌';
            case 'join_hold': return '⏸️';
            case 'payment_verified': return '💰';
            case 'request_approved': return '✅';
            case 'request_rejected': return '❌';
            case 'status_update': return '🔔';
            default: return '🔔';
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
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2 text-sm font-medium"
                    >
                        ← Back
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                            {unreadCount > 0 && (
                                <p className="text-gray-600 mt-1">
                                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsReadMutation.mutate()}
                                disabled={markAllAsReadMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                {markAllAsReadMutation.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Marking All...
                                    </>
                                ) : (
                                    'Mark All as Read'
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === 'all'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === 'unread'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button
                            onClick={() => setFilter('read')}
                            className={`flex-1 px-6 py-4 text-sm font-medium transition ${filter === 'read'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Read ({notifications.length - unreadCount})
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-gray-500">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <span className="text-7xl opacity-20">🔔</span>
                            <p className="mt-6 text-gray-500 font-medium text-lg">
                                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                {filter === 'all' ? "You're all caught up!" : `You don't have any ${filter} notifications`}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => {
                            const isProcessing = processingIds.has(notification.id);
                            return (
                                <div
                                    key={notification.id}
                                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md ${isProcessing ? 'opacity-60 pointer-events-none' : ''
                                        } ${!notification.is_read ? 'border-l-4 border-l-blue-500' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 text-3xl">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-base font-semibold text-gray-900">
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.is_read && (
                                                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {formatTime(notification.created_at)}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={() => markAsReadMutation.mutate(notification.id)}
                                                            disabled={isProcessing}
                                                            className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-md font-medium border border-blue-200 disabled:opacity-50 transition flex items-center gap-1.5"
                                                        >
                                                            {isProcessing && markAsReadMutation.variables === notification.id ? (
                                                                <>
                                                                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                                    Marking...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span>✓</span> Mark as read
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteMutation.mutate(notification.id)}
                                                        disabled={isProcessing}
                                                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-md font-medium border border-red-200 disabled:opacity-50 transition flex items-center gap-1.5"
                                                    >
                                                        {isProcessing && deleteMutation.variables === notification.id ? (
                                                            <>
                                                                <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>×</span> Delete
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsDashboard;
