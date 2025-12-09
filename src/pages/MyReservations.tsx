import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, WishlistItem, GiftReservation } from '../types/database'
import Navbar from '../components/Navbar'
import { formatPrice } from '../lib/currency'
import toast from 'react-hot-toast'

interface ReservationWithDetails extends GiftReservation {
    item?: WishlistItem
    owner?: UserProfile
}

export default function MyReservations({ user }: { user: User }) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        try {
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setProfile(profileData)

            // Загружаем активные бронирования
            const { data: reservationsData, error: reservationsError } = await supabase
                .from('gift_reservations')
                .select('*')
                .eq('reserved_by', user.id)
                .in('status', ['active']) // Показываем только активные
                .order('reserved_at', { ascending: false })

            if (reservationsError) {
                console.error('Error loading reservations:', reservationsError)
            }

            if (reservationsData && reservationsData.length > 0) {
                const enrichedReservations = await Promise.all(
                    reservationsData.map(async (reservation) => {
                        const { data: itemData } = await supabase
                            .from('wishlist_items')
                            .select('*')
                            .eq('id', reservation.item_id)
                            .single()

                        if (itemData) {
                            const { data: ownerData } = await supabase
                                .from('user_profiles')
                                .select('*')
                                .eq('user_id', itemData.user_id)
                                .single()

                            return { ...reservation, item: itemData, owner: ownerData }
                        }

                        return reservation
                    })
                )

                setReservations(enrichedReservations.filter(r => r.item))
            } else {
                setReservations([])
            }
        } catch (error) {
            console.error('Error loading reservations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancelReservation = async (reservationId: string) => {
        if (!confirm('Отменить бронирование?')) return

        try {
            const { error } = await supabase
                .from('gift_reservations')
                .delete()
                .eq('id', reservationId)

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

    const handleMarkCompleted = async (reservationId: string) => {
        if (!confirm('Отметить как подаренное?')) return

        try {
            const { error } = await supabase
                .from('gift_reservations')
                .update({ status: 'completed' })
                .eq('id', reservationId)

            if (error) {
                toast.error('Ошибка обновления')
            } else {
                toast.success('Отмечено как подаренное! 🎁')
                loadData()
            }
        } catch (error) {
            console.error('Error completing reservation:', error)
            toast.error('Произошла ошибка')
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
                    Мои бронирования 🎁
                </h1>

                {reservations.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                        <div className="text-5xl sm:text-6xl mb-4">📭</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Нет забронированных подарков
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                            Найдите вишлисты друзей и забронируйте подарки
                        </p>
                        <Link
                            to="/friends"
                            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                        >
                            Найти друзей
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {reservations.map((reservation, index) => (
                            <div
                                key={reservation.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                className="animate-fadeIn bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-green-200 dark:border-green-800"
                            >
                                {reservation.item?.image_url && (
                                    <img
                                        src={reservation.item.image_url}
                                        alt={reservation.item.title}
                                        className="w-full h-40 sm:h-48 object-cover rounded-xl mb-3 sm:mb-4"
                                    />
                                )}

                                <div className="mb-3">
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 px-2 py-1 rounded-full">
                    ✅ Забронировано
                  </span>
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                    {reservation.item?.title}
                                </h3>

                                {reservation.owner && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Для: <span className="font-semibold">{reservation.owner.display_name}</span>
                                        {' '}
                                        <Link
                                            to={`/u/${reservation.owner.username}`}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            @{reservation.owner.username}
                                        </Link>
                                    </p>
                                )}

                                {reservation.item?.estimated_price && reservation.owner && (
                                    <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                                        {formatPrice(reservation.item.estimated_price, reservation.owner.currency)}
                                    </p>
                                )}

                                {reservation.item?.link && (
                                    <a
                                        href={reservation.item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm mb-3 block truncate"
                                    >
                                        🔗 Ссылка на товар
                                    </a>
                                )}

                                {reservation.note && (
                                    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>Заметка:</strong> {reservation.note}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 mt-3">
                                    <button
                                        onClick={() => handleMarkCompleted(reservation.id)}
                                        className="w-full py-2 px-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 rounded-lg font-semibold transition text-sm sm:text-base"
                                    >
                                        ✓ Подарено
                                    </button>
                                    <button
                                        onClick={() => handleCancelReservation(reservation.id)}
                                        className="w-full py-2 px-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm sm:text-base"
                                    >
                                        Отменить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
