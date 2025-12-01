# 🚀 Railway Deployment Guide

## Quick Deploy Steps

### 1. Connect GitHub Repository (In Railway Dashboard)

1. Go to your Railway project: https://railway.com
2. Click **"+ New"** → **"GitHub Repo"**
3. Select `CypherNinjaa/Exam-Predictor`
4. Wait for deployment to start

### 2. Configure Environment Variables

In Railway dashboard, click on your app service and add these variables:

| Variable          | Value                                                  |
| ----------------- | ------------------------------------------------------ |
| `GEMINI_API_KEY`  | Your Gemini API key from https://makersuite.google.com |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32`                |
| `NEXTAUTH_URL`    | `https://your-app.up.railway.app`                      |
| `NODE_ENV`        | `production`                                           |

> **Note:** `DATABASE_URL` is automatically provided by Railway when you have PostgreSQL attached.

### 3. Connect PostgreSQL to App

1. In your Railway project canvas, hover over the PostgreSQL service
2. Click the connection line icon
3. Drag it to your app service to share the `DATABASE_URL`

Or use Railway Variables Reference:

- Go to app service → Variables
- Add: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`

### 4. Run Database Migration

After deployment succeeds:

```bash
# Run migrations on Railway
railway run npx prisma migrate deploy

# Seed the database
railway run npx prisma db seed
```

Or use the Railway CLI:

```bash
railway link
railway run npx prisma db push
railway run npm run db:seed
```

---

## Railway CLI Commands

```bash
# Check project status
railway status

# View logs
railway logs

# Open dashboard
railway open

# Run command on Railway
railway run <command>

# Deploy manually
railway up

# View environment variables
railway variables
```

---

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify `prisma generate` runs during build (check package.json scripts)

### Database Connection Error

- Ensure PostgreSQL is connected to your app service
- Check that `DATABASE_URL` variable is properly set

### Prisma Errors

```bash
# Reset database
railway run npx prisma migrate reset

# Generate client
railway run npx prisma generate
```

---

## Architecture on Railway

```
┌─────────────────────────────────────┐
│           Railway Project           │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────┐                  │
│  │   PostgreSQL  │                  │
│  │   Database    │──── DATABASE_URL │
│  └───────┬───────┘         │        │
│          │                 │        │
│          ▼                 ▼        │
│  ┌───────────────────────────────┐  │
│  │     Next.js App               │  │
│  │  (Frontend + API Routes)      │  │
│  │                               │  │
│  │  • /api/upload                │  │
│  │  • /api/predict               │  │
│  │  • /api/dashboard/*           │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## URLs After Deployment

- **App**: `https://exam-predictor-production.up.railway.app`
- **Health Check**: `https://exam-predictor-production.up.railway.app/api/health`
- **Dashboard**: Click on Railway project → Service → Get public URL

---

## Cost Estimate

Railway offers:

- **Free Tier**: $5/month credit (enough for development)
- **Hobby**: $5/month
- **Pro**: $20/month

PostgreSQL on Railway is billed by usage (storage + compute).
