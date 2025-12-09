import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, WishlistItem, Collection, GiftReservation, ItemComment } from '../types/database'
import Navbar from '../components/Navbar'
import AddItemModal from '../components/AddItemModal'
import ContributionModal from '../components/ContributionModal'
import { formatPrice } from '../lib/currency'
import toast from 'react-hot-toast'

interface CommentWithUser extends ItemComment {
    user_profile?: UserProfile
}

export default function GroupWishlist({ user }: { user: User }) {
    const { groupId, userId } = useParams<{ groupId: string; userId: string }>()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [ownerProfile, setOwnerProfile] = useState<UserProfile | null>(null)
    const [items, setItems] = useState<WishlistItem[]>([])
    const [collections, setCollections] = useState<Collection[]>([])
    const [reservations, setReservations] = useState<GiftReservation[]>([])
    const [comments, setComments] = useState<Record<string, CommentWithUser[]>>({})
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)
    const [newComment, setNewComment] = useState('')
    const [showContributionModal, setShowContributionModal] = useState(false)
    const [selectedContributionItem, setSelectedContributionItem] = useState<WishlistItem | null>(null)

    const isMyWishlist = userId === user.id

    useEffect(() => {
        loadData()
    }, [groupId, userId])

    const loadData = async () => {
        try {
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setProfile(profileData)

            const { data: ownerData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single()

            setOwnerProfile(ownerData)

            const { data: itemsData } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', userId)
                .eq('group_id', groupId)
                .order('created_at', { ascending: false })

            setItems(itemsData || [])

            // Загружаем коллекции
            if (isMyWishlist) {
                const { data: collectionsData } = await supabase
                    .from('collections')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                setCollections(collectionsData || [])
            }

            // Загружаем бронирования текущего пользователя
            const { data: myReservationsData } = await supabase
                .from('gift_reservations')
                .select('*')
                .eq('reserved_by', user.id)
                .in('status', ['active'])

            setReservations(myReservationsData || [])

            // Загружаем ВСЕ бронирования для групповых желаний (если НЕ владелец)
            if (!isMyWishlist && itemsData && itemsData.length > 0) {
                const itemIds = itemsData.map(item => item.id)
                const { data: allReservationsData } = await supabase
                    .from('gift_reservations')
                    .select('*, reserved_by')
                    .in('item_id', itemIds)
                    .in('status', ['active'])

                // Загружаем профили тех кто забронировал
                if (allReservationsData && allReservationsData.length > 0) {
                    const reserverIds = [...new Set(allReservationsData.map(r => r.reserved_by))]
                    const { data: reserversData } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .in('user_id', reserverIds)

                    const reserversMap = new Map(reserversData?.map(u => [u.user_id, u]))

                    // Добавляем информацию о бронированиях к желаниям
                    const itemsWithReservers = itemsData.map(item => {
                        const itemReservations = allReservationsData.filter(r => r.item_id === item.id)
                        const reservers = itemReservations.map(r => ({
                            id: r.id,
                            profile: reserversMap.get(r.reserved_by)
                        }))
                        return { ...item, reservers }
                    })

                    setItems(itemsWithReservers as any)
                }
            }

            // Загружаем комментарии
            if (itemsData && itemsData.length > 0) {
                const itemIds = itemsData.map(item => item.id)
                const { data: commentsData } = await supabase
                    .from('item_comments')
                    .select('*')
                    .in('item_id', itemIds)
                    .order('created_at', { ascending: true })

                if (commentsData) {
                    const userIds = [...new Set(commentsData.map(c => c.user_id))]
                    const { data: usersData } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .in('user_id', userIds)

                    const usersMap = new Map(usersData?.map(u => [u.user_id, u]))

                    const commentsMap: Record<string, CommentWithUser[]> = {}
                    commentsData.forEach(comment => {
                        if (!commentsMap[comment.item_id]) {
                            commentsMap[comment.item_id] = []
                        }
                        commentsMap[comment.item_id].push({
                            ...comment,
                            user_profile: usersMap.get(comment.user_id)
                        })
                    })

                    setComments(commentsMap)
                }
            }
        } catch (error) {
            console.error('Error loading wishlist:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleReserve = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('gift_reservations')
                .insert({
                    item_id: itemId,
                    reserved_by: user.id,
                })

            if (error) {
                if (error.code === '23505') {
                    toast.error('Вы уже забронировали этот подарок')
                } else {
                    toast.error('Ошибка бронирования')
                }
            } else {
                toast.success('Подарок забронирован! 🎁')
                loadData()
            }
        } catch (error) {
            console.error('Error reserving gift:', error)
            toast.error('Произошла ошибка')
        }
    }

    const handleCancelReservation = async (itemId: string) => {
        try {
            const reservation = reservations.find(r => r.item_id === itemId)
            if (!reservation) return

            const { error } = await supabase
                .from('gift_reservations')
                .delete()
                .eq('id', reservation.id)

            if (error) {
                toast.error('Ошибка отмены')
            } else {
                toast.success('Бронирование отменено')
                loadData()
            }
        } catch (error) {
            console.error('Error canceling reservation:', error)
            toast.error('Произошла ошибка')
        }
    }

    const handleAddComment = async (itemId: string) => {
        if (!newComment.trim()) return

        try {
            const { error } = await supabase
                .from('item_comments')
                .insert({
                    item_id: itemId,
                    user_id: user.id,
                    comment: newComment.trim(),
                })

            if (error) {
                toast.error('Ошибка добавления комментария')
            } else {
                toast.success('Комментарий добавлен! 💬')
                setNewComment('')
                setSelectedItem(null)
                loadData()
            }
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error('Произошла ошибка')
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Удалить это желание?')) return

        try {
            const { error } = await supabase.from('wishlist_items').delete().eq('id', itemId)

            if (error) {
                toast.error('Ошибка при удалении')
            } else {
                toast.success('Желание удалено! 🗑️')
                await loadData()
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Ошибка')
        }
    }

    const isReservedByMe = (itemId: string) => {
        return reservations.some(r => r.item_id === itemId)
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
                <div className="mb-6">
                    <Link
                        to={`/groups/${groupId}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                    >
                        ← Назад к группе
                    </Link>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                                {isMyWishlist ? 'Мой вишлист в группе' : `Вишлист ${ownerProfile?.display_name}`}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                                {isMyWishlist
                                    ? 'Желания, видимые только участникам этой группы'
                                    : `Желания пользователя @${ownerProfile?.username} в этой группе`}
                            </p>
                        </div>
                        {isMyWishlist && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                            >
                                + Добавить
                            </button>
                        )}
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                        <div className="text-5xl sm:text-6xl mb-4">🎁</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            {isMyWishlist ? 'Ваш групповой вишлист пуст' : 'Пока нет желаний'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                            {isMyWishlist && 'Добавьте желания специально для этой группы'}
                        </p>
                        {isMyWishlist && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                            >
                                + Добавить желание
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {items.map((item, index) => {
                            const reserved = isReservedByMe(item.id)
                            const itemComments = comments[item.id] || []

                            return (
                                <div
                                    key={item.id}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    className="animate-fadeIn bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-gray-100 dark:border-slate-700 transition-all hover:shadow-xl"
                                >
                                    {item.image_url && (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-40 sm:h-48 object-cover rounded-xl mb-3 sm:mb-4"
                                        />
                                    )}
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                        {item.title}
                                    </h3>
                                    {item.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                            {item.description}
                                        </p>
                                    )}
                                    {item.estimated_price && ownerProfile && (
                                        <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                                            {formatPrice(item.estimated_price, ownerProfile.currency)}
                                        </p>
                                    )}
                                    {item.link && (
                                        <a
                                            href={item.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm mb-3 block truncate"
                                        >
                                            🔗 Ссылка
                                        </a>
                                    )}

                                    {/* Кто забронировал */}
                                    {!isMyWishlist && (item as any).reservers && (item as any).reservers.length > 0 && (
                                        <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                                            <div className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">
                                                ✅ Забронировано ({(item as any).reservers.length})
                                            </div>
                                            <div className="space-y-1">
                                                {(item as any).reservers.map((reserver: any) => (
                                                    <div key={reserver.id} className="flex items-center gap-2">
                                                        {reserver.profile?.avatar_url ? (
                                                            <img
                                                                src={reserver.profile.avatar_url}
                                                                alt="Avatar"
                                                                className="w-6 h-6 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                                {reserver.profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                            {reserver.profile?.display_name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Комментарии */}
                                    {itemComments.length > 0 && (
                                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg max-h-32 overflow-y-auto scrollbar-hide">
                                            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                💬 Комментарии ({itemComments.length})
                                            </div>
                                            {itemComments.map((comment) => (
                                                <div key={comment.id} className="mb-2 last:mb-0">
                                                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                        {comment.user_profile?.display_name}
                                                    </div>
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        {comment.comment}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Кнопки */}
                                    <div className="space-y-2">
                                        {!isMyWishlist && (
                                            <>
                                                {reserved ? (
                                                    <button
                                                        onClick={() => handleCancelReservation(item.id)}
                                                        className="w-full py-2 px-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg font-semibold transition text-sm"
                                                    >
                                                        ✅ Забронировано
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReserve(item.id)}
                                                        className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold text-sm"
                                                    >
                                                        🎁 Я подарю это
                                                    </button>
                                                )}

                                                {/* Кнопка складчины */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedContributionItem(item)
                                                        setShowContributionModal(true)
                                                    }}
                                                    className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition font-semibold text-sm"
                                                >
                                                    💰 Складчина
                                                    {item.contributed_amount && item.contributed_amount > 0 && (
                                                        <span className="ml-1 text-xs">
                                                            ({formatPrice(item.contributed_amount, ownerProfile?.currency || 'UAH')})
                                                        </span>
                                                    )}
                                                </button>

                                                <button
                                                    onClick={() => setSelectedItem(item)}
                                                    className="w-full py-2 px-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg font-semibold transition text-sm"
                                                >
                                                    💬 Комментировать
                                                </button>
                                            </>
                                        )}

                                        {isMyWishlist && (
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="w-full py-2 px-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm"
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Модалка добавления */}
            {showAddModal && (
                <AddItemModal
                    user={user}
                    collections={collections}
                    currency={profile?.currency || 'UAH'}
                    groupId={groupId}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadData}
                />
            )}

            {/* Модалка комментирования */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex justify-between items-center">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                                Добавить комментарий
                            </h2>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-3xl sm:text-2xl w-10 h-10 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-4 sm:p-6">
                            <p className="font-semibold text-gray-800 dark:text-gray-100 mb-4 line-clamp-2">
                                {selectedItem.title}
                            </p>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Ваш комментарий..."
                                rows={4}
                                className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800 mb-4"
                            />
                            <button
                                onClick={() => handleAddComment(selectedItem.id)}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                            >
                                Отправить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка складчины */}
            {showContributionModal && selectedContributionItem && ownerProfile && (
                <ContributionModal
                    user={user}
                    item={selectedContributionItem}
                    ownerCurrency={ownerProfile.currency}
                    onClose={() => {
                        setShowContributionModal(false)
                        setSelectedContributionItem(null)
                    }}
                    onSuccess={loadData}
                />
            )}
        </div>
    )
}
