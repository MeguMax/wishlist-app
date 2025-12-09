import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Collection } from '../types/database'
import { uploadWishlistImage } from '../lib/uploadImage'
import toast from 'react-hot-toast'

interface AddItemModalProps {
    user: User
    collections: Collection[]
    currency: string
    groupId?: string
    onClose: () => void
    onSuccess: () => void
}

export default function AddItemModal({ user, collections, currency, groupId, onClose, onSuccess }: AddItemModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [link, setLink] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [estimatedPrice, setEstimatedPrice] = useState('')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
    const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public')
    const [collectionId, setCollectionId] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (submitted || loading) return

        setLoading(true)
        setSubmitted(true)

        try {
            let finalImageUrl = imageUrl

            if (imageFile) {
                setUploadingImage(true)
                const uploadedUrl = await uploadWishlistImage(user.id, imageFile)
                if (uploadedUrl) {
                    finalImageUrl = uploadedUrl
                } else {
                    toast.error('Ошибка загрузки картинки')
                    setUploadingImage(false)
                    setSubmitted(false)
                    setLoading(false)
                    return
                }
                setUploadingImage(false)
            }

            const { error } = await supabase.from('wishlist_items').insert({
                user_id: user.id,
                title,
                description: description || null,
                link: link || null,
                image_url: finalImageUrl || null,
                estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : null,
                priority,
                visibility,
                collection_id: collectionId,
                group_id: groupId || null,
            })

            if (error) {
                toast.error('Ошибка: ' + error.message)
                setSubmitted(false)
                setLoading(false)
            } else {
                toast.success('Желание добавлено! 🎁')
                onSuccess()
                onClose()
            }
        } catch (error) {
            console.error('Error:', error)
            toast.error('Произошла ошибка')
            setSubmitted(false)
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {groupId ? 'Добавить в группу' : 'Добавить желание'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl sm:text-2xl w-10 h-10 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4 pb-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Название *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Описание
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Ссылка на товар
                        </label>
                        <input
                            type="url"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://example.com/product"
                            className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Картинка
                        </label>

                        {(imageUrl || imageFile) && (
                            <div className="mb-3">
                                <img
                                    src={imageFile ? URL.createObjectURL(imageFile) : imageUrl}
                                    alt="Preview"
                                    className="w-full h-40 sm:h-48 object-cover rounded-xl"
                                />
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="block">
                                <span className="sr-only">Выберите картинку</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error('Файл слишком большой (макс. 5 МБ)')
                                                return
                                            }
                                            setImageFile(file)
                                            setImageUrl('')
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                                        file:mr-3 sm:file:mr-4 file:py-2 file:px-3 sm:file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-purple-50 file:text-purple-700
                                        dark:file:bg-purple-900 dark:file:text-purple-200
                                        hover:file:bg-purple-100 dark:hover:file:bg-purple-800
                                        cursor-pointer"
                                />
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                или введите ссылку ниже (макс. 5 МБ)
                            </p>
                        </div>

                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => {
                                setImageUrl(e.target.value)
                                setImageFile(null)
                            }}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Примерная цена ({currency})
                        </label>
                        <input
                            type="number"
                            value={estimatedPrice}
                            onChange={(e) => setEstimatedPrice(e.target.value)}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Приоритет
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            >
                                <option value="low">Низкий</option>
                                <option value="medium">Средний</option>
                                <option value="high">Высокий</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Видимость
                            </label>
                            <select
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value as 'public' | 'friends' | 'private')}
                                className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            >
                                <option value="public">🌍 Публично</option>
                                <option value="friends">👥 Друзья</option>
                                <option value="private">🔒 Только я</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Коллекция
                        </label>
                        <select
                            value={collectionId || ''}
                            onChange={(e) => setCollectionId(e.target.value || null)}
                            className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                        >
                            <option value="">Без коллекции</option>
                            {collections.map((collection) => (
                                <option key={collection.id} value={collection.id}>
                                    {collection.emoji} {collection.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitted}
                            className="order-2 sm:order-1 flex-1 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-xl font-semibold transition disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={loading || submitted || uploadingImage}
                            className="order-1 sm:order-2 flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold disabled:opacity-50"
                        >
                            {uploadingImage ? 'Загрузка...' : loading ? 'Добавление...' : 'Добавить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
