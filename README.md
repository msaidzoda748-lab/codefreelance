# Zoir Freelance

Платформаи фриланс (MVP) барои Тоҷикистон — интерфейси тоҷикӣ (кириллӣ), дизайни муосири SaaS.

## Хусусиятҳо

- Interface: Тоҷикӣ / Русский / English (all pages; cookie `cf-lang`, per-user `uiLanguage`)
- Roles: client, freelancer (one account can hold both and switch), admin flag
- Auth: register / login / logout, password reset by token (email via SMTP or Resend, dev fallback logs the link), rate limits
- Projects: drafts, publish/close, fixed or range budget, proposal deadline, language, attachments; search, filters, sort, pagination; saved projects
- Proposals: send / edit / withdraw / re-send; contents visible only to the project owner; compare up to 3; hire in a DB transaction (no double orders)
- Orders & milestones: NEGOTIATION → IN_PROGRESS → IN_REVIEW / REVISION_REQUESTED → COMPLETED (or CANCELLED); submissions with private files; full history
- Chat: conversations per order + direct ("Write" on a profile), files, read receipts, unread counts, pagination, typing, SSE, idempotent resend (`clientMessageId`)
- Reviews only after completion, one per side, reports; hidden reviews excluded from ratings
- Notifications center + bell; deadline reminders via cron endpoint
- Admin panel: stats, users (restrict/reactivate), projects/reviews (hide), reports, categories, audit log with reasons
- **No online payments** — the platform never shows "Paid"

## Стек

- Next.js 14 + TypeScript + Tailwind + lucide-react
- Prisma + **PostgreSQL**
- Storage: `local` | `cloudinary` | `s3` (S3-compatible)

## Локалӣ

1. PostgreSQL-ро оғоз кунед ва `DATABASE_URL`-ро танзим кунед (нигаред `.env.example`).
2. ```bash
   npm install
   cp .env.example .env   # ва қиматҳоро иваз кунед
   npx prisma migrate deploy
   npm run db:seed
   npm run dev
   ```
3. Кушоед: http://localhost:3000  
4. Health: http://localhost:3000/api/health

### Ҳисобҳои демо

Рамз: `password123`

| Почта | Нақш |
|-------|------|
| admin@demo.tj | **Demo admin** (isAdmin, нишондодашуда ҳамчун demo) |
| client@demo.tj | Мизоҷ |
| client2@demo.tj | Мизоҷ |
| freelancer@demo.tj | Фрилансер |
| designer@demo.tj | Фрилансер |
| translator@demo.tj, marketing@demo.tj, mobile@demo.tj, brand@demo.tj | Фрилансер |

## Run guide

```bash
npm install
cp .env.example .env          # set DATABASE_URL, AUTH_SECRET …
npx prisma migrate deploy     # applies all migrations (data-preserving)
npm run db:seed               # DEV ONLY: wipes and seeds demo data
npm run dev                   # http://localhost:3000   (health: /api/health)
```

Production build: `npm run build && npm start`. The build runs `prisma migrate deploy`,
`seed-if-empty` (seeds only an empty DB) and `seed-refresh-demo` (non-destructive: only touches `@demo.tj` accounts).

### Tests

| Command | What |
|---|---|
| `npm test` | Vitest: state machine, authz, validation, rate limiter |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test:e2e` | Playwright (system Chrome, `CHROME_PATH`), against `BASE_URL` (default `http://localhost:3000`): full acceptance flow, privacy, double-hire, no early reviews, search/filters/pagination, admin, rate limit, reset tokens, responsive 360/390/768/1440, console errors |

## Migrations (prisma/migrations)

1. `20261013160026_init_postgres`
2. `20261013165710_covers_city`
3. `20261013170956_freelancer_experience`
4. `20261013173650_auth_roles_profiles` — admin flag, user status, language, demo flag, ClientProfile, PasswordResetToken
5. `20261013173940_marketplace_orders` — Category, Skill, PortfolioItem, SavedProject, Order, Milestone, Submission, MilestoneEvent (+ data migration of legacy categories/skills/hired projects/portfolio links)
6. `20261013180500_chat_reviews_moderation` — Conversation, ConversationMember, message/review/notification changes, Report, AuditLog (+ data migration of existing chats and reviews)

All migrations are additive and migrate existing rows; no resets.

## Environment variables

| Env | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Postgres |
| `AUTH_SECRET`, `NEXTAUTH_SECRET` | yes | random strings |
| `APP_URL` | recommended | base URL in reset emails |
| `MAIL_PROVIDER`, `MAIL_FROM`, `SMTP_*` / `RESEND_API_KEY` | for email | without them no email is sent (link only in server log; UI says so) |
| `CRON_SECRET` | for reminders | protects `/api/cron/deadlines` |
| `DEADLINE_WINDOW_HOURS` | no | default 48 |
| `STORAGE_PROVIDER` + `CLOUDINARY_*` / `S3_*` | for persistent files | Render free disk is ephemeral |
| `PRIVATE_STORAGE_DIR` | no | local private files dir (default `./storage/private`) |

### External services you may need

- **Email**: any SMTP (e.g. Gmail app password, Mailgun, Brevo) or Resend.
- **File storage**: Cloudinary or an S3-compatible bucket (Cloudflare R2 has a free tier). With `local`, uploads disappear on every Render redeploy/restart.
- **Cron**: Render cron jobs are **not** free (min $1/month), so none is configured. Use a free external scheduler, e.g. [cron-job.org](https://cron-job.org):
  URL `https://<your-app>.onrender.com/api/cron/deadlines`, method GET, header `Authorization: Bearer <CRON_SECRET>`, every hour.
  Or GitHub Actions (`schedule: - cron: "0 * * * *"` with `curl -fsS -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" <url>`).
  Fallback without any cron: the job also runs lazily (at most every 30 min) when a logged-in user loads notifications. It is idempotent.

## Deploy to Render (free tier)

`render.yaml` defines a free web service + free Postgres. Set `CRON_SECRET`, `APP_URL` and (optionally) email/storage env vars in the dashboard.
Health check: `/api/health`.

## Privacy & files

Chat, proposal and submission files are private: stored outside `public/` (or in private S3 objects / unguessable Cloudinary URLs kept server-side) and served only through `/api/files/[id]` after an access check.
Legacy files uploaded before this version under `public/uploads/` remain reachable by their direct URL.

## Limitations

- No online payments by design.
- Realtime (SSE) and rate limits are in-process — fine for one instance (Render free), not for horizontal scaling.
- Render free instances sleep when idle; the first request can take ~1 min.
