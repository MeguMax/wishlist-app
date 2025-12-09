import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import { Toaster } from 'react-hot-toast'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import MyWishlist from './pages/MyWishlist'
import UserWishlist from './pages/UserWishlist'
import Friends from './pages/Friends'
import Settings from './pages/Settings'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import GroupWishlist from './pages/GroupWishlist'
import MyReservations from './pages/MyReservations'
import Statistics from './pages/Statistics'

function App() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // Тёмная тема
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-950 dark:to-black">
                <div className="spinner"></div>
                <p className="ml-4 text-lg font-semibold text-gray-600 dark:text-gray-200">Загрузка...</p>
            </div>
        )
    }

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={user ? <Navigate to="/my-wishlist" /> : <Home />} />
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/my-wishlist" />} />
                    <Route path="/register" element={!user ? <Signup /> : <Navigate to="/my-wishlist" />} />
                    <Route path="/my-wishlist" element={user ? <MyWishlist user={user} /> : <Navigate to="/login" />} />
                    <Route path="/my-reservations" element={user ? <MyReservations user={user} /> : <Navigate to="/login" />} />
                    <Route path="/statistics" element={user ? <Statistics user={user} /> : <Navigate to="/login" />} />
                    <Route path="/friends" element={user ? <Friends user={user} /> : <Navigate to="/login" />} />
                    <Route path="/u/:username" element={<UserWishlist />} />
                    <Route path="/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
                    <Route path="/groups" element={user ? <Groups user={user} /> : <Navigate to="/login" />} />
                    <Route
                        path="/groups/:groupId"
                        element={user ? <GroupDetail user={user} /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/groups/:groupId/wishlist/:userId"
                        element={user ? <GroupWishlist user={user} /> : <Navigate to="/login" />}
                    />
                </Routes>
            </BrowserRouter>
            <Toaster position="top-right" />
        </>
    )
}

export default App
