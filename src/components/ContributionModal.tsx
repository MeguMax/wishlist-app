import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { WishlistItem, GiftContribution, UserProfile } from '../types/database'
import { formatPrice } from '../lib/currency'
import toast from 'react-hot-toast'

interface ContributionWithUser extends GiftContribution {
    user_profile?: UserProfile
}

interface Props {
    user: User
    item: WishlistItem
    ownerCurrency: string
    onClose: () => void
    onSuccess: () => void
}

export default function ContributionModal({ user, item, ownerCurrency, onClose, onSuccess }: Props) {
    const [contributions, setContributions] = useState<ContributionWithUser[]>([])
    const [myContribution, setMyContribution] = useState<GiftContribution | null>(null)
    const [amount, setAmount] = useState('')
    const [note, setNote] = useState('')

    useEffect(() => {
        loadContributions()
    }, [item.id])

    const loadContributions = async () => {
        try {
            // Загружаем все складчины для этого желания
            const { data: contributionsData } = await supabase
                .from('gift_contributions')
                .select('*')
                .eq('item_id', item.id)
                .order('created_at', { ascending: false })

            if (contributionsData) {
                // Загружаем профили участников складчины
                const userIds = [...new Set(contributionsData.map(c => c.user_id))]
                const { data: usersData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .in('user_id', userIds)

                const usersMap = new Map(usersData?.map(u => [u.user_id, u]))

                const enrichedContributions = contributionsData.map(c => ({
                    ...c,
                    user_profile: usersMap.get(c.user_id)
                }))

                setContributions(enrichedContributions)

                // Находим мой вклад
                const mine = contributionsData.find(c => c.user_id === user.id)
                setMyContribution(mine || null)
                if (mine) {
                    setAmount(mine.amount.toString())
                    setNote(mine.note || '')
                }
            }
        } catch (error) {
            console.error('Error loading contributions:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Введите корректную сумму')
            return
        }

        if (item.estimated_price && (item.contributed_amount || 0) + numAmount > item.estimated_price) {
            toast.error('Сумма превышает стоимость подарка')
            return
        }

        try {
            if (myContribution) {
                // Обновляем существующий вклад
                const { error } = await supabase
                    .from('gift_contributions')
                    .update({
                        amount: numAmount,
                        note: note.trim() || null
                    })
                    .eq('id', myContribution.id)

                if (error) {
                    toast.error('Ошибка обновления')
                } else {
                    toast.success('Вклад обновлён! 💰')
                    onSuccess()
                    onClose()
                }
            } else {
                // Создаём новый вклад
                const { error } = await supabase
                    .from('gift_contributions')
                    .insert({
                        item_id: item.id,
                        user_id: user.id,
                        amount: numAmount,
                        note: note.trim() || null
                    })

                if (error) {
                    toast.error('Ошибка добавления вклада')
                } else {
                    toast.success('Вклад добавлен! 💰')
                    onSuccess()
                    onClose()
                }
            }
        } catch (error) {
            console.error('Error submitting contribution:', error)
            toast.error('Произошла ошибка')
        }
    }

    const handleDelete = async () => {
        if (!myContribution || !confirm('Отменить свой вклад?')) return

        try {
            const { error } = await supabase
                .from('gift_contributions')
                .delete()
                .eq('id', myContribution.id)

            if (error) {
                toast.error('Ошибка удаления')
            } else {
                toast.success('Вклад отменён')
                onSuccess()
                onClose()
            }
        } catch (error) {
            console.error('Error deleting contribution:', error)
            toast.error('Произошла ошибка')
        }
    }

    const totalContributed = item.contributed_amount || 0
    const remaining = (item.estimated_price || 0) - totalContributed
    const progressPercent = item.estimated_price
        ? Math.min((totalContributed / item.estimated_price) * 100, 100)
        : 0

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                        💰 Складчина на подарок
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-3xl sm:text-2xl w-10 h-10 flex items-center justify-center"
                    >
                        ×
                    </button>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Информация о подарке */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
                            {item.title}
                        </h3>
                        {item.estimated_price && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Собрано: {formatPrice(totalContributed, ownerCurrency)}
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                                        Цель: {formatPrice(item.estimated_price, ownerCurrency)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                                    Осталось: {formatPrice(Math.max(0, remaining), ownerCurrency)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Список участников складчины */}
                    {contributions.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                                Участники складчины ({contributions.length})
                            </h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-hide">
                                {contributions.map((contrib) => (
                                    <div
                                        key={contrib.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            {contrib.user_profile?.avatar_url ? (
                                                <img
                                                    src={contrib.user_profile.avatar_url}
                                                    alt="Avatar"
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                    {contrib.user_profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                                    {contrib.user_profile?.display_name}
                                                    {contrib.user_id === user.id && (
                                                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Вы)</span>
                                                    )}
                                                </div>
                                                {contrib.note && (
                                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                                        {contrib.note}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="font-bold text-green-600 dark:text-green-400">
                                            {formatPrice(contrib.amount, ownerCurrency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Форма добавления/редактирования вклада */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                {myContribution ? 'Изменить мой вклад' : 'Ваш вклад'}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={remaining}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={`Например, ${remaining > 0 ? Math.min(100, remaining) : 100}`}
                                className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                Комментарий (необязательно)
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Например: С удовольствием!"
                                className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                            />
                        </div>

                        <div className="flex gap-3">
                            {myContribution && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="flex-1 py-3 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-xl font-semibold transition"
                                >
                                    Отменить вклад
                                </button>
                            )}
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition font-semibold"
                            >
                                {myContribution ? 'Обновить' : 'Внести вклад'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
