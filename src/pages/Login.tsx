import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert('Ошибка входа: ' + error.message)
            setLoading(false)
        } else {
            navigate('/my-wishlist')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black px-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎁</div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Вход</h1>
                    <p className="text-gray-600 dark:text-gray-300">Войдите в свой аккаунт</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-900"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Пароль
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100 dark:bg-slate-900"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className="text-center text-gray-600 dark:text-gray-300 mt-6">
                    Нет аккаунта?{' '}
                    <Link to="/signup" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold">
                        Зарегистрироваться
                    </Link>
                </p>

                <Link
                    to="/"
                    className="block text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mt-4"
                >
                    ← На главную
                </Link>
            </div>
        </div>
    )
}
