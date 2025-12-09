import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '../types/database'
import { supabase } from '../lib/supabase'

interface NavbarProps {
    user: User
    profile: UserProfile | null
}

export default function Navbar({ profile }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    })

    const toggleDarkMode = () => {
        const newMode = !darkMode
        setDarkMode(newMode)

        if (newMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }


    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    return (
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Логотип */}
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🎁</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Wishlist
                        </span>
                    </Link>

                    {/* Desktop навигация */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            to="/my-wishlist"
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            Мой вишлист
                        </Link>
                        <Link
                            to="/my-reservations"
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            Мои бронирования
                        </Link>
                        <Link
                            to="/statistics"
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            Статистика
                        </Link>
                        <Link
                            to="/friends"
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            Друзья
                        </Link>
                        <Link
                            to="/groups"
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            Группы
                        </Link>
                        <Link
                            to="/settings"
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            Настройки
                        </Link>

                        {/* Кнопка переключения темы */}
                        <button
                            onClick={toggleDarkMode}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title={darkMode ? 'Светлая тема' : 'Тёмная тема'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>

                        {/* Профиль */}
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-300 dark:border-slate-700">
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                                    {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                            )}
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                {profile?.display_name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition text-sm"
                            >
                                Выйти
                            </button>
                        </div>
                    </div>

                    {/* Mobile меню кнопка */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                        <svg
                            className="w-6 h-6 text-gray-700 dark:text-gray-200"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {mobileMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile меню */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="px-4 py-3 space-y-1">
                        {/* Профиль */}
                        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-200 dark:border-slate-700">
                            {profile?.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt="Avatar"
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                            )}
                            <div>
                                <div className="font-semibold text-gray-800 dark:text-gray-100">
                                    {profile?.display_name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    @{profile?.username}
                                </div>
                            </div>
                        </div>

                        {/* Навигация */}
                        <Link
                            to="/my-wishlist"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            🎁 Мой вишлист
                        </Link>
                        <Link
                            to="/my-reservations"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            🎁 Мои бронирования
                        </Link>
                        <Link
                            to="/statistics"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            📊 Статистика
                        </Link>
                        <Link
                            to="/friends"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            👥 Друзья
                        </Link>
                        <Link
                            to="/groups"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            🎪 Группы
                        </Link>
                        <Link
                            to="/settings"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            ⚙️ Настройки
                        </Link>

                        <button
                            onClick={toggleDarkMode}
                            className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-800 rounded-lg transition font-semibold"
                        >
                            {darkMode ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
                        </button>

                        {/* Выход */}
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-3 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg font-semibold transition mt-2"
                        >
                            🚪 Выйти
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}
