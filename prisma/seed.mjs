import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const day = 86400000;
const ago = (d, h = 0) => new Date(Date.now() - d * day - h * 3600000);
const A = (n) => `/img/avatars/${n}.svg`;
const C = (n) => `/img/covers/${n}.svg`;

async function main() {
  for (const m of ["passwordResetToken", "clientProfile", "notification", "attachment", "review", "message", "proposal", "project", "freelancerProfile", "session", "user"]) {
    await prisma[m].deleteMany();
  }
  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({ data: { email: "admin@demo.tj", passwordHash, name: "Маъмури намоишӣ (Demo Admin)", role: "CLIENT", isAdmin: true, isDemo: true, avatarUrl: A("user"), city: "Душанбе", clientProfile: { create: {} } } });
  const client1 = await prisma.user.create({ data: { email: "client@demo.tj", passwordHash, name: "Алишер Раҳимов", role: "CLIENT", isDemo: true, avatarUrl: A("alisher"), city: "Душанбе", clientProfile: { create: { company: "AutoLux" } } } });
  const client2 = await prisma.user.create({ data: { email: "client2@demo.tj", passwordHash, name: "Заррина Қаюмова", role: "CLIENT", isDemo: true, avatarUrl: A("zarrina"), city: "Хуҷанд", clientProfile: { create: {} } } });

  const fdata = [
    ["freelancer@demo.tj", "Дилшод Неъматов", "Full Stack Developer", "dilshod", "Душанбе", "React,Node.js,MongoDB,Next.js,PostgreSQL", 120, "5 сол таҷриба дар сохтани вебсайтҳо ва барномаҳои веб барои ширкатҳои Тоҷикистон ва берун аз он."],
    ["designer@demo.tj", "Мадина Саидова", "UI/UX дизайнер", "madina", "Душанбе", "Figma,UI/UX,Mobile App,Prototyping", 100, "Дизайни интерфейсҳои зебо ва қулай барои веб ва мобилӣ."],
    ["marketing@demo.tj", "Сомон Иброҳимов", "Маркетинг мутахассис", "somon", "Хуҷанд", "SMM,Content,Strategy,Ads", 80, "Стратегияи SMM ва рекламаи рақамӣ барои брендҳои маҳаллӣ."],
    ["mobile@demo.tj", "Ҷамшед Ҳакимов", "Таҳиягари мобилӣ", "jamshed", "Бохтар", "Flutter,React Native,Dart,Firebase", 110, "Барномаҳои iOS ва Android бо Flutter ва React Native."],
    ["translator@demo.tj", "Нигора Юсуфӣ", "Тарҷумон", "nigora", "Кӯлоб", "Тарҷума,Тоҷикӣ,Русӣ,Англисӣ", 60, "Тарҷумаи касбӣ: тоҷикӣ, русӣ, англисӣ."],
    ["brand@demo.tj", "Фарангис Раҷабова", "Графикӣ дизайнер", "farangis", "Истаравшан", "Illustrator,Branding,Logo", 90, "Логотип, брендбук ва иллюстратсия."],
  ];
  const EXP = {"freelancer@demo.tj": 5, "designer@demo.tj": 4, "marketing@demo.tj": 3, "mobile@demo.tj": 6, "translator@demo.tj": 7, "brand@demo.tj": 4};
  const F = {};
  for (const [email, name, title, av, city, skills, rate, bio] of fdata) {
    F[email] = await prisma.user.create({
      data: { email, passwordHash, name, role: "FREELANCER", isDemo: true, avatarUrl: A(av), city,
        profile: { create: { title, bio, skills, hourlyRate: rate, experienceYears: EXP[email] ?? 2, portfolio: `https://github.com/${av}\nhttps://behance.net/${av}` } } },
    });
  }

  const open = [
    [client1, "Сохтани вебсайти автосалон", "Барои автосалони мо вебсайти муосир бо каталоги мошинҳо, филтр ва формаи тамос лозим аст.", "Веб-таҳия", "React,Next.js", 2500, "website", "Душанбе", 2],
    [client2, "Дизайни барномаи мобилӣ", "Дизайни замонавии барномаи мобилӣ барои хизматрасонии онлайн лозим аст.", "Дизайн", "UI/UX,Figma", 1800, "mobile", "Душанбе", 5],
    [client1, "Логотип ва брендбук барои стартап", "Логотипи нав ва дастури бренд барои стартапи технологӣ: рангҳо, типография ва намунаҳо.", "Дизайн", "Illustrator,Branding,Logo", 900, "logo", "Хуҷанд", 50],
    [client2, "Барномаи фармоиши ғизо", "Барномаи Flutter барои фармоиш ва расонидани ғизо дар Хуҷанд: меню, сабад, пайгирӣ.", "Мобилӣ", "Flutter,Firebase,Dart,API", 4000, "food", "Хуҷанд", 20],
    [client1, "Telegram-бот барои мағозаи онлайн", "Боти Telegram барои қабули фармоиш, каталоги мол ва огоҳиномаҳо ба менеҷер.", "Ботҳо", "Python,Telegram API,PostgreSQL", 1200, "dashboard", "Душанбе", 28],
    [client2, "Реклама дар Instagram барои қаҳвахона", "Стратегияи SMM ва 12 пости рекламавӣ барои қаҳвахонаи нав дар Хуҷанд.", "Маркетинг", "SMM,Instagram,Content", 700, "translate", "Хуҷанд", 72],
  ];
  const P = [];
  for (const [cl, title, description, category, skills, budget, cover, city, hrs] of open) {
    P.push(await prisma.project.create({ data: { clientId: cl.id, title, description, category, skills, budget, coverUrl: C(cover), city,
      deadline: new Date(Date.now() + 30 * day), createdAt: ago(0, hrs) } }));
  }
  await prisma.attachment.create({ data: { uploaderId: client1.id, projectId: P[0].id, url: C("website"), name: "brief-autosalon.svg", mimeType: "image/svg+xml", size: 2048 } });

  const prop = async (p, f, letter, price, days, status = "PENDING") =>
    prisma.proposal.create({ data: { projectId: p.id, freelancerId: F[f].id, coverLetter: letter, price, deliveryDays: days, status } });
  await prop(P[0], "freelancer@demo.tj", "Салом! Ман 5 сол таҷриба дар Next.js дорам. MVP-ро дар 3 ҳафта супорида метавонам.", 2300, 21);
  await prop(P[0], "designer@demo.tj", "Дизайни UI/UX-и сайтро дар Figma омода мекунам ва бо таҳиягар ҳамкорӣ мекунам.", 900, 14);
  await prop(P[1], "designer@demo.tj", "Дизайни барномаҳои мобилӣ кори асосии ман аст. 3 варианти аввалия пешниҳод мекунам.", 1700, 18);
  await prop(P[2], "brand@demo.tj", "Логотип ва брендбук — соҳаи ман. Дар 10 рӯз тайёр мекунам.", 850, 10);

  // completed projects + reviews (for ratings)
  const done = [
    ["freelancer@demo.tj", [5, 5, 5, 5, 5, 5], "website"],
    ["designer@demo.tj", [5, 5, 5, 5, 5], "mobile"],
    ["marketing@demo.tj", [5, 5, 5, 4, 5], "logo"],
    ["translator@demo.tj", [5, 5, 4], "translate"],
    ["mobile@demo.tj", [5, 4, 5], "food"],
    ["brand@demo.tj", [5, 5], "logo"],
  ];
  const titles = {
    "freelancer@demo.tj": ["Сайти мағозаи онлайн", "CRM барои клиника", "Портали хабарӣ", "Лендинги курсҳо", "Системаи брон барои меҳмонхона", "API барои логистика"],
    "designer@demo.tj": ["Дизайни барномаи бонкӣ", "UI-и таксӣ-апп", "Редизайни сайти донишгоҳ", "Прототипи фитнес-апп", "Дизайни дашборд"],
    "marketing@demo.tj": ["SMM барои қаҳвахона", "Рекламаи Instagram барои бутик", "Стратегияи контент", "Кампанияи Навруз", "SEO барои сайти сайёҳӣ"],
    "translator@demo.tj": ["Тарҷумаи шартномаҳо", "Субтитрҳои филм", "Тарҷумаи сайт ба англисӣ"],
    "mobile@demo.tj": ["Барномаи расонидан", "Апп барои мактаб", "Барномаи сайёҳӣ"],
    "brand@demo.tj": ["Логотипи нонвойхона", "Брендбуки ширкати сохтмонӣ"],
  };
  const cities = ["Душанбе", "Хуҷанд", "Бохтар", "Кӯлоб", "Истаравшан", "Панҷакент", "Хоруғ"];
  const comments = ["Корро зуд ва бо сифати аъло анҷом дод. Тавсия медиҳам!", "Мутахассиси касбӣ, муошираташ хуб.", "Натиҷа аз интизорӣ беҳтар шуд.", "Мӯҳлатҳоро риоя кард, ташаккур!", "Боз ҳамкорӣ мекунем."];
  let k = 0;
  for (const [f, ratings, cover] of done) {
    for (const [ri, r] of ratings.entries()) {
      const cl = k % 2 ? client2 : client1;
      const pr = await prisma.project.create({ data: { clientId: cl.id, title: titles[f][ri], description: "Лоиҳа бомуваффақият анҷом ёфт ва аз ҷониби мизоҷ қабул шуд.", category: { "freelancer@demo.tj": "Веб-таҳия", "designer@demo.tj": "Дизайн", "marketing@demo.tj": "Маркетинг", "translator@demo.tj": "Тарҷума", "mobile@demo.tj": "Мобилӣ", "brand@demo.tj": "Дизайн" }[f], skills: F[f].name ? "" : "", budget: 500 + k * 100, coverUrl: C(cover), city: cities[k % cities.length], deadline: ago(10 + k), status: "COMPLETED", createdAt: ago(40 + k) } });
      const pp = await prisma.proposal.create({ data: { projectId: pr.id, freelancerId: F[f].id, coverLetter: "Омодаам.", price: 450 + k * 90, deliveryDays: 7, status: "ACCEPTED" } });
      await prisma.project.update({ where: { id: pr.id }, data: { acceptedProposalId: pp.id } });
      await prisma.review.create({ data: { projectId: pr.id, fromUserId: cl.id, toUserId: F[f].id, rating: r, comment: comments[k % comments.length], createdAt: ago(5 + k) } });
      await prisma.review.create({ data: { projectId: pr.id, fromUserId: F[f].id, toUserId: cl.id, rating: 5, comment: "Мизоҷи хуб, ҳама чиз равшан буд." } });
      k++;
    }
  }

  // in-progress with chat
  const prog = await prisma.project.create({ data: { clientId: client1.id, title: "Даштборди аналитикаи фурӯш", description: "Даштборди оддӣ бо графикҳо барои фурӯши мағозаҳо дар Душанбе.", category: "Веб-таҳия", skills: "React,Chart.js,API", budget: 1800, coverUrl: C("dashboard"), city: "Душанбе", deadline: new Date(Date.now() + 25 * day), status: "IN_PROGRESS", createdAt: ago(3) } });
  const pp = await prop(prog, "freelancer@demo.tj", "Чунин даштбордҳоро қаблан сохтаам.", 1700, 18, "ACCEPTED");
  await prisma.project.update({ where: { id: prog.id }, data: { acceptedProposalId: pp.id } });
  await prisma.message.create({ data: { projectId: prog.id, senderId: client1.id, body: "Салом Дилшод! Кай макетро медиҳед?", createdAt: ago(1, 3), readAt: ago(1, 2) } });
  await prisma.message.create({ data: { projectId: prog.id, senderId: F["freelancer@demo.tj"].id, body: "Салом! Ана макети аввалия, назаратонро гӯед.", createdAt: ago(1, 2), readAt: ago(1, 1),
    attachments: { create: { uploaderId: F["freelancer@demo.tj"].id, url: C("dashboard"), name: "maket-v1.svg", mimeType: "image/svg+xml", size: 3000 } } } });
  await prisma.message.create({ data: { projectId: prog.id, senderId: client1.id, body: "Олӣ! Графики фурӯшро калонтар кунед, лутфан.", createdAt: ago(0, 5) } });

  const n = (u, type, title, body, link, read = false) => prisma.notification.create({ data: { userId: u.id, type, title, body, link, read } });
  await n(client1, "NEW_PROPOSAL", "Пешниҳоди нав", "Дилшод Неъматов ба лоиҳаи «Сохтани вебсайти автосалон» пешниҳод дод", `/projects/${P[0].id}`);
  await n(client1, "NEW_PROPOSAL", "Пешниҳоди нав", "Фарангис Раҷабова ба лоиҳаи «Логотип ва брендбук» пешниҳод дод", `/projects/${P[2].id}`);
  await n(client1, "CHAT_MESSAGE", "Паёми нав", "Дилшод Неъматов: Ана макети аввалия...", `/projects/${prog.id}/chat`);
  await n(client1, "NEW_REVIEW", "Баҳои нав", "Дилшод Неъматов ба шумо 5 ситора дод", `/projects/${prog.id}`, true);
  await n(F["freelancer@demo.tj"], "PROPOSAL_ACCEPTED", "Пешниҳод қабул шуд", "Пешниҳоди шумо барои «Даштборди аналитикаи фурӯш» қабул шуд", `/projects/${prog.id}/chat`);
  await n(F["freelancer@demo.tj"], "CHAT_MESSAGE", "Паёми нав", "Алишер Раҳимов: Графики фурӯшро калонтар кунед", `/projects/${prog.id}/chat`);

  console.log("Seed OK. Password for all demo users: password123");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
