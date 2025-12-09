import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, WishlistItem, Collection } from '../types/database'
import Navbar from '../components/Navbar'
import AddItemModal from '../components/AddItemModal'
import { formatPrice } from '../lib/currency'
import ItemDetailModal from '../components/ItemDetailModal'
import toast from 'react-hot-toast'

type SortBy = 'created_desc' | 'created_asc' | 'priority' | 'price_desc' | 'price_asc'

interface MyWishlistProps {
    user: User
}

export default function MyWishlist({ user }: MyWishlistProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [collections, setCollections] = useState<Collection[]>([])
    const [items, setItems] = useState<WishlistItem[]>([])
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)

    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<SortBy>('created_desc')
    const [onlyWithPrice, setOnlyWithPrice] = useState(false)
    const [onlyWithImage, setOnlyWithImage] = useState(false)
    const [onlyReserved, setOnlyReserved] = useState(false)

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

            const { data: collectionsData } = await supabase
                .from('collections')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            const { data: itemsData } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            setProfile(profileData)
            setCollections(collectionsData || [])
            setItems(itemsData || [])
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteItem = async (itemId: string) => {
        if (!confirm('Удалить это желание?')) return

        try {
            await toast.promise(
                supabase.from('wishlist_items').delete().eq('id', itemId),
                {
                    loading: 'Удаление...',
                    success: 'Желание удалено! 🗑️',
                    error: 'Ошибка при удалении',
                }
            )
            await loadData()
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const copyShareLink = () => {
        const link = `${window.location.origin}/u/${profile?.username}`
        navigator.clipboard.writeText(link)
        toast.success('Ссылка скопирована! 📋')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
                <div className="spinner"></div>
                <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-200">Загрузка...</p>
            </div>
        )
    }

    // Фильтрация и сортировка
    let filteredItems = selectedCollection
        ? items.filter((item) => item.collection_id === selectedCollection)
        : items.filter((item) => !item.collection_id)

    const searchLower = search.trim().toLowerCase()
    if (searchLower) {
        filteredItems = filteredItems.filter((item) => {
            const title = item.title.toLowerCase()
            const desc = (item.description || '').toLowerCase()
            return title.includes(searchLower) || desc.includes(searchLower)
        })
    }

    if (onlyWithPrice) {
        filteredItems = filteredItems.filter((item) => item.estimated_price && item.estimated_price > 0)
    }
    if (onlyWithImage) {
        filteredItems = filteredItems.filter((item) => !!item.image_url)
    }
    if (onlyReserved) {
        filteredItems = filteredItems.filter((item) => item.reserved_count > 0)
    }

    const priorityOrder: Record<'low' | 'medium' | 'high', number> = {
        low: 2,
        medium: 1,
        high: 0,
    }

    filteredItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case 'created_asc':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            case 'created_desc':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            case 'priority':
                return priorityOrder[a.priority] - priorityOrder[b.priority]
            case 'price_asc':
                return (a.estimated_price || 0) - (b.estimated_price || 0)
            case 'price_desc':
                return (b.estimated_price || 0) - (a.estimated_price || 0)
            default:
                return 0
        }
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <Navbar user={user} profile={profile} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Заголовок */}
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Мой вишлист
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Добавляйте желания и делитесь с друзьями
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={copyShareLink}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-white dark:bg-slate-800 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-slate-700 transition-all shadow-lg font-semibold"
                        >
                            📋 Поделиться
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                        >
                            + Добавить
                        </button>
                    </div>
                </div>

                {/* Поиск + фильтры */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск..."
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        >
                            <option value="created_desc">Новые сверху</option>
                            <option value="created_asc">Старые сверху</option>
                            <option value="priority">По приоритету</option>
                            <option value="price_desc">Дороже сначала</option>
                            <option value="price_asc">Дешевле сначала</option>
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={onlyWithPrice}
                                onChange={(e) => setOnlyWithPrice(e.target.checked)}
                                className="w-4 h-4"
                            />
                            С ценой
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={onlyWithImage}
                                onChange={(e) => setOnlyWithImage(e.target.checked)}
                                className="w-4 h-4"
                            />
                            С картинкой
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={onlyReserved}
                                onChange={(e) => setOnlyReserved(e.target.checked)}
                                className="w-4 h-4"
                            />
                            Забронированные
                        </label>
                    </div>
                </div>

                {/* Коллекции */}
                <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCollection(null)}
                        className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-semibold whitespace-nowrap transition ${
                            !selectedCollection
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-100'
                        }`}
                    >
                        📦 Все
                    </button>
                    {collections.map((collection) => (
                        <button
                            key={collection.id}
                            onClick={() => setSelectedCollection(collection.id)}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-sm sm:text-base font-semibold whitespace-nowrap transition ${
                                selectedCollection === collection.id
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-100'
                            }`}
                        >
                            {collection.emoji} {collection.name}
                        </button>
                    ))}
                    <Link
                        to="/settings"
                        className="px-3 sm:px-4 py-2 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-100 rounded-xl font-semibold whitespace-nowrap text-sm sm:text-base"
                    >
                        ⚙️ Управление
                    </Link>
                </div>

                {/* Список */}
                {filteredItems.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                        <div className="text-5xl sm:text-6xl mb-4">🎁</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Пока пусто
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                            Добавьте первое желание
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                        >
                            + Добавить желание
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {filteredItems.map((item, index) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                className={`animate-fadeIn bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border-2 transition-all hover:shadow-xl active:scale-95 cursor-pointer ${
                                    item.priority === 'high'
                                        ? 'border-red-300 dark:border-red-700'
                                        : item.priority === 'medium'
                                            ? 'border-yellow-300 dark:border-yellow-700'
                                            : 'border-gray-100 dark:border-slate-700'
                                }`}
                            >
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-40 sm:h-48 object-cover rounded-xl mb-3 sm:mb-4"
                                    />
                                )}

                                <div className="flex items-start justify-between mb-2 gap-2">
                                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 flex-1 line-clamp-2">
                                        {item.title}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                            item.visibility === 'public'
                                                ? 'bg-green-100 text-green-700'
                                                : item.visibility === 'friends'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {item.visibility === 'public'
                                            ? '🌍'
                                            : item.visibility === 'friends'
                                                ? '👥'
                                                : '🔒'}
                                    </span>
                                </div>

                                {item.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                        {item.description}
                                    </p>
                                )}

                                {item.estimated_price && (
                                    <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                                        {formatPrice(item.estimated_price, profile?.currency)}
                                    </p>
                                )}

                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm mb-3 block truncate"
                                    >
                                        🔗 Ссылка
                                    </a>
                                )}

                                {item.reserved_count > 0 && (
                                    <div className="mb-3 p-2 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg text-xs sm:text-sm font-semibold text-center">
                                        ✨ {item.reserved_count} заинтересован
                                    </div>
                                )}

                                <div className="mb-3 text-center text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                    👁️ Нажмите для деталей
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteItem(item.id)
                                    }}
                                    className="w-full py-2 px-4 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm sm:text-base"
                                >
                                    Удалить
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {showAddModal && (
                <AddItemModal
                    user={user}
                    collections={collections}
                    currency={profile?.currency || 'UAH'}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadData}
                />
            )}

            {selectedItem && profile && (
                <ItemDetailModal
                    item={selectedItem}
                    currentUser={user}
                    ownerProfile={profile}
                    onClose={() => setSelectedItem(null)}
                    onUpdate={loadData}
                />
            )}
        </div>
    )
}
