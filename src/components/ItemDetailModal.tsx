import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { WishlistItem, UserProfile, WishlistComment, GroupContribution } from '../types/database'
import { formatPrice } from '../lib/currency'

interface ItemDetailModalProps {
    item: WishlistItem
    currentUser: User | null
    ownerProfile: UserProfile
    onClose: () => void
    onUpdate: () => void
}

export default function ItemDetailModal({ item, currentUser, ownerProfile, onClose, onUpdate }: ItemDetailModalProps) {
    const [comments, setComments] = useState<WishlistComment[]>([])
    const [contributions, setContributions] = useState<GroupContribution[]>([])
    const [newComment, setNewComment] = useState('')
    const [contributionAmount, setContributionAmount] = useState('')

    const isOwner = currentUser?.id === ownerProfile.user_id

    useEffect(() => {
        loadData()
    }, [item.id])

    const loadData = async () => {
        const { data: commentsData } = await supabase
            .from('wishlist_comments')
            .select('*')
            .eq('item_id', item.id)
            .order('created_at', { ascending: false })

        const { data: contributionsData } = await supabase
            .from('group_contributions')
            .select('*')
            .eq('item_id', item.id)

        setComments(commentsData || [])
        setContributions(contributionsData || [])
    }

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser || !newComment.trim()) return

        await supabase.from('wishlist_comments').insert({
            item_id: item.id,
            user_id: currentUser.id,
            comment: newComment.trim(),
        })

        setNewComment('')
        await loadData()
    }

    const handleContribute = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser || !contributionAmount) return

        await supabase.from('group_contributions').insert({
            item_id: item.id,
            user_id: currentUser.id,
            amount: parseFloat(contributionAmount),
        })

        setContributionAmount('')
        await loadData()
        onUpdate()
    }

    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0)
    const remainingAmount = (item.estimated_price || 0) - totalContributed

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{item.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Изображение */}
                    {item.image_url && (
                        <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full max-h-96 object-cover rounded-xl"
                        />
                    )}

                    {/* Описание */}
                    {item.description && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Описание</h3>
                            <p className="text-gray-700 dark:text-gray-300">{item.description}</p>
                        </div>
                    )}

                    {/* Цена */}
                    {item.estimated_price && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">Цена</h3>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                {formatPrice(item.estimated_price, ownerProfile.currency)}
                            </p>
                        </div>
                    )}

                    {/* Ссылка */}
                    {item.link && (
                        <div>
                            <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                            >
                                🔗 Открыть ссылку на товар
                            </a>
                        </div>
                    )}

                    {/* Складчина */}
                    {!isOwner && item.estimated_price && item.estimated_price > 0 && (
                        <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Складчина</h3>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                                    <span>Собрано: {formatPrice(totalContributed, ownerProfile.currency)}</span>
                                    <span>Осталось: {formatPrice(remainingAmount, ownerProfile.currency)}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                                        style={{ width: `${Math.min((totalContributed / item.estimated_price) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {currentUser && remainingAmount > 0 && (
                                <form onSubmit={handleContribute} className="flex gap-3">
                                    <input
                                        type="number"
                                        value={contributionAmount}
                                        onChange={(e) => setContributionAmount(e.target.value)}
                                        placeholder="Сумма"
                                        min="1"
                                        max={remainingAmount}
                                        step="0.01"
                                        className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                                    >
                                        Внести
                                    </button>
                                </form>
                            )}

                            {contributions.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Участники:</p>
                                    {contributions.map((contrib) => (
                                        <div key={contrib.id} className="text-sm text-gray-600 dark:text-gray-300">
                                            💰 {formatPrice(contrib.amount, ownerProfile.currency)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Комментарии */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Комментарии ({comments.length})
                        </h3>

                        {currentUser && (
                            <form onSubmit={handleAddComment} className="mb-4">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="Написать комментарий..."
                                        className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-800"
                                    />
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition font-semibold"
                                    >
                                        Отправить
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-3">
                            {comments.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4">Пока нет комментариев</p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
                                        <p className="text-gray-800 dark:text-gray-100">{comment.comment}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            {new Date(comment.created_at).toLocaleDateString('ru')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
