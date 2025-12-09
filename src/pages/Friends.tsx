import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, Friendship } from '../types/database'
import Navbar from '../components/Navbar'

interface FriendWithProfile extends Friendship {
    friend_profile?: UserProfile
}

export default function Friends({ user }: { user: User }) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [friends, setFriends] = useState<FriendWithProfile[]>([])
    const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        setProfile(profileData)

        const { data: friendsData } = await supabase
            .rpc('get_user_friends', { p_user_id: user.id })

        setFriends((friendsData || []).map((f: any) => ({
            id: f.friendship_id,
            user_id: f.user_id,
            friend_id: f.friend_id,
            circle: f.circle,
            status: f.status,
            created_at: f.created_at,
            friend_profile: {
                user_id: f.friend_id,
                username: f.friend_username,
                display_name: f.friend_display_name,
                avatar_url: f.friend_avatar_url,
                bio: null,
                currency: 'UAH',
                created_at: ''
            }
        })))

        const { data: requestsData } = await supabase
            .rpc('get_friend_requests', { p_user_id: user.id })

        setPendingRequests((requestsData || []).map((r: any) => ({
            id: r.friendship_id,
            user_id: r.user_id,
            friend_id: r.friend_id,
            circle: r.circle,
            status: r.status,
            created_at: r.created_at,
            friend_profile: {
                user_id: r.user_id,
                username: r.requester_username,
                display_name: r.requester_display_name,
                avatar_url: r.requester_avatar_url,
                bio: null,
                currency: 'UAH',
                created_at: ''
            }
        })))

        setLoading(false)
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        const { data } = await supabase
            .from('user_profiles')
            .select('*')
            .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
            .neq('user_id', user.id)
            .limit(10)

        setSearchResults(data || [])
    }

    const handleAddFriend = async (friendId: string) => {
        const { data: existing } = await supabase
            .from('friendships')
            .select('*')
            .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
            .maybeSingle()

        if (existing) {
            alert('Вы уже друзья или запрос уже отправлен!')
            return
        }

        const { error } = await supabase.from('friendships').insert({
            user_id: user.id,
            friend_id: friendId,
            circle: 'friends',
            status: 'pending',
        })

        if (error) {
            alert('Ошибка: ' + error.message)
        } else {
            setSearchResults([])
            setSearchQuery('')
            alert('Запрос отправлен!')
        }
    }

    const handleAcceptRequest = async (requestId: string, friendId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('id', requestId)

            if (updateError) {
                console.error('Error updating request:', updateError)
                alert('Ошибка при принятии запроса')
                return
            }

            const { error: insertError } = await supabase
                .from('friendships')
                .insert({
                    user_id: user.id,
                    friend_id: friendId,
                    circle: 'friends',
                    status: 'accepted',
                })

            if (insertError) {
                console.error('Error creating reverse friendship:', insertError)
                if (!insertError.message.includes('duplicate')) {
                    alert('Ошибка при создании обратной связи')
                }
            }

            await loadData()
        } catch (err) {
            console.error('Unexpected error:', err)
        }
    }

    const handleRejectRequest = async (friendshipId: string) => {
        await supabase.from('friendships').delete().eq('id', friendshipId)
        loadData()
    }

    const handleRemoveFriend = async (friendshipId: string, friendId: string) => {
        if (confirm('Удалить из друзей?')) {
            await supabase.from('friendships').delete().eq('id', friendshipId)
            await supabase
                .from('friendships')
                .delete()
                .eq('user_id', friendId)
                .eq('friend_id', user.id)
            loadData()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
                <div className="spinner"></div>
                <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-200">Загрузка...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <Navbar user={user} profile={profile} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-6 sm:mb-8">
                    Мои друзья
                </h1>

                {/* Поиск */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Добавить друзей
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Введите username или имя"
                            className="flex-1 px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        />
                        <button
                            onClick={handleSearch}
                            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                        >
                            Найти
                        </button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {searchResults.map((result) => (
                                <div
                                    key={result.user_id}
                                    className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-slate-800 rounded-xl gap-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 dark:text-gray-100 truncate">
                                            {result.display_name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            @{result.username}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddFriend(result.user_id)}
                                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold whitespace-nowrap text-sm sm:text-base"
                                    >
                                        Добавить
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Запросы */}
                {pendingRequests.length > 0 && (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                            Запросы в друзья ({pendingRequests.length})
                        </h2>
                        <div className="space-y-3">
                            {pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl gap-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-gray-800 dark:text-gray-100 truncate">
                                            {request.friend_profile?.display_name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            @{request.friend_profile?.username}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleAcceptRequest(request.id, request.user_id)}
                                            className="flex-1 sm:flex-none py-2 px-3 sm:px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition font-semibold text-sm sm:text-base"
                                        >
                                            Принять
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request.id)}
                                            className="flex-1 sm:flex-none py-2 px-3 sm:px-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm sm:text-base"
                                        >
                                            Отклонить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Список друзей */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Друзья ({friends.length})
                    </h2>

                    {friends.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                            <div className="text-5xl sm:text-6xl mb-4">👥</div>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                Пока нет друзей. Найдите и добавьте их!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {friends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 sm:p-6 border-2 border-gray-100 dark:border-slate-700"
                                >
                                    <div className="mb-4">
                                        <div className="font-bold text-gray-800 dark:text-gray-100 text-base sm:text-lg truncate">
                                            {friend.friend_profile?.display_name}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            @{friend.friend_profile?.username}
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Link
                                            to={`/u/${friend.friend_profile?.username}`}
                                            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition text-center font-semibold text-sm sm:text-base"
                                        >
                                            Вишлист
                                        </Link>
                                        <button
                                            onClick={() => handleRemoveFriend(friend.id, friend.friend_id)}
                                            className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm sm:text-base"
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
