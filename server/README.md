# Smart Soko Server

Node.js + Express + Prisma + PostgreSQL backend for Smart Soko.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Run migrations
npx prisma migrate dev --name init

# 4. Seed database
npm run db:seed

# 5. Start dev server
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/search` | GET | Search businesses with geo + filters |
| `/api/v1/search/autocomplete` | GET | Autocomplete suggestions |
| `/api/v1/businesses/nearby` | GET | Nearby businesses by lat/lng |
| `/api/v1/businesses/:id` | GET | Business details |
| `/api/v1/businesses` | POST | Create business |
| `/api/v1/businesses/:id/claim` | POST | Claim business |
| `/api/v1/matatu/stages/nearby` | GET | Nearby matatu stages |
| `/api/v1/matatu/stages/:id` | GET | Stage details |
| `/api/v1/matatu/routes` | GET | Search routes |
| `/api/v1/matatu/stages` | POST | Submit new stage (crowdsourced) |
| `/api/v1/submissions` | POST | Submit data |
| `/api/v1/admin/dashboard` | GET | Admin dashboard stats |
| `/api/v1/admin/submissions` | GET | List submissions |
| `/api/v1/admin/submissions/:id/approve` | POST | Approve submission |
| `/api/v1/admin/submissions/:id/reject` | POST | Reject submission |
| `/api/v1/cities` | GET | List all 123 Kenya cities |
| `/api/v1/cities/:id` | GET | City details |

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Make sure to set `DATABASE_URL` in Vercel environment variables.
