# ManagerOS Starter (Next.js + Prisma)

A minimal, manager-only MVP scaffold: Initiatives, Tasks, People, 1:1s, Weekly Check-ins.

## Quick start

```bash
pnpm i # or npm install
cp .env.example .env
# update DATABASE_URL to a local sqlite file or Postgres URL
pnpm prisma:push
pnpm prisma:seed
pnpm dev
```

Open http://localhost:3000

## Tech

- Next.js (App Router, server actions)
- Prisma + SQLite (swap to Postgres when ready)
- TailwindCSS (utility-first)
- Minimal auth stub (manager-only demo mode)

## Env

- `DATABASE_URL` (e.g., file:./prisma/dev.db for SQLite)

## Notes

This is a demo scaffold. Replace the in-memory manager allowlist with a real auth provider (NextAuth, Clerk, WorkOS, etc.).
