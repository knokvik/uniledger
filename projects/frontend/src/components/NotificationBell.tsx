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

const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
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

            // Optimistic update
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

            // Optimistic update
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
            toast.success('All marked as read');
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
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                title="Notifications"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel - Centered below icon */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Notification Panel - Centered */}
                    <div
                        className="absolute top-12 left-1/2 -translate-x-1/2 w-96 max-w-[calc(100vw-2rem)] max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col"
                        style={{ transformOrigin: 'top center' }}
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllAsReadMutation.mutate()}
                                        disabled={markAllAsReadMutation.isPending}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                                    >
                                        {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
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
                                    {notifications.slice(0, 5).map((notification) => {
                                        const isProcessing = processingIds.has(notification.id);
                                        return (
                                            <div
                                                key={notification.id}
                                                className={`p-4 transition-all ${isProcessing ? 'opacity-60 pointer-events-none' : 'hover:bg-gray-50'
                                                    } ${!notification.is_read ? 'bg-blue-50' : ''}`}
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

                                                        {/* Actions with Loading States */}
                                                        <div className="flex items-center gap-3 mt-2">
                                                            {!notification.is_read && (
                                                                <button
                                                                    onClick={() => markAsReadMutation.mutate(notification.id)}
                                                                    disabled={isProcessing}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    {isProcessing && markAsReadMutation.variables === notification.id ? (
                                                                        <>
                                                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                                            Marking...
                                                                        </>
                                                                    ) : (
                                                                        'Mark as read'
                                                                    )}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteMutation.mutate(notification.id)}
                                                                disabled={isProcessing}
                                                                className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50 flex items-center gap-1"
                                                            >
                                                                {isProcessing && deleteMutation.variables === notification.id ? (
                                                                    <>
                                                                        <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                                                        Deleting...
                                                                    </>
                                                                ) : (
                                                                    'Delete'
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/notifications');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    View all notifications →
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
