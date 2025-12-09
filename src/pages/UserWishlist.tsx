import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, WishlistItem, GiftReservation } from '../types/database'
import { formatPrice } from '../lib/currency'
import ItemDetailModal from '../components/ItemDetailModal'

interface UserWishlistProps {
    currentUser: User | null
}

export default function UserWishlist({ currentUser }: UserWishlistProps) {
    const { username } = useParams<{ username: string }>()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [items, setItems] = useState<WishlistItem[]>([])
    const [myReservations, setMyReservations] = useState<GiftReservation[]>([])
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFriend, setIsFriend] = useState(false)

    useEffect(() => {
        if (!username) return
        loadData()
    }, [username, currentUser])

    const loadData = async () => {
        if (!username) return

        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('username', username)
            .single()

        if (!profileData) {
            setLoading(false)
            return
        }

        setProfile(profileData)

        if (currentUser) {
            const { data: friendshipData } = await supabase
                .from('friendships')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('friend_id', profileData.user_id)
                .eq('status', 'accepted')
                .single()

            setIsFriend(!!friendshipData)
        }

        let query = supabase
            .from('wishlist_items')
            .select('*')
            .eq('user_id', profileData.user_id)
            .order('created_at', { ascending: false })

        if (currentUser?.id === profileData.user_id) {
            // Владелец видит всё
        } else if (currentUser && isFriend) {
            query = query.in('visibility', ['public', 'friends'])
        } else {
            query = query.eq('visibility', 'public')
        }

        const { data: itemsData } = await query

        setItems(itemsData || [])

        if (currentUser) {
            const { data: reservationsData } = await supabase
                .from('gift_reservations')
                .select('*')
                .eq('reserved_by', currentUser.id)
                .in('item_id', (itemsData || []).map(item => item.id))

            setMyReservations(reservationsData || [])
        }

        setLoading(false)
    }

    const handleToggleReservation = async (itemId: string) => {
        if (!currentUser) {
            alert('Войдите, чтобы забронировать подарки')
            return
        }

        const existing = myReservations.find(r => r.item_id === itemId)

        if (existing) {
            await supabase.from('gift_reservations').delete().eq('id', existing.id)
        } else {
            await supabase.from('gift_reservations').insert({
                item_id: itemId,
                reserved_by: currentUser.id,
            })
        }

        loadData()
    }

    const handleTogglePurchased = async (itemId: string) => {
        if (!currentUser) return

        const reservation = myReservations.find(r => r.item_id === itemId)
        if (!reservation) return

        await supabase
            .from('gift_reservations')
            .update({ is_purchased: !reservation.is_purchased })
            .eq('id', reservation.id)

        loadData()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
                <div className="spinner"></div>
                <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-200">Загрузка...</p>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Пользователь не найден</h2>
                    <Link to="/" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
                        На главную
                    </Link>
                </div>
            </div>
        )
    }

    const isOwner = currentUser?.id === profile.user_id

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3">
                        <span className="text-3xl">🎁</span>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Wishlist
                        </h1>
                    </Link>
                    {currentUser && (
                        <Link
                            to="/my-wishlist"
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                        >
                            Мой вишлист
                        </Link>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Профиль */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 mb-8 text-center">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="w-32 h-32 rounded-full object-cover border-4 border-purple-200 dark:border-purple-700 shadow-lg mx-auto mb-4"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-5xl font-bold shadow-lg mx-auto mb-4">
                            {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    )}
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">{profile.display_name}</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">@{profile.username}</p>
                    {profile.bio && <p className="text-gray-700 dark:text-gray-200 max-w-2xl mx-auto">{profile.bio}</p>}
                    {isOwner && (
                        <div className="mt-4">
                            <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full font-semibold">
                                Это ваш вишлист
                            </span>
                        </div>
                    )}
                </div>

                {/* Список желаний */}
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                    {isOwner ? 'Ваши желания' : 'Список желаний'}
                </h2>

                {items.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">Пока пусто</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            {isOwner ? 'Добавьте первое желание' : 'Пользователь ещё не добавил желания'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => {
                            const myReservation = myReservations.find(r => r.item_id === item.id)
                            const isReserved = !!myReservation

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg p-6 border-2 transition-all hover:shadow-xl cursor-pointer ${
                                        item.priority === 'high'
                                            ? 'border-red-300 dark:border-red-700'
                                            : item.priority === 'medium'
                                                ? 'border-yellow-300 dark:border-yellow-700'
                                                : 'border-gray-100 dark:border-slate-700'
                                    } ${isReserved ? 'ring-2 ring-purple-500' : ''}`}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-48 object-cover rounded-xl mb-4"
                                        />
                                    )}

                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{item.title}</h3>

                                    {item.description && (
                                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{item.description}</p>
                                    )}

                                    {item.estimated_price && (
                                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                                            {formatPrice(item.estimated_price, profile.currency)}
                                        </p>
                                    )}

                                    {!isOwner && currentUser && (
                                        <div className="space-y-2 mt-4" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => handleToggleReservation(item.id)}
                                                className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                                                    isReserved
                                                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                                                        : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800'
                                                }`}
                                            >
                                                {isReserved ? '✓ Вы забронировали' : '⭐ Забронировать'}
                                            </button>
                                            {isReserved && myReservation && (
                                                <button
                                                    onClick={() => handleTogglePurchased(item.id)}
                                                    className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                                                        myReservation.is_purchased
                                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                                            : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                                                    }`}
                                                >
                                                    {myReservation.is_purchased ? '✓ Куплено' : 'Отметить куплено'}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {isOwner && item.reserved_count > 0 && (
                                        <div className="mt-4 p-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg text-sm font-semibold text-center">
                                            ✨ {item.reserved_count} {item.reserved_count === 1 ? 'человек заинтересован' : 'человека заинтересованы'}
                                        </div>
                                    )}

                                    <div className="mt-3 text-center text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                        👁️ Нажмите для деталей
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {selectedItem && profile && (
                <ItemDetailModal
                    item={selectedItem}
                    currentUser={currentUser}
                    ownerProfile={profile}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={loadData}
                />
            )}
        </div>
    )
}
