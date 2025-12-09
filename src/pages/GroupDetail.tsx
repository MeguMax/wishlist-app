import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, Group, GroupMember } from '../types/database'
import Navbar from '../components/Navbar'
import GroupChat from '../components/GroupChat'
import toast from 'react-hot-toast'

interface MemberWithProfile extends GroupMember {
    profile?: UserProfile
}

export default function GroupDetail({ user }: { user: User }) {
    const { groupId } = useParams<{ groupId: string }>()
    const navigate = useNavigate()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [group, setGroup] = useState<Group | null>(null)
    const [members, setMembers] = useState<MemberWithProfile[]>([])
    const [friends, setFriends] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedFriendId, setSelectedFriendId] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'members' | 'wishlists'>('members')
    const [showChat, setShowChat] = useState(false)

    useEffect(() => {
        if (!groupId) return
        loadData()
    }, [groupId, user])

    const loadData = async () => {
        if (!groupId) return

        try {
            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            setProfile(profileData)

            // Загружаем группу
            const { data: groupData } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single()

            setGroup(groupData)

            // Загружаем участников группы
            const { data: membersData } = await supabase
                .from('group_members')
                .select('*')
                .eq('group_id', groupId)

            // Для каждого участника загружаем профиль
            const membersWithProfiles = await Promise.all(
                (membersData || []).map(async (member) => {
                    const { data: memberProfile } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('user_id', member.user_id)
                        .single()

                    return { ...member, profile: memberProfile }
                })
            )

            setMembers(membersWithProfiles)

            // Загружаем друзей текущего пользователя (для добавления в группу)
            const { data: friendsData } = await supabase
                .rpc('get_user_friends', { p_user_id: user.id })

            const friendProfiles = (friendsData || []).map((f: any) => ({
                user_id: f.friend_id,
                username: f.friend_username,
                display_name: f.friend_display_name,
                avatar_url: f.friend_avatar_url,
                bio: null,
                currency: 'UAH',
                created_at: ''
            }))

            // Фильтруем друзей, которые уже не в группе
            const memberIds = membersWithProfiles.map(m => m.user_id)
            const availableFriends = friendProfiles.filter(
                (f: UserProfile) => !memberIds.includes(f.user_id)
            )

            setFriends(availableFriends)
        } catch (error) {
            console.error('Error loading group:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFriendId) {
            toast.error('Выберите друга')
            return
        }

        try {
            // Проверяем, не добавлен ли уже этот участник
            const { data: existingMember, error: checkError } = await supabase
                .from('group_members')
                .select('id')
                .eq('group_id', groupId)
                .eq('user_id', selectedFriendId)
                .maybeSingle()

            if (checkError) {
                console.error('Check error:', checkError)
            }

            if (existingMember) {
                toast.error('Этот друг уже в группе!')
                setSelectedFriendId('')
                setShowAddModal(false)
                return
            }

            // Добавляем участника
            const { error: insertError } = await supabase
                .from('group_members')
                .insert({
                    group_id: groupId,
                    user_id: selectedFriendId,
                    role: 'member',
                })

            if (insertError) {
                console.error('Insert error:', insertError)
                toast.error('Ошибка при добавлении: ' + insertError.message)
            } else {
                toast.success('Друг добавлен в группу! 👥')
                setSelectedFriendId('')
                setShowAddModal(false)
                await loadData()
            }
        } catch (error) {
            console.error('Error adding member:', error)
            toast.error('Произошла ошибка')
        }
    }

    const handleRemoveMember = async (memberId: string, memberUserId: string) => {
        if (memberUserId === group?.creator_id) {
            toast.error('Нельзя удалить создателя группы')
            return
        }

        if (!confirm('Удалить участника из группы?')) return

        try {
            const { error } = await supabase.from('group_members').delete().eq('id', memberId)

            if (error) {
                toast.error('Ошибка при удалении')
            } else {
                toast.success('Участник удалён! 🗑️')
            }

            await loadData()
        } catch (error) {
            console.error('Error removing member:', error)
        }
    }

    const handleLeaveGroup = async () => {
        if (group?.creator_id === user.id) {
            toast.error('Создатель группы не может выйти. Удалите группу или передайте права.')
            return
        }

        if (!confirm('Выйти из группы?')) return

        try {
            const myMembership = members.find(m => m.user_id === user.id)
            if (!myMembership) return

            const { error } = await supabase.from('group_members').delete().eq('id', myMembership.id)

            if (error) {
                toast.error('Ошибка при выходе')
            } else {
                toast.success('Вы вышли из группы')
                navigate('/groups')
            }

            navigate('/groups')
        } catch (error) {
            console.error('Error leaving group:', error)
        }
    }

    const isAdmin = members.find(m => m.user_id === user.id)?.role === 'admin'
    const isCreator = group?.creator_id === user.id

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
                <div className="spinner"></div>
                <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-200">Загрузка...</p>
            </div>
        )
    }

    if (!group) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Группа не найдена</h2>
                    <Link to="/groups" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
                        ← Назад к группам
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <Navbar user={user} profile={profile} />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Заголовок группы */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 mb-8">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">{group.name}</h1>
                            {group.description && (
                                <p className="text-gray-600 dark:text-gray-300 mb-4">{group.description}</p>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                👥 {members.length} участников
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {/* Кнопка чата */}
                            <button
                                onClick={() => setShowChat(true)}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg font-semibold"
                            >
                                💬 Чат
                            </button>

                            {(isAdmin || isCreator) && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                                >
                                    + Добавить участника
                                </button>
                            )}
                            {!isCreator && (
                                <button
                                    onClick={handleLeaveGroup}
                                    className="px-6 py-3 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-xl font-semibold transition"
                                >
                                    Выйти из группы
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Табы */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`px-6 py-3 rounded-xl font-semibold transition ${
                            activeTab === 'members'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        Участники ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('wishlists')}
                        className={`px-6 py-3 rounded-xl font-semibold transition ${
                            activeTab === 'wishlists'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        Вишлисты
                    </button>
                </div>

                {/* Список участников */}
                {activeTab === 'members' && (
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Участники группы</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {members.map((member, index) => (
                                <div
                                    key={member.id}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    className="animate-fadeIn bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border-2 border-gray-100 dark:border-slate-700"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        {member.profile?.avatar_url ? (
                                            <img
                                                src={member.profile.avatar_url}
                                                alt="Avatar"
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                                {member.profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800 dark:text-gray-100">
                                                {member.profile?.display_name}
                                                {member.user_id === group.creator_id && (
                                                    <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 px-2 py-1 rounded-full">
                                                        Создатель
                                                    </span>
                                                )}
                                                {member.role === 'admin' && member.user_id !== group.creator_id && (
                                                    <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-1 rounded-full">
                                                        Админ
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">@{member.profile?.username}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Link
                                            to={`/u/${member.profile?.username}`}
                                            className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition text-center font-semibold text-sm"
                                        >
                                            Вишлист
                                        </Link>
                                        {(isAdmin || isCreator) && member.user_id !== group.creator_id && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.user_id)}
                                                className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm"
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Вишлисты участников группы */}
                {activeTab === 'wishlists' && (
                    <div className="space-y-6">
                        {members.map((member) => (
                            <div
                                key={member.user_id}
                                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-6"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {member.profile?.avatar_url ? (
                                            <img
                                                src={member.profile.avatar_url}
                                                alt="Avatar"
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                                                {member.profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-gray-100">
                                                {member.profile?.display_name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                @{member.profile?.username}
                                            </p>
                                        </div>
                                    </div>
                                    {member.user_id === user.id && (
                                        <Link
                                            to={`/groups/${groupId}/wishlist/${user.id}`}
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold text-sm"
                                        >
                                            Мой вишлист в группе
                                        </Link>
                                    )}
                                </div>

                                <Link
                                    to={`/groups/${groupId}/wishlist/${member.user_id}`}
                                    className="block w-full py-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl hover:shadow-lg transition text-center font-semibold text-gray-800 dark:text-gray-100"
                                >
                                    Посмотреть вишлист 🎁
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Модалка добавления участника */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Добавить участника</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddMember} className="p-6 space-y-4">
                            {friends.length === 0 ? (
                                <p className="text-gray-600 dark:text-gray-300 text-center py-4">
                                    Нет доступных друзей для добавления
                                </p>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                            Выберите друга
                                        </label>
                                        <select
                                            value={selectedFriendId}
                                            onChange={(e) => setSelectedFriendId(e.target.value)}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                            required
                                        >
                                            <option value="">-- Выберите друга --</option>
                                            {friends.map((friend) => (
                                                <option key={friend.user_id} value={friend.user_id}>
                                                    {friend.display_name} (@{friend.username})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddModal(false)}
                                            className="flex-1 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-slate-600 rounded-xl font-semibold transition"
                                        >
                                            Отмена
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                                        >
                                            Добавить
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Модалка чата */}
            {showChat && (
                <GroupChat
                    user={user}
                    groupId={groupId!}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    )
}
