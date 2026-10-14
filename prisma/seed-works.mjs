// Demo showcase works for demo freelancers. Idempotent: never touches non-demo users.
const C = (n) => `/img/covers/${n}.svg`;
const WORKS = {
  "freelancer@demo.tj": [
    { title: "AutoLux — сайти автосалон", cat: "web", tech: "Next.js, PostgreSQL, Tailwind", images: [C("website"), C("dashboard")], link: "https://autolux.example.com", sourceUrl: "https://github.com/zoir-demo/autolux", description: "Сайти пурраи автосалон бо каталог, филтрҳо, саҳифаи мошин ва формаи дархост. SSR, SEO ва админ-панел." },
    { title: "Дашборди фурӯш", cat: "web", tech: "React, Node.js, Chart.js", images: [C("dashboard"), C("website")], link: "https://sales-dash.example.com", sourceUrl: "https://github.com/zoir-demo/sales-dashboard", description: "Таҳлили фурӯш дар вақти воқеӣ: графикҳо, ҳисоботҳо ва содироти Excel." },
  ],
  "mobile@demo.tj": [
    { title: "Food Express — барномаи расонидани хӯрок", cat: "mobile", tech: "Flutter, Firebase, Dart", images: [C("food"), C("mobile")], appStoreUrl: "https://apps.apple.com/app/id6400000001", playUrl: "https://play.google.com/store/apps/details?id=tj.example.foodexpress", downloadUrl: "https://downloads.example.com/foodexpress.apk", description: "Фармоиши хӯрок аз тарабхонаҳои Душанбе: меню, сабад, пайгирии курйер ва пардохт ҳангоми гирифтан." },
    { title: "Fitness Tracker", cat: "mobile", tech: "React Native, Expo, TypeScript", images: [C("mobile")], playUrl: "https://play.google.com/store/apps/details?id=tj.example.fitness", sourceUrl: "https://github.com/zoir-demo/fitness-tracker", description: "Пайгирии машқҳо, қадамҳо ва об. Ҳолати офлайн ва ҳамоҳангсозӣ." },
  ],
  "designer@demo.tj": [
    { title: "Дизайни барномаи бонкӣ", cat: "design", tech: "Figma, UI/UX, Prototyping", images: [C("mobile"), C("dashboard")], link: "https://www.figma.com/community/file/0000000000/zoir-demo-bank", description: "UI/UX барои барномаи мобилии бонк: 40+ экран, дизайн-система ва прототипи интерактивӣ." },
  ],
  "brand@demo.tj": [
    { title: "Брендбуки қаҳвахонаи «Помир»", cat: "design", tech: "Illustrator, Branding, Logo", images: [C("logo"), C("food")], link: "https://www.behance.net/gallery/000000/zoir-demo-pamir", description: "Логотип, ранг ва ҳуруф, бастабандӣ ва маводи SMM барои қаҳвахона." },
  ],
  "translator@demo.tj": [
    { title: "Локализатсияи сайти туристӣ", cat: "translate", tech: "Тарҷума, Англисӣ, Русӣ", images: [C("translate")], link: "https://visit-tj.example.com", description: "Тарҷумаи 120 саҳифа ба се забон бо мутобиқсозии SEO." },
  ],
};

export async function seedWorks(prisma) {
  const cats = Object.fromEntries((await prisma.category.findMany({ select: { id: true, slug: true } })).map((c) => [c.slug, c.id]));
  let created = 0;
  for (const [email, list] of Object.entries(WORKS)) {
    const u = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!u?.isDemo || !u.profile) continue;
    // legacy link-only items generated from the old free-text portfolio
    await prisma.portfolioItem.deleteMany({ where: { profileId: u.profile.id, images: "" } });
    for (const [i, w] of list.entries()) {
      if (await prisma.portfolioItem.findFirst({ where: { profileId: u.profile.id, title: w.title } })) continue;
      const { cat, images, ...rest } = w;
      await prisma.portfolioItem.create({ data: { ...rest, images: images.join("\n"), categoryId: cats[cat] ?? null, profileId: u.profile.id, views: 40 + ((i * 37 + email.length * 13) % 200), createdAt: new Date(Date.now() - (i + 1) * 5 * 86400000) } });
      created++;
    }
  }
  return created;
}
