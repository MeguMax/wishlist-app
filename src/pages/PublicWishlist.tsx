import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { UserProfile, WishlistItem } from '../types/database'
import { formatPrice } from '../lib/currency'

export default function PublicWishlist() {
    const { token } = useParams<{ token: string }>()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [items, setItems] = useState<WishlistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        loadData()
    }, [token])

    const loadData = async () => {
        try {
            // Находим пользователя по токену
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('wishlist_token', token)
                .eq('wishlist_public', true)
                .single()

            if (profileError || !profileData) {
                setError(true)
                setLoading(false)
                return
            }

            setProfile(profileData)

            // Загружаем публичные желания (без группы)
            const { data: itemsData } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', profileData.user_id)
                .is('group_id', null)
                .order('created_at', { ascending: false })

            setItems(itemsData || [])
        } catch (error) {
            console.error('Error loading public wishlist:', error)
            setError(true)
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

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black p-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        Вишлист не найден
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Эта ссылка недействительна или вишлист больше не является публичным
                    </p>
                    <Link
                        to="/login"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                    >
                        Войти в аккаунт
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            {/* Шапка */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <span className="text-2xl">🎁</span>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Wishlist
              </span>
                        </Link>
                        <Link
                            to="/login"
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold text-sm"
                        >
                            Войти
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Профиль */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8 text-center">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="Avatar"
                            className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mx-auto mb-4"
                        />
                    ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold mx-auto mb-4">
                            {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                    )}
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        Вишлист {profile.display_name}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                        @{profile.username}
                    </p>
                    {profile.bio && (
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* Список желаний */}
                {items.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                        <div className="text-5xl sm:text-6xl mb-4">🎁</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Пока нет желаний
                        </h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                className="animate-fadeIn bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-gray-100 dark:border-slate-700"
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
                                {item.estimated_price && (
                                    <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                                        {formatPrice(item.estimated_price, profile.currency)}
                                    </p>
                                )}
                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold text-sm text-center"
                                    >
                                        🔗 Посмотреть товар
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Призыв создать свой вишлист */}
                <div className="mt-8 sm:mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 sm:p-8 text-center text-white">
                    <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                        Создайте свой вишлист! 🎁
                    </h3>
                    <p className="text-sm sm:text-base mb-6 opacity-90">
                        Делитесь своими желаниями с друзьями и близкими
                    </p>
                    <Link
                        to="/register"
                        className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition font-semibold shadow-lg"
                    >
                        Регистрация бесплатно
                    </Link>
                </div>
            </main>
        </div>
    )
}
