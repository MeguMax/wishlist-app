import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, Collection } from '../types/database'
import Navbar from '../components/Navbar'
import { uploadAvatar } from '../lib/uploadImage'
import toast from 'react-hot-toast'

export default function Settings({ user }: { user: User }) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [collections, setCollections] = useState<Collection[]>([])
    const [loading, setLoading] = useState(true)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    // Форма профиля
    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [currency, setCurrency] = useState<'UAH' | 'USD' | 'EUR' | 'RUB' | 'PLN' | 'GBP'>('UAH')

    // Форма коллекций
    const [newCollectionName, setNewCollectionName] = useState('')
    const [newCollectionEmoji, setNewCollectionEmoji] = useState('📦')

    useEffect(() => {
        loadData()
    }, [user])

    const loadData = async () => {
        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (profileData) {
            setProfile(profileData)
            setUsername(profileData.username)
            setDisplayName(profileData.display_name || '')
            setBio(profileData.bio || '')
            setAvatarUrl(profileData.avatar_url || '')
            setCurrency(profileData.currency)
        }

        const { data: collectionsData } = await supabase
            .from('collections')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        setCollections(collectionsData || [])
        setLoading(false)
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            let finalAvatarUrl = avatarUrl

            // Если выбран файл, загружаем его
            if (avatarFile) {
                setUploadingAvatar(true)
                const uploadedUrl = await uploadAvatar(user.id, avatarFile)
                if (uploadedUrl) {
                    finalAvatarUrl = uploadedUrl
                } else {
                    toast.error('Ошибка загрузки аватарки')
                    setUploadingAvatar(false)
                    return
                }
                setUploadingAvatar(false)
            }

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    username,
                    display_name: displayName,
                    bio,
                    avatar_url: finalAvatarUrl,
                    currency,
                })
                .eq('user_id', user.id)

            if (error) {
                toast.error('Ошибка: ' + error.message)
            } else {
                toast.success('Профиль обновлён! ✨')
                setAvatarFile(null)
                loadData()
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Произошла ошибка')
        }
    }

    const handleCreateCollection = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newCollectionName.trim()) {
            toast.error('Введите название коллекции')
            return
        }

        const { error } = await supabase.from('collections').insert({
            user_id: user.id,
            name: newCollectionName,
            emoji: newCollectionEmoji,
        })

        if (error) {
            toast.error('Ошибка: ' + error.message)
        } else {
            toast.success('Коллекция создана! 📦')
            setNewCollectionName('')
            setNewCollectionEmoji('📦')
            loadData()
        }
    }

    const handleDeleteCollection = async (collectionId: string) => {
        if (confirm('Удалить коллекцию? Желания из неё останутся, но станут без коллекции.')) {
            const { error } = await supabase.from('collections').delete().eq('id', collectionId)
            if (error) {
                toast.error('Ошибка удаления')
            } else {
                toast.success('Коллекция удалена! 🗑️')
                loadData()
            }
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

            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-8">Настройки</h1>

                {/* Настройки профиля */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Профиль</h2>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Username (будет в ссылке)
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                required
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Ваша ссылка: {window.location.origin}/u/{username}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Отображаемое имя
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                О себе
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            />
                        </div>

                        {/* НОВОЕ: Загрузка аватарки */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Аватар
                            </label>

                            {/* Превью текущей аватарки */}
                            {(avatarUrl || avatarFile) && (
                                <div className="mb-3">
                                    <img
                                        src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl}
                                        alt="Avatar preview"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-purple-200 dark:border-purple-800"
                                    />
                                </div>
                            )}

                            {/* Загрузка файла */}
                            <div className="mb-3">
                                <label className="block">
                                    <span className="sr-only">Выберите аватарку</span>
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
                                                setAvatarFile(file)
                                                setAvatarUrl('') // Очищаем URL если загружается файл
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                                            file:mr-4 file:py-2 file:px-4
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

                            {/* Ссылка на аватарку */}
                            <input
                                type="url"
                                value={avatarUrl}
                                onChange={(e) => {
                                    setAvatarUrl(e.target.value)
                                    setAvatarFile(null) // Очищаем файл если вводится URL
                                }}
                                placeholder="https://example.com/avatar.jpg"
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Валюта
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as 'UAH' | 'USD' | 'EUR' | 'RUB' | 'PLN' | 'GBP')}
                                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            >
                                <option value="UAH">🇺🇦 ₴ UAH (гривна)</option>
                                <option value="USD">🇺🇸 $ USD (доллар)</option>
                                <option value="EUR">🇪🇺 € EUR (евро)</option>
                                <option value="RUB">🇷🇺 ₽ RUB (рубль)</option>
                                <option value="PLN">🇵🇱 zł PLN (злотый)</option>
                                <option value="GBP">🇬🇧 £ GBP (фунт)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={uploadingAvatar}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold disabled:opacity-50"
                        >
                            {uploadingAvatar ? 'Загрузка...' : 'Сохранить изменения'}
                        </button>
                    </form>
                </div>

                {/* Управление коллекциями */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Коллекции</h2>

                    <form onSubmit={handleCreateCollection} className="mb-6">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newCollectionEmoji}
                                onChange={(e) => setNewCollectionEmoji(e.target.value)}
                                placeholder="📦"
                                maxLength={2}
                                className="w-16 px-3 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl dark:bg-slate-800"
                            />
                            <input
                                type="text"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                placeholder="Название коллекции"
                                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                            >
                                Создать
                            </button>
                        </div>
                    </form>

                    <div className="space-y-3">
                        {collections.length === 0 ? (
                            <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                                Нет коллекций. Создайте первую!
                            </p>
                        ) : (
                            collections.map((collection) => (
                                <div
                                    key={collection.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{collection.emoji}</span>
                                        <span className="font-semibold text-gray-800 dark:text-gray-100">
                                            {collection.name}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCollection(collection.id)}
                                        className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
