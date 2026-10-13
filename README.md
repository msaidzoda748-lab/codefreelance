# CodeFreelance

Платформаи фриланс (MVP) барои Тоҷикистон — интерфейси тоҷикӣ (кириллӣ), дизайни муосири SaaS.

## Хусусиятҳо

- Сабти ном / вуруд, нақшҳо: Мизоҷ ва Фрилансер
- Профилҳо, аватар, лоиҳаҳо, пешниҳодҳо, баҳоҳо
- Замимаҳои файл (лоиҳа / пешниҳод / чат), боргузории аватар
- Огоҳиҳои дохилӣ (зангӯла + саҳифа)
- Чати вақти воқеӣ (SSE), индикатори навиштан ва хонда шуд
- **Пардохт нест**

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
| client@demo.tj | Мизоҷ |
| freelancer@demo.tj | Фрилансер |
| designer@demo.tj | Фрилансер |
| translator@demo.tj | Фрилансер |

## Deploy ба Render (free tier)

1. Репоро ба GitHub/GitLab бор кунед (ин репо ҳоло push нашудааст).
2. Дар [Render](https://dashboard.render.com) → **New → Blueprint** → репоро интихоб кунед (`render.yaml`).
3. Render хидмати web + Postgres (free) месозад.
4. Env-ҳои зарурӣ (Blueprint бисёреро медиҳад):

| Env | Тавсиф |
|-----|--------|
| `DATABASE_URL` | аз Postgres-и Render (автоматӣ) |
| `AUTH_SECRET` | сирри сессия (generate) |
| `NEXTAUTH_SECRET` | сирри иловагӣ (generate) |
| `STORAGE_PROVIDER` | `local` (default) / `cloudinary` / `s3` |
| Cloudinary / S3 vars | барои файлҳои доимӣ (тавсия) |

5. Пас аз deploy: дар **Shell** як маротиба `npm run db:seed` (ихтиёрӣ).
6. Health check: `/api/health`

### Муҳим дар бораи файлҳо

Диски free-и Render **муваққатӣ** аст. Бо `STORAGE_PROVIDER=local` файлҳо пас аз restart гум мешаванд. Барои продакшн Cloudinary ё S3/R2 танзим кунед.

Build: `npm install && npm run build` (= `prisma generate` + `migrate deploy` + `next build`)  
Start: `npm start` (PORT аз Render)

## Маҳдудиятҳо

- Пардохт нест
- SSE дар як инстанс (multi-instance ба Redis лозим мешавад)
- Local uploads дар Render free гум мешаванд
- Андозаи файл: аватар 2МБ, дигар 5МБ
