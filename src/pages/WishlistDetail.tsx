import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Wishlist {
    id: string
    name: string
    user_id: string
    group_id: string
}

interface WishlistItem {
    id: string
    title: string
    description: string
    link: string
    image_url: string
    priority: string
    estimated_price: number
    is_suggestion: boolean
    suggested_by: string
    is_purchased: boolean
    purchased_by: string
}

export default function WishlistDetail({ user }: { user: User }) {
    const { groupId, wishlistId } = useParams()
    const [wishlist, setWishlist] = useState<Wishlist | null>(null)
    const [items, setItems] = useState<WishlistItem[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)

    // Форма добавления
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [link, setLink] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [priority, setPriority] = useState('medium')
    const [estimatedPrice, setEstimatedPrice] = useState('')

    useEffect(() => {
        loadWishlistData()
    }, [wishlistId])

    const loadWishlistData = async () => {
        if (!wishlistId) return

        const { data: wishlistData } = await supabase
            .from('wishlists')
            .select('*')
            .eq('id', wishlistId)
            .single()

        const { data: itemsData } = await supabase
            .from('wishlist_items')
            .select('*')
            .eq('wishlist_id', wishlistId)
            .order('created_at', { ascending: false })

        setWishlist(wishlistData)
        setItems(itemsData || [])
        setLoading(false)
    }

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault()

        const { error } = await supabase.from('wishlist_items').insert({
            wishlist_id: wishlistId,
            title,
            description,
            link,
            image_url: imageUrl,
            priority,
            estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
            is_suggestion: wishlist?.user_id !== user.id,
            suggested_by: wishlist?.user_id !== user.id ? user.id : null,
        })

        if (!error) {
            setTitle('')
            setDescription('')
            setLink('')
            setImageUrl('')
            setEstimatedPrice('')
            setShowAddForm(false)
            loadWishlistData()
        }
    }

    const handleTogglePurchase = async (itemId: string, isPurchased: boolean) => {
        await supabase
            .from('wishlist_items')
            .update({
                is_purchased: !isPurchased,
                purchased_by: !isPurchased ? user.id : null,
            })
            .eq('id', itemId)

        loadWishlistData()
    }

    const handleDeleteItem = async (itemId: string) => {
        if (confirm('Удалить этот элемент?')) {
            await supabase.from('wishlist_items').delete().eq('id', itemId)
            loadWishlistData()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                <div className="text-2xl font-bold text-gray-600">Загрузка...</div>
            </div>
        )
    }

    if (!wishlist) {
        return <div>Вишлист не найден</div>
    }

    const isOwner = wishlist.user_id === user.id

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <nav className="bg-white/80 backdrop-blur shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to={`/groups/${groupId}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        ← Назад к группе
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">{wishlist.name}</h1>
                    {isOwner && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-semibold">
              Ваш вишлист
            </span>
                    )}
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isOwner ? 'Мои желания' : 'Список желаний'}
                    </h2>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                    >
                        {showAddForm ? '✕ Закрыть' : `+ ${isOwner ? 'Добавить желание' : 'Предложить подарок'}`}
                    </button>
                </div>

                {/* Форма добавления */}
                {showAddForm && (
                    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                            {isOwner ? 'Добавить желание' : 'Предложить подарок'}
                        </h3>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Название *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Например: Книга, Наушники"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Описание
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Дополнительная информация"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Ссылка
                                    </label>
                                    <input
                                        type="url"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        URL изображения
                                    </label>
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Приоритет
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    >
                                        <option value="low">Низкий</option>
                                        <option value="medium">Средний</option>
                                        <option value="high">Высокий</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Примерная цена (₽)
                                    </label>
                                    <input
                                        type="number"
                                        value={estimatedPrice}
                                        onChange={(e) => setEstimatedPrice(e.target.value)}
                                        placeholder="1000"
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                            >
                                Добавить
                            </button>
                        </form>
                    </div>
                )}

                {/* Список элементов */}
                {items.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-6xl mb-4">🎁</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Пока пусто</h3>
                        <p className="text-gray-600">
                            {isOwner ? 'Добавьте свои желания' : 'Предложите подарки для владельца вишлиста'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border-2 transition-all ${
                                    item.is_purchased
                                        ? 'border-green-300 opacity-75'
                                        : item.priority === 'high'
                                            ? 'border-red-300'
                                            : item.priority === 'medium'
                                                ? 'border-yellow-300'
                                                : 'border-gray-100'
                                }`}
                            >
                                {item.image_url && (
                                    <img
                                        src={item.image_url}
                                        alt={item.title}
                                        className="w-full h-48 object-cover rounded-xl mb-4"
                                    />
                                )}

                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="text-lg font-bold text-gray-800 flex-1">{item.title}</h3>
                                    {item.is_suggestion && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                      Предложение
                    </span>
                                    )}
                                </div>

                                {item.description && (
                                    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                                )}

                                {item.estimated_price && (
                                    <p className="text-lg font-bold text-gray-800 mb-3">
                                        ≈ {item.estimated_price} ₽
                                    </p>
                                )}

                                {item.link && (
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 text-sm mb-3 block truncate"
                                    >
                                        🔗 Ссылка на товар
                                    </a>
                                )}

                                <div className="flex gap-2 mt-4">
                                    {!isOwner && (
                                        <button
                                            onClick={() => handleTogglePurchase(item.id, item.is_purchased)}
                                            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                                                item.is_purchased
                                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                        >
                                            {item.is_purchased ? '✓ Куплено' : 'Отметить куплено'}
                                        </button>
                                    )}

                                    {isOwner && (
                                        <>
                                            {item.is_purchased && (
                                                <div className="flex-1 py-2 px-4 bg-green-100 text-green-700 rounded-lg font-semibold text-center">
                                                    ✓ Куплено
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="py-2 px-4 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-semibold transition"
                                            >
                                                Удалить
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
