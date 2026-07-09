# Smart Soko 🇰🇪

**Hyperlocal marketplace platform for Kenya** — connecting people to markets, shops, and matatu stages across all 123 cities and towns.

## What's Included

| Package | Tech | Purpose |
|---------|------|---------|
| `server/` | Node.js + Express + Prisma + PostgreSQL | REST API with geospatial search |
| `web/` | Next.js 14 + Tailwind CSS | Public search app |
| `admin/` | Next.js 14 + Tailwind CSS | Admin dashboard for moderation |

## Features

- 🔍 **Search** — Find businesses by keyword, category, location, and distance
- 🗺️ **Geospatial** — Haversine distance queries for nearby results
- 🚌 **Matatu Stages** — Crowdsourced stage database with route info
- ✅ **Admin Dashboard** — Approve/reject submissions, manage businesses
- 📍 **123 Kenya Cities** — Complete database with lat/lng coordinates
- 🏪 **Business Claims** — Owners can claim and verify their listings

## Quick Start (Local)

### 1. Clone & Install
```bash
git clone <repo>
cd smartsoko
npm run install:all
```

### 2. Start Database (Docker)
```bash
docker-compose up -d postgres redis
```

### 3. Setup Database
```bash
cd server
cp .env.example .env
# Edit .env: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartsoko?schema=public"
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Start Development
```bash
# Terminal 1 — API
npm run dev:server

# Terminal 2 — Web App
npm run dev:web

# Terminal 3 — Admin Panel
npm run dev:admin
```

- API: http://localhost:3001
- Web: http://localhost:3000
- Admin: http://localhost:3002

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/search` | GET | Search with geo + filters |
| `/api/v1/search/autocomplete` | GET | Autocomplete suggestions |
| `/api/v1/businesses/nearby` | GET | Nearby businesses |
| `/api/v1/businesses/:id` | GET | Business details |
| `/api/v1/matatu/stages/nearby` | GET | Nearby matatu stages |
| `/api/v1/matatu/stages` | POST | Submit new stage |
| `/api/v1/submissions` | POST | Crowdsource data |
| `/api/v1/admin/dashboard` | GET | Admin stats |
| `/api/v1/admin/submissions` | GET | List submissions |
| `/api/v1/admin/submissions/:id/approve` | POST | Approve submission |
| `/api/v1/cities` | GET | All 123 Kenya cities |

## Deploy to Vercel

### Prerequisites
- [Vercel CLI](https://vercel.com/download): `npm i -g vercel`
- [Neon](https://neon.tech) or [Supabase](https://supabase.com) PostgreSQL database

### Step-by-Step

```bash
# 1. Login
vercel login

# 2. Deploy everything
./deploy.sh

# Or manually:
cd server && vercel --prod    # Copy the deployed URL
cd ../web && vercel --prod
cd ../admin && vercel --prod
```

### Required Environment Variables (Vercel Dashboard)

| Variable | Value | Project |
|----------|-------|---------|
| `DATABASE_URL` | `postgresql://...` | Server only |
| `NODE_ENV` | `production` | Server only |
| `NEXT_PUBLIC_API_URL` | `https://your-api.vercel.app` | Web + Admin |

### Post-Deploy
```bash
# Run migrations on production DB
cd server
npx prisma migrate deploy
npm run db:seed
```

## Project Structure

```
smartsoko/
├── server/                 # Backend API
│   ├── src/
│   │   ├── index.js        # Express entry
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Error handler
│   │   └── utils/          # Logger
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── seed.js         # Seed script
│   │   └── kenya-cities.json
│   ├── tests/
│   │   └── api.test.js     # Jest tests
│   ├── package.json
│   └── vercel.json
├── web/                    # Public frontend
│   ├── src/app/
│   │   ├── page.tsx        # Search & listings
│   │   ├── submit/         # Matatu submission form
│   │   └── layout.tsx
│   ├── src/lib/api.ts      # API client
│   └── package.json
├── admin/                  # Admin dashboard
│   ├── src/app/
│   │   └── page.tsx        # Moderation panel
│   └── package.json
├── docker-compose.yml      # Local dev stack
├── deploy.sh               # Deployment script
└── package.json            # Root scripts
```

## Testing

```bash
# Run all server tests
cd server
npm test

# With coverage
npm run test -- --coverage
```

## Tech Stack

- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL + PostGIS
- **Frontend:** Next.js 14, React 18, Tailwind CSS, Lucide Icons
- **Search:** Haversine formula for geospatial distance
- **Auth:** JWT (ready for Firebase Auth integration)
- **Payments:** M-Pesa Daraja API (ready)

## License

MIT
