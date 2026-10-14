// Non-destructive demo refresh for existing databases (e.g. production with real users).
// Only touches @demo.tj accounts and projects they own. Never deletes anything. Idempotent.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalize } from "./demo-normalize.mjs";
import { seedWorks } from "./seed-works.mjs";
const prisma = new PrismaClient();
const A = (n) => `/img/avatars/${n}.svg`;
const C = (n) => `/img/covers/${n}.svg`;
const users = [
  ["client@demo.tj", "Алишер Раҳимов", "CLIENT", "alisher", "Душанбе"],
  ["client2@demo.tj", "Заррина Қаюмова", "CLIENT", "zarrina", "Хуҷанд"],
  ["freelancer@demo.tj", "Дилшод Неъматов", "FREELANCER", "dilshod", "Душанбе", "Full Stack Developer", "React,Node.js,MongoDB,Next.js,PostgreSQL", 120, 5],
  ["designer@demo.tj", "Мадина Саидова", "FREELANCER", "madina", "Душанбе", "UI/UX дизайнер", "Figma,UI/UX,Mobile App,Prototyping", 100, 4],
  ["marketing@demo.tj", "Сомон Иброҳимов", "FREELANCER", "somon", "Хуҷанд", "Маркетинг мутахассис", "SMM,Content,Strategy,Ads", 80, 3],
  ["mobile@demo.tj", "Ҷамшед Ҳакимов", "FREELANCER", "jamshed", "Бохтар", "Таҳиягари мобилӣ", "Flutter,React Native,Dart,Firebase", 110, 6],
  ["translator@demo.tj", "Нигора Юсуфӣ", "FREELANCER", "nigora", "Кӯлоб", "Тарҷумон", "Тарҷума,Тоҷикӣ,Русӣ,Англисӣ", 60, 7],
  ["brand@demo.tj", "Фарангис Раҷабова", "FREELANCER", "farangis", "Истаравшан", "Графикӣ дизайнер", "Illustrator,Branding,Logo", 90, 4],
];
const projects = [
  ["client@demo.tj", "Сохтани вебсайти автосалон", "Барои автосалони мо вебсайти муосир бо каталоги мошинҳо, филтр ва формаи тамос лозим аст.", "Веб-таҳия", "React,Next.js", 2500, "website", "Душанбе", 2],
  ["client2@demo.tj", "Дизайни барномаи мобилӣ", "Дизайни замонавии барномаи мобилӣ барои хизматрасонии онлайн лозим аст.", "Дизайн", "UI/UX,Figma", 1800, "mobile", "Душанбе", 5],
  ["client2@demo.tj", "Барномаи фармоиши ғизо", "Барномаи Flutter барои фармоиш ва расонидани ғизо дар Хуҷанд: меню, сабад, пайгирӣ.", "Мобилӣ", "Flutter,Firebase,Dart,API", 4000, "food", "Хуҷанд", 20],
  ["client@demo.tj", "Telegram-бот барои мағозаи онлайн", "Боти Telegram барои қабули фармоиш, каталоги мол ва огоҳиномаҳо ба менеҷер.", "Ботҳо", "Python,Telegram API,PostgreSQL", 1200, "dashboard", "Душанбе", 28],
  ["client@demo.tj", "Логотип ва брендбук барои стартап", "Логотипи нав ва дастури бренд барои стартапи технологӣ: рангҳо, типография ва намунаҳо.", "Дизайн", "Illustrator,Branding,Logo", 900, "logo", "Хуҷанд", 50],
  ["client2@demo.tj", "Реклама дар Instagram барои қаҳвахона", "Стратегияи SMM ва 12 пости рекламавӣ барои қаҳвахонаи нав дар Хуҷанд.", "Маркетинг", "SMM,Instagram,Content", 700, "translate", "Хуҷанд", 72],
];
const COVER_BY_CAT = { "Веб-таҳия": "website", "Дизайн": "logo", "Мобилӣ": "mobile", "Маркетинг": "translate", "Тарҷума": "translate", "Ботҳо": "dashboard" };
const ids = {};
let hash;
for (const [email, name, role, av, city, title, skills, rate, exp] of users) {
  let u = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!u) {
    hash ??= await bcrypt.hash("password123", 10);
    u = await prisma.user.create({ data: { email, passwordHash: hash, name, role, avatarUrl: A(av), city }, include: { profile: true } });
  } else {
    const keepAvatar = u.avatarUrl && !u.avatarUrl.includes("/seed-") && !u.avatarUrl.startsWith("/img/");
    await prisma.user.update({ where: { id: u.id }, data: { city, ...(keepAvatar ? {} : { avatarUrl: A(av) }) } });
  }
  if (role === "FREELANCER") {
    if (u.profile) await prisma.freelancerProfile.update({ where: { id: u.profile.id }, data: { experienceYears: exp } });
    else await prisma.freelancerProfile.create({ data: { userId: u.id, title, bio: title, skills, hourlyRate: rate, experienceYears: exp, portfolio: "" } });
  }
  ids[email] = u.id;
}
// Demo admin (clearly marked as demo). Created only if missing.
if (!(await prisma.user.findUnique({ where: { email: "admin@demo.tj" } }))) {
  hash ??= await bcrypt.hash("password123", 10);
  await prisma.user.create({ data: { email: "admin@demo.tj", passwordHash: hash, name: "Маъмури намоишӣ (Demo Admin)", role: "CLIENT", isAdmin: true, isDemo: true, avatarUrl: A("user"), clientProfile: { create: {} } } });
  console.log("[seed-refresh-demo] created demo admin admin@demo.tj");
}
let created = 0;
for (const [email, title, description, category, skills, budget, cover, city, hrs] of projects) {
  const exists = await prisma.project.findFirst({ where: { title } });
  if (exists) continue;
  await prisma.project.create({ data: { clientId: ids[email], title, description, category, skills, budget, coverUrl: C(cover), city, status: "OPEN", deadline: new Date(Date.now() + 30 * 864e5), createdAt: new Date(Date.now() - hrs * 36e5) } });
  created++;
}
const demoIds = Object.values(ids);
const bare = await prisma.project.findMany({ where: { clientId: { in: demoIds }, coverUrl: null } });
for (const p of bare) await prisma.project.update({ where: { id: p.id }, data: { coverUrl: C(COVER_BY_CAT[p.category] || "website") } });
await normalize(prisma, { userIds: demoIds });
await seedWorks(prisma);
await prisma.user.updateMany({ where: { email: { endsWith: "@demo.tj" } }, data: { isDemo: true } });
console.log(`[seed-refresh-demo] normalized demo data; created ${created} sample projects, added covers to ${bare.length} demo projects`);
await prisma.$disconnect();
