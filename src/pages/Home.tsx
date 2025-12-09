import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-sm border-b border-gray-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🎁</span>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Wishlist
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            to="/login"
                            className="px-6 py-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white font-semibold transition"
                        >
                            Войти
                        </Link>
                        <Link
                            to="/signup"
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold shadow-lg"
                        >
                            Регистрация
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <div className="text-8xl mb-6">🎁</div>
                    <h2 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
                        Создайте свой вишлист
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                        Делитесь желаниями с друзьями, бронируйте подарки и делайте праздники особенными
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl font-bold text-lg"
                    >
                        Начать бесплатно
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-5xl mb-4">📝</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Создавайте списки
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Добавляйте желания, картинки, ссылки и описания. Организуйте по коллекциям.
                        </p>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-5xl mb-4">👥</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Делитесь с друзьями
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Отправляйте ссылку на вишлист друзьям и родным. Они увидят, что вам нужно.
                        </p>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                            Бронируйте подарки
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                            Друзья могут забронировать подарок, чтобы не было дублей. Комментарии и складчина.
                        </p>
                    </div>
                </div>

                <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-center text-white">
                    <h3 className="text-3xl font-bold mb-4">Готовы начать?</h3>
                    <p className="text-lg mb-8 opacity-90">
                        Создайте свой вишлист прямо сейчас — это бесплатно и занимает меньше минуты
                    </p>
                    <Link
                        to="/signup"
                        className="inline-block px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all shadow-xl font-bold text-lg"
                    >
                        Создать вишлист
                    </Link>
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-4 py-8 mt-16 border-t border-gray-200 dark:border-slate-700">
                <p className="text-center text-gray-600 dark:text-gray-400">
                    © 2024 Wishlist. Делайте подарки проще.
                </p>
            </footer>
        </div>
    )
}
