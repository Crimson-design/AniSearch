# AniSearch 🎌

**Discover your next favorite anime.**

🌐 **Live demo:** [ani-search-ptqp.vercel.app](https://ani-search-ptqp.vercel.app/)

AniSearch is an anime search and discovery platform built with **Next.js, TypeScript, and Supabase**. It helps users explore anime, search for titles, and discover information about their favorite shows.

## ✨ Features

- 🔎 **Anime Search** — Find anime by title.
- 📖 **Anime Details** — Explore synopses, release years, and cover art.
- ➕ **Add Anime** — Add titles to the database.
- ⭐ **Ratings & Reviews** — Rate anime and keep track of your own reviews.
- 📚 **Watch Later** — Save anime you want to watch.
- ⚡ **Database Integration** — Supabase handles data storage and search.

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend & Database:** Supabase
- **Hosting:** Vercel
- **Package Manager:** npm
- **Development Tools:** Git and GitHub

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) and npm installed.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Crimson-design/AniSearch.git
   ```

2. Navigate to the project directory:

   ```bash
   cd AniSearch
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Configure your environment variables.

   Create a `.env.local` file in the project root and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Never commit your `.env.local` file or expose private service-role keys.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```text
AniSearch/
├── app/          # Application pages and layouts
├── components/   # Reusable UI components
├── lib/          # Shared utilities and integrations
├── public/       # Static assets
├── scripts/      # Project scripts
├── .gitignore
├── package.json
└── README.md
```

## 🗺️ Roadmap

- [x] Deploy the application.
- [ ] Improve anime search and filtering.
- [ ] Enhance the anime detail pages.
- [ ] Expand watchlist functionality.
- [ ] Improve the user experience and responsive design.

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)

## 👨‍💻 Author

**Ashwin Jagarallamudi**

GitHub: [@Crimson-design](https://github.com/Crimson-design)

---

*AniSearch — Find your next anime adventure.*
