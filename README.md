# 🎁 Wishlist App

<div align="center">

![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-2.39-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)

### 🎯 Modern wishlist management app with gift sharing, real-time chat, and crowdfunding features

[🔗 **Live Demo**](https://wishlist-app-nine.vercel.app) • [📖 **Documentation**](#-installation) • [🐛 **Report Bug**](https://github.com/MeguMax/wishlist-app/issues)

</div>

---

## ✨ Key Features

### 🎯 **Smart Wishlists**
Create and organize your wishes with photos, descriptions, links, and estimated prices. Group items into collections for different events (Birthday, Christmas, Wedding, etc.)

### 👥 **Social Network**
Add friends with categories (Family, Friends, Colleagues), view their wishlists, and help them celebrate special moments by reserving gifts

### 💰 **Group Contributions**
Enable crowdfunding for expensive gifts. Friends can contribute any amount, and you can track the progress with a visual progress bar

### 🎉 **Event Groups**
Create groups for special occasions, invite members, manage permissions, and share group wishlists

### 💬 **Real-time Chat**
Instant messaging in event groups powered by Supabase Realtime subscriptions

### 📊 **Analytics Dashboard**
Track your wishlist statistics: total items, estimated value, reserved gifts, and priority distribution

### 🎨 **Modern UI/UX**
- Fully responsive design (mobile, tablet, desktop)
- Dark/Light theme with auto-detection
- Smooth animations and transitions
- Toast notifications for user actions
- Skeleton loaders for better perceived performance

### 🌍 **Multi-currency Support**
Choose from 6 currencies: UAH (₴), USD ($), EUR (€), RUB (₽), PLN (zł), GBP (£)

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

### Frontend
- **React 18** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool & dev server
- **React Router v6** — Client-side routing
- **Tailwind CSS** — Utility-first styling
- **React Hot Toast** — Notifications

</td>
<td valign="top" width="50%">

### Backend
- **Supabase** — Backend-as-a-Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - JWT Authentication
  - File storage

### DevOps
- **Vercel** — Hosting & CI/CD
- **GitHub** — Version control

</td>
</tr>
</table>

---

## 📁 Project Structure

wishlist-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.tsx
│   │   ├── WishlistItem.tsx
│   │   ├── GroupChat.tsx
│   │   └── ...
│   ├── pages/              # Application pages
│   │   ├── Home.tsx
│   │   ├── MyWishlist.tsx
│   │   ├── Friends.tsx
│   │   ├── Groups.tsx
│   │   ├── Statistics.tsx
│   │   └── ...
│   ├── lib/                # Utilities & configuration
│   │   ├── supabase.ts
│   │   ├── currency.ts
│   │   └── uploadImage.ts
│   ├── types/              # TypeScript type definitions
│   │   └── database.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── vercel.json
├── tailwind.config.js
└── package.json

---

## 🗄️ Database Architecture

### Core Tables

| Table | Description |
|-------|-------------|
| `user_profiles` | User data (username, avatar, bio, currency) |
| `wishlist_items` | Gift wishes with details and privacy settings |
| `collections` | Grouped wishes for events |
| `friendships` | Social connections with categories |
| `gift_reservations` | Reserved gifts (hidden from owner) |
| `gift_contributions` | Crowdfunding contributions |
| `groups` | Event groups |
| `group_members` | Group membership with roles |
| `group_messages` | Real-time chat messages |

### Key Features
- Row Level Security (RLS) on all tables
- Real-time subscriptions for chat
- Automatic timestamps and soft deletes
- Foreign key constraints for data integrity

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1️⃣ Clone the repository

git clone https://github.com/MeguMax/wishlist-app.git
cd wishlist-app

### 2️⃣ Install dependencies

npm install

### 3️⃣ Configure environment variables

Create `.env` file in the root directory:

VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Get these values from your Supabase project: **Settings → API**

### 4️⃣ Set up Supabase

1. Create a new project on [supabase.com](https://supabase.com)
2. Run the SQL migrations from `/database` folder
3. Configure Row Level Security policies
4. Enable Realtime for `group_messages` table:

alter publication supabase_realtime add table group_messages;

### 5️⃣ Start development server

npm run dev

App will open at `http://localhost:5173`

### 6️⃣ Build for production

npm run build

---

## 🔐 Security

- ✅ Row Level Security (RLS) enforced on all tables
- ✅ JWT-based authentication
- ✅ Server-side permission checks
- ✅ SQL injection protection via Supabase
- ✅ HTTPS in production
- ✅ Secure file uploads with validation

---

## 📱 Responsive Design

Optimized for all screen sizes:
- 📱 Mobile: 320px - 767px
- 📲 Tablet: 768px - 1023px  
- 💻 Desktop: 1024px - 1919px
- 🖥️ Wide: 1920px+

---

## 🎨 UI/UX Highlights

- **Smooth Animations** — CSS transitions for all interactions
- **Skeleton Loaders** — Better perceived performance
- **Toast Notifications** — Real-time user feedback
- **Modal Windows** — Backdrop blur effects
- **Gradient Buttons** — Eye-catching CTAs
- **Emoji Support** — Visual appeal throughout
- **Theme Persistence** — Remembers user preference

---

## 🔄 Real-time Features

| Feature | Technology |
|---------|-----------|
| Group Chat | Supabase Realtime Subscriptions |
| Gift Reservations | PostgreSQL Triggers + RLS |
| Contribution Updates | Real-time Database Sync |

---

## 📚 What I Learned

This project helped me master:

- **Backend Integration** — Working with Supabase (PostgreSQL, RLS, Realtime, Storage)
- **Database Design** — Complex schema with multiple relationships and constraints
- **Real-time Features** — WebSocket subscriptions and live data sync
- **Type Safety** — TypeScript for robust development
- **Modern React** — Hooks, context, and performance optimization
- **Responsive Design** — Mobile-first approach with Tailwind CSS
- **CI/CD** — Automated deployments with Vercel
- **Image Handling** — Upload, preview, and optimization

---

## 🚧 Future Enhancements

- [ ] Push notifications for gift reservations
- [ ] Email reminders for upcoming events
- [ ] PWA support (offline mode)
- [ ] PDF export for wishlists
- [ ] Gift history tracking
- [ ] Social media integration
- [ ] Advanced search and filters
- [ ] Internationalization (i18n)
- [ ] Gift recommendations based on preferences

---

## 📄 License

MIT License — feel free to use this project for learning or your own purposes

---

<div align="center">

### ⭐ If you found this project helpful, please give it a star!

Made with ❤️ and lots of ☕

</div>

[1](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
[2](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge)
