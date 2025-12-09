import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, Group } from '../types/database'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'

interface GroupWithMembers extends Group {
    member_count?: number
}

export default function Groups({ user }: { user: User }) {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [groups, setGroups] = useState<GroupWithMembers[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [newGroupDescription, setNewGroupDescription] = useState('')

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

            const { data: membershipData } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id)

            const groupIds = (membershipData || []).map(m => m.group_id)

            if (groupIds.length > 0) {
                const { data: groupsData } = await supabase
                    .from('groups')
                    .select('*')
                    .in('id', groupIds)
                    .order('created_at', { ascending: false })

                const groupsWithCounts = await Promise.all(
                    (groupsData || []).map(async (group) => {
                        const { count } = await supabase
                            .from('group_members')
                            .select('*', { count: 'exact', head: true })
                            .eq('group_id', group.id)

                        return { ...group, member_count: count || 0 }
                    })
                )

                setGroups(groupsWithCounts)
            } else {
                setGroups([])
            }
        } catch (error) {
            console.error('Error loading groups:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newGroupName.trim()) {
            toast.error('Введите название группы')
            return
        }

        try {
            const { data: newGroup, error: groupError } = await supabase
                .from('groups')
                .insert({
                    name: newGroupName.trim(),
                    description: newGroupDescription.trim() || null,
                    creator_id: user.id,
                })
                .select()
                .single()

            if (groupError) {
                console.error('Group creation error:', groupError)
                throw groupError
            }

            const { data: existingMember } = await supabase
                .from('group_members')
                .select('id')
                .eq('group_id', newGroup.id)
                .eq('user_id', user.id)
                .maybeSingle()

            if (!existingMember) {
                const { error: memberError } = await supabase
                    .from('group_members')
                    .insert({
                        group_id: newGroup.id,
                        user_id: user.id,
                        role: 'admin',
                    })

                if (memberError) {
                    console.error('Member insertion error:', memberError)
                }
            }

            toast.success('Группа создана! 🎉')
            setNewGroupName('')
            setNewGroupDescription('')
            setShowCreateModal(false)
            await loadData()
        } catch (error: any) {
            console.error('Error creating group:', error)
            toast.error('Ошибка: ' + (error.message || 'Не удалось создать группу'))
        }
    }

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Удалить группу? Все участники будут удалены.')) return

        try {
            await toast.promise(
                supabase.from('groups').delete().eq('id', groupId),
                {
                    loading: 'Удаление...',
                    success: 'Группа удалена! 🗑️',
                    error: 'Ошибка при удалении',
                }
            )
            await loadData()
        } catch (error) {
            console.error('Error deleting group:', error)
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
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Группы
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                            Создавайте группы и делитесь вишлистами
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                    >
                        + Создать группу
                    </button>
                </div>

                {groups.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                        <div className="text-5xl sm:text-6xl mb-4">👥</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Пока нет групп
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                            Создайте первую группу и добавьте друзей
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                        >
                            + Создать группу
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {groups.map((group, index) => (
                            <div
                                key={group.id}
                                style={{ animationDelay: `${index * 0.05}s` }}
                                className="animate-fadeIn bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-lg p-4 sm:p-6 border-2 border-gray-100 dark:border-slate-700 transition-all hover:shadow-xl active:scale-95"
                            >
                                <div className="mb-4">
                                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                                        {group.name}
                                    </h3>
                                    {group.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                            {group.description}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    <span>👥 {group.member_count} участников</span>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Link
                                        to={`/groups/${group.id}`}
                                        className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition text-center font-semibold text-sm sm:text-base"
                                    >
                                        Открыть
                                    </Link>
                                    {group.creator_id === user.id && (
                                        <button
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm sm:text-base"
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Модалка */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                                Создать группу
                            </h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl sm:text-2xl w-10 h-10 flex items-center justify-center"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroup} className="p-4 sm:p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Название группы *
                                </label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Семья, Друзья, Коллеги..."
                                    className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Описание
                                </label>
                                <textarea
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    placeholder="О чём эта группа?"
                                    rows={3}
                                    className="w-full px-3 sm:px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="order-2 sm:order-1 flex-1 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-xl font-semibold transition"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="order-1 sm:order-2 flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                                >
                                    Создать
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
