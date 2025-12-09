import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { GroupMessage, UserProfile } from '../types/database'
import toast from 'react-hot-toast'

interface MessageWithUser extends GroupMessage {
    user_profile?: UserProfile
}

interface Props {
    user: User
    groupId: string
    onClose: () => void
}

export default function GroupChat({ user, groupId, onClose }: Props) {
    const [messages, setMessages] = useState<MessageWithUser[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadMessages()
        subscribeToMessages()
    }, [groupId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadMessages = async () => {
        try {
            const { data: messagesData } = await supabase
                .from('group_messages')
                .select('*')
                .eq('group_id', groupId)
                .order('created_at', { ascending: true })
                .limit(100)

            if (messagesData) {
                // Загружаем профили пользователей
                const userIds = [...new Set(messagesData.map(m => m.user_id))]
                const { data: usersData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .in('user_id', userIds)

                const usersMap = new Map(usersData?.map(u => [u.user_id, u]))

                const enrichedMessages = messagesData.map(m => ({
                    ...m,
                    user_profile: usersMap.get(m.user_id)
                }))

                setMessages(enrichedMessages)
            }
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToMessages = () => {
        const channel = supabase
            .channel(`group_messages:${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${groupId}`
                },
                async (payload) => {
                    const newMsg = payload.new as GroupMessage

                    // Загружаем профиль отправителя
                    const { data: userData } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('user_id', newMsg.user_id)
                        .single()

                    setMessages(prev => [...prev, { ...newMsg, user_profile: userData || undefined }])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newMessage.trim()) return

        try {
            const { error } = await supabase
                .from('group_messages')
                .insert({
                    group_id: groupId,
                    user_id: user.id,
                    message: newMessage.trim()
                })

            if (error) {
                toast.error('Ошибка отправки сообщения')
            } else {
                setNewMessage('')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Произошла ошибка')
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Сегодня'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Вчера'
        } else {
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
        }
    }

    const renderMessages = () => {
        let lastDate = ''
        const result: JSX.Element[] = []

        messages.forEach((msg, index) => {
            const msgDate = formatDate(msg.created_at)

            if (msgDate !== lastDate) {
                result.push(
                    <div key={`date-${index}`} className="flex justify-center my-4">
            <span className="px-3 py-1 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
              {msgDate}
            </span>
                    </div>
                )
                lastDate = msgDate
            }

            const isMyMessage = msg.user_id === user.id

            result.push(
                <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3`}>
                    <div className={`flex items-end gap-2 max-w-[70%] ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMyMessage && (
                            <div className="flex-shrink-0">
                                {msg.user_profile?.avatar_url ? (
                                    <img
                                        src={msg.user_profile.avatar_url}
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                        {msg.user_profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                        )}
                        <div>
                            {!isMyMessage && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-2">
                                    {msg.user_profile?.display_name}
                                </div>
                            )}
                            <div
                                className={`px-4 py-2 rounded-2xl ${
                                    isMyMessage
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-100'
                                }`}
                            >
                                <p className="text-sm break-words">{msg.message}</p>
                            </div>
                            <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isMyMessage ? 'text-right mr-2' : 'ml-2'}`}>
                                {formatTime(msg.created_at)}
                            </div>
                        </div>
                    </div>
                </div>
            )
        })

        return result
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] sm:h-[600px] flex flex-col">
                {/* Заголовок */}
                <div className="border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                        💬 Чат группы
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-3xl sm:text-2xl w-10 h-10 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>

                {/* Сообщения */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="spinner"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                            <div className="text-5xl mb-4">💬</div>
                            <p className="text-center">Пока нет сообщений</p>
                            <p className="text-sm text-center mt-2">Начните общение первым!</p>
                        </div>
                    ) : (
                        renderMessages()
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Поле ввода */}
                <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-slate-700 p-4 flex gap-2 flex-shrink-0">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Введите сообщение..."
                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Отправить
                    </button>
                </form>
            </div>
        </div>
    )
}
