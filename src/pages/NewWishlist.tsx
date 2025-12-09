import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function NewWishlist({ user }: { user: User }) {
    const { groupId } = useParams()
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: wishlist, error } = await supabase
            .from('wishlists')
            .insert({
                group_id: groupId,
                user_id: user.id,
                name,
            })
            .select()
            .single()

        if (!error && wishlist) {
            navigate(`/groups/${groupId}/wishlists/${wishlist.id}`)
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <nav className="bg-white/80 backdrop-blur shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link to={`/groups/${groupId}`} className="text-2xl">←</Link>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🎁</span>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Wishlist
                        </h1>
                    </div>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto px-4 py-12">
                <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-3">📝</div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Создать вишлист</h2>
                        <p className="text-gray-600">Добавьте свои желания</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                Название вишлиста *
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Например: День рождения 2025"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50"
                            >
                                {loading ? 'Создание...' : 'Создать вишлист'}
                            </button>
                            <Link
                                to={`/groups/${groupId}`}
                                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-semibold"
                            >
                                Отмена
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}
