# Wishlist

Shared wishlists with gift reservations, group contributions and realtime chat. Built with React and TypeScript, using Supabase for authentication, PostgreSQL data, storage and realtime subscriptions.

## What you can explore

- Personal wishlists with collections, item images, priorities and visibility settings.
- Public profile wishlists and friend requests grouped into family, friends and colleagues.
- Gift reservations and contribution tracking for shared purchases.
- Event groups, member roles and a group wishlist view.
- Realtime group chat, notifications and wishlist statistics.
- Currency preferences and a light/dark interface.

Contributions are records of amounts and notes. This repository does not implement a payment processor or transfer money.

## Stack and structure

**React 18 · TypeScript · Vite 5 · Tailwind CSS · Supabase · React Router**

```text
src/
  pages/               Wishlist, friends, groups, settings and statistics
  components/          Item, reservation, contribution and chat interfaces
  lib/                 Supabase client, currency helpers and image uploads
  types/database.ts    Application data types
```

Authentication state is managed through Supabase Auth. The application reads and writes PostgreSQL tables directly through the Supabase client; group chat subscribes to changes in `group_messages`. Images use the `avatars` and `wishlist-images` storage buckets.

## Local development

You need Node.js 20 or later, npm and a Supabase project. The Node.js minimum comes from the locked Supabase packages.

```bash
git clone https://github.com/MeguMax/wishlist-app.git
cd wishlist-app
npm install
```

Create `.env.local` in the project root:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Provision the Supabase backend before using the application. Its queries and types expect profiles, wishlists, friendships, reservations, contributions, groups, membership, messages and notifications. Configure the corresponding row-level access policies, storage buckets and realtime publication for your project.

The repository contains the frontend and application types, but does not include SQL migrations or a complete database provisioning script. `src/types/database.ts` describes client-side shapes; it is not a migration.

```bash
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check with TypeScript, then build the application |
| `npm run preview` | Serve the built application locally |

## Implementation notes

The project demonstrates authenticated React flows, relational application data, image storage and realtime interaction. The database policies and hosted project configuration are external dependencies, so this repository alone does not verify the permissions or availability of a deployed Supabase instance.

The interface currently contains Russian-language copy. Currency preferences change displayed amounts; they do not provide currency exchange or payment settlement.

## License

MIT, as declared in the original project documentation.
