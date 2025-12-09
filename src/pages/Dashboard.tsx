import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Group {
    id: string
    name: string
    description: string
    created_by: string
}

export default function Dashboard({ user }: { user: User }) {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        loadGroups()
    }, [])

    const loadGroups = async () => {
        const { data } = await supabase
            .from('groups')
            .select('*')
            .or(`created_by.eq.${user.id}`)

        if (data) setGroups(data)
        setLoading(false)
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        navigate('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
                <div className="text-2xl font-bold text-gray-600">Загрузка...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
            <nav className="bg-white/80 backdrop-blur shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🎁</span>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Wishlist
                        </h1>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Привет,</div>
                            <div className="font-medium text-gray-800">{user.user_metadata.name || user.email}</div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Мои группы</h2>
                        <p className="text-gray-600">Управляйте группами и вишлистами</p>
                    </div>
                    <Link
                        to="/groups/new"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Создать группу
                    </Link>
                </div>

                {groups.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Пока пусто</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Создайте первую группу, чтобы начать собирать вишлисты с друзьями
                        </p>
                        <Link
                            to="/groups/new"
                            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                        >
                            Создать первую группу
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map((group) => (
                            <Link
                                key={group.id}
                                to={`/groups/${group.id}`}
                                className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all hover:-translate-y-1 border border-gray-100"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="text-4xl">👥</div>
                                    {group.created_by === user.id && (
                                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full font-semibold">
                      Создатель
                    </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{group.name}</h3>
                                {group.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2">{group.description}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
