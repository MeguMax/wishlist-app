import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, WishlistItem } from '../types/database'
import Navbar from '../components/Navbar'
import { formatPrice } from '../lib/currency'

interface Stats {
    totalItems: number
    totalPrice: number
    reservedByMe: number
    reservedForMe: number
    completedGifts: number
    itemsByPriority: Record<string, number>
    recentItems: WishlistItem[]
}

export default function Statistics({ user }: { user: User }) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [stats, setStats] = useState<Stats>({
        totalItems: 0,
        totalPrice: 0,
        reservedByMe: 0,
        reservedForMe: 0,
        completedGifts: 0,
        itemsByPriority: {},
        recentItems: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        try {
            // Профиль
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setProfile(profileData)

            // Все желания пользователя
            const { data: itemsData } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', user.id)

            // Бронирования МНОЙ
            const { data: myReservationsData } = await supabase
                .from('gift_reservations')
                .select('*')
                .eq('reserved_by', user.id)
                .in('status', ['active'])

            // Бронирования ДЛЯ МЕНЯ
            const myItemIds = itemsData?.map(item => item.id) || []
            const { data: reservedForMeData } = await supabase
                .from('gift_reservations')
                .select('*')
                .in('item_id', myItemIds)
                .in('status', ['active'])

            // Подаренные подарки
            const { data: completedData } = await supabase
                .from('gift_reservations')
                .select('*')
                .eq('reserved_by', user.id)
                .eq('status', 'completed')

            // Подсчёт статистики
            const totalPrice = itemsData?.reduce((sum, item) => sum + (item.estimated_price || 0), 0) || 0

            const itemsByPriority: Record<string, number> = {}
            itemsData?.forEach(item => {
                const priority = item.priority || 'medium'
                itemsByPriority[priority] = (itemsByPriority[priority] || 0) + 1
            })

            // Последние 5 желаний
            const recentItems = itemsData
                ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5) || []

            setStats({
                totalItems: itemsData?.length || 0,
                totalPrice,
                reservedByMe: myReservationsData?.length || 0,
                reservedForMe: reservedForMeData?.length || 0,
                completedGifts: completedData?.length || 0,
                itemsByPriority,
                recentItems
            })
        } catch (error) {
            console.error('Error loading statistics:', error)
        } finally {
            setLoading(false)
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
                    Статистика 📊
                </h1>

                {/* Основные показатели */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 sm:mb-8">
                    {/* Всего желаний */}
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="text-4xl sm:text-5xl mb-2">🎁</div>
                        <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.totalItems}</div>
                        <div className="text-sm sm:text-base text-blue-100">Всего желаний</div>
                    </div>

                    {/* Общая стоимость */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="text-4xl sm:text-5xl mb-2">💰</div>
                        <div className="text-2xl sm:text-3xl font-bold mb-1">
                            {formatPrice(stats.totalPrice, profile?.currency || 'UAH')}
                        </div>
                        <div className="text-sm sm:text-base text-green-100">Общая стоимость</div>
                    </div>

                    {/* Забронировано мной */}
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="text-4xl sm:text-5xl mb-2">🎀</div>
                        <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.reservedByMe}</div>
                        <div className="text-sm sm:text-base text-pink-100">Забронировано мной</div>
                    </div>

                    {/* Забронировано для меня */}
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="text-4xl sm:text-5xl mb-2">🎊</div>
                        <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.reservedForMe}</div>
                        <div className="text-sm sm:text-base text-yellow-100">Забронировано для меня</div>
                    </div>

                    {/* Подаренные подарки */}
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="text-4xl sm:text-5xl mb-2">✨</div>
                        <div className="text-3xl sm:text-4xl font-bold mb-1">{stats.completedGifts}</div>
                        <div className="text-sm sm:text-base text-indigo-100">Подарено</div>
                    </div>

                    {/* Средняя цена */}
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-xl p-6 text-white">
                        <div className="text-4xl sm:text-5xl mb-2">📈</div>
                        <div className="text-2xl sm:text-3xl font-bold mb-1">
                            {stats.totalItems > 0
                                ? formatPrice(stats.totalPrice / stats.totalItems, profile?.currency || 'UAH')
                                : formatPrice(0, profile?.currency || 'UAH')}
                        </div>
                        <div className="text-sm sm:text-base text-purple-100">Средняя цена</div>
                    </div>
                </div>

                {/* Приоритеты */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                        Приоритет желаний
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
                            <div className="text-3xl mb-2">🔥</div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {stats.itemsByPriority['high'] || 0}
                            </div>
                            <div className="text-sm text-red-600 dark:text-red-400">Высокий</div>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border-2 border-yellow-200 dark:border-yellow-800">
                            <div className="text-3xl mb-2">⭐</div>
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                {stats.itemsByPriority['medium'] || 0}
                            </div>
                            <div className="text-sm text-yellow-600 dark:text-yellow-400">Средний</div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                            <div className="text-3xl mb-2">💚</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.itemsByPriority['low'] || 0}
                            </div>
                            <div className="text-sm text-green-600 dark:text-green-400">Низкий</div>
                        </div>
                    </div>
                </div>

                {/* Последние желания */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                        Последние добавленные желания
                    </h2>

                    {stats.recentItems.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                            Пока нет желаний
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    className="animate-fadeIn bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 flex items-center gap-4 border-2 border-gray-100 dark:border-slate-700"
                                >
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-2xl sm:text-3xl">
                                            🎁
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1 truncate">
                                            {item.title}
                                        </h3>
                                        {item.estimated_price && (
                                            <p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-300">
                                                {formatPrice(item.estimated_price, profile?.currency || 'UAH')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(item.created_at).toLocaleDateString('ru-RU', {
                                            day: 'numeric',
                                            month: 'short'
                                        })}
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
