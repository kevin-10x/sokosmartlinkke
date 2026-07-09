#!/bin/bash
set -e

echo "🚀 Smart Soko Deployment Script"
echo "================================"
echo ""

MODE="${1:-vercel}"

if [ "$MODE" = "docker" ]; then
    echo "🐳 Deploying with Docker Compose (production)..."
    echo ""

    # Create .env from template if not exists
    if [ ! -f .env ]; then
        cp .env.docker .env
        echo "⚠️  Created .env from .env.docker — edit it with your settings before running again."
        exit 1
    fi

    # Load env
    set -a; source .env; set +a

    # Build and start
    docker compose -f docker-compose.prod.yml build --pull
    docker compose -f docker-compose.prod.yml up -d

    echo ""
    echo "✅ Docker stack started!"
    echo "   Server: http://localhost:3001"
    echo "   Web:    http://localhost:3000"
    echo "   Admin:  http://localhost:3002"
    echo ""
    echo "📦 Run migrations: docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy"
    echo "🌱 Seed database:  docker compose -f docker-compose.prod.yml exec server node prisma/seed.js"

elif [ "$MODE" = "vercel" ]; then
    # Check for Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
        exit 1
    fi

    # Check for env vars
    if [ -z "$DATABASE_URL" ]; then
        echo "⚠️  Warning: DATABASE_URL not set. Set it before deploying."
    fi

    # 1. Deploy API
    echo "📡 Deploying API (server)..."
    cd server
    if [ -n "$VERCEL_TOKEN" ]; then
        API_URL=$(vercel --prod --yes --token="$VERCEL_TOKEN" 2>&1 | grep -o 'https://[^ ]*' | head -1)
    else
        API_URL=$(vercel --prod --yes 2>&1 | grep -o 'https://[^ ]*' | head -1)
    fi
    cd ..

    if [ -n "$API_URL" ]; then
        echo "✅ API deployed to: $API_URL"
        # Update web and admin env
        echo "NEXT_PUBLIC_API_URL=$API_URL" > web/.env.local
        echo "NEXT_PUBLIC_API_URL=$API_URL" > admin/.env.local
    else
        echo "⚠️  Could not detect API URL. Set NEXT_PUBLIC_API_URL manually."
    fi

    # 2. Deploy Web
    echo "🌐 Deploying Web..."
    cd web
    if [ -n "$VERCEL_TOKEN" ]; then
        vercel --prod --yes --token="$VERCEL_TOKEN"
    else
        vercel --prod --yes
    fi
    cd ..

    # 3. Deploy Admin
    echo "🔧 Deploying Admin..."
    cd admin
    if [ -n "$VERCEL_TOKEN" ]; then
        vercel --prod --yes --token="$VERCEL_TOKEN"
    else
        vercel --prod --yes
    fi
    cd ..

    echo ""
    echo "✅ Vercel deployment complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Set DATABASE_URL in Vercel dashboard for the server project"
    echo "  2. Run 'npm run db:migrate' and 'npm run db:seed' against your production database"
    echo "  3. Set any remaining environment variables in Vercel dashboard"

else
    echo "Usage: ./deploy.sh [vercel|docker]"
    echo "  vercel  - Deploy to Vercel (default)"
    echo "  docker  - Deploy with Docker Compose"
    exit 1
fi
