import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Notification } from '../types/database'

export default function NotificationBell({ user }: { user: User }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        loadNotifications()

        // Подписка на новые уведомления в реальном времени
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    loadNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const loadNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        setNotifications(data || [])
        setUnreadCount((data || []).filter(n => !n.is_read).length)
    }

    const markAsRead = async (notificationId: string) => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)

        loadNotifications()
    }

    const markAllAsRead = async () => {
        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false)

        loadNotifications()
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'friend_request': return '👥'
            case 'comment': return '💬'
            case 'contribution': return '💰'
            case 'reservation': return '⭐'
            default: return '🔔'
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
                <span className="text-2xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 max-h-[500px] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Уведомления</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
                                >
                                    Прочитать все
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                Нет уведомлений
                            </div>
                        ) : (
                            <div>
                                {notifications.map((notification) => (
                                    <Link
                                        key={notification.id}
                                        to={notification.link || '#'}
                                        onClick={() => {
                                            markAsRead(notification.id)
                                            setShowDropdown(false)
                                        }}
                                        className={`block p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                                            !notification.is_read ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{getIcon(notification.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-800 flex items-center gap-2">
                                                    {notification.title}
                                                    {!notification.is_read && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {new Date(notification.created_at).toLocaleString('ru-RU')}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
