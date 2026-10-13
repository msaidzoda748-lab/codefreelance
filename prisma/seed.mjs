import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function tinyPng(relPath) {
  // 1x1 PNG
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const full = path.join(process.cwd(), "public", relPath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, Buffer.from(b64, "base64"));
  return "/" + relPath.replace(/\\/g, "/");
}

async function main() {
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.project.deleteMany();
  await prisma.freelancerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);
  const avatar1 = await tinyPng("uploads/avatars/seed-freelancer.png");
  const avatar2 = await tinyPng("uploads/avatars/seed-designer.png");
  const projAtt = await tinyPng("uploads/projects/seed-brief.png");
  const chatImg = await tinyPng("uploads/chat/seed-mock.png");

  const client1 = await prisma.user.create({
    data: {
      email: "client@demo.tj",
      passwordHash,
      name: "Алишер Раҳимов",
      role: "CLIENT",
    },
  });
  const client2 = await prisma.user.create({
    data: {
      email: "client2@demo.tj",
      passwordHash,
      name: "Заррина Қаюмова",
      role: "CLIENT",
    },
  });

  const freelancers = [];
  const freelData = [
    {
      email: "freelancer@demo.tj",
      name: "Дилшод Неъматов",
      title: "Таҳиягари Full-Stack",
      bio: "5 сол таҷриба дар Next.js, React ва Node.js.",
      skills: "React,Next.js,TypeScript,Node.js,PostgreSQL",
      hourlyRate: 25,
      portfolio: "https://github.com/demo\nhttps://dilshod.dev",
      avatarUrl: avatar1,
    },
    {
      email: "designer@demo.tj",
      name: "Мадина Саидова",
      title: "Дизайнери UI/UX",
      bio: "Дизайни интерфейсҳои зебо барои веб ва мобилӣ.",
      skills: "Figma,UI/UX,Adobe XD,Illustration",
      hourlyRate: 20,
      portfolio: "https://behance.net/demo",
      avatarUrl: avatar2,
    },
    {
      email: "mobile@demo.tj",
      name: "Ҷамшед Ҳакимов",
      title: "Таҳиягари мобилӣ",
      bio: "Flutter ва React Native.",
      skills: "Flutter,React Native,Dart,Firebase",
      hourlyRate: 22,
      portfolio: "https://github.com/jamshid",
    },
  ];

  for (const f of freelData) {
    const u = await prisma.user.create({
      data: {
        email: f.email,
        passwordHash,
        name: f.name,
        role: "FREELANCER",
        avatarUrl: f.avatarUrl || null,
        profile: {
          create: {
            title: f.title,
            bio: f.bio,
            skills: f.skills,
            hourlyRate: f.hourlyRate,
            portfolio: f.portfolio,
          },
        },
      },
    });
    freelancers.push(u);
  }

  const in30 = new Date(Date.now() + 30 * 86400000);
  const in45 = new Date(Date.now() + 45 * 86400000);
  const in20 = new Date(Date.now() + 20 * 86400000);

  const p1 = await prisma.project.create({
    data: {
      clientId: client1.id,
      title: "Вебсайти ширкати тиҷоратӣ",
      description:
        "Вебсайти муосир: саҳифаи асосӣ, каталог, шакли тамос ва блог.",
      category: "Веб-таҳия",
      skills: "Next.js,React,Tailwind",
      budget: 2500,
      deadline: in30,
      status: "OPEN",
      attachments: {
        create: {
          uploaderId: client1.id,
          url: projAtt,
          name: "brief.png",
          mimeType: "image/png",
          size: 70,
        },
      },
    },
  });

  await prisma.project.create({
    data: {
      clientId: client1.id,
      title: "Дизайни логотип ва брендбук",
      description: "Логотип ва дастури бренд барои стартап.",
      category: "Дизайн",
      skills: "Figma,Branding",
      budget: 800,
      deadline: in20,
      status: "OPEN",
    },
  });

  await prisma.project.create({
    data: {
      clientId: client2.id,
      title: "Барномаи мобилӣ барои расонидани ғизо",
      description: "Барномаи Flutter барои фармоиш ва расонидан.",
      category: "Мобилӣ",
      skills: "Flutter,Firebase",
      budget: 4000,
      deadline: in45,
      status: "OPEN",
    },
  });

  await prisma.proposal.create({
    data: {
      projectId: p1.id,
      freelancerId: freelancers[0].id,
      coverLetter:
        "Салом! Метавонам дар 3 ҳафта MVP-ро пешниҳод кунам.",
      price: 2200,
      deliveryDays: 21,
    },
  });

  await prisma.proposal.create({
    data: {
      projectId: p1.id,
      freelancerId: freelancers[1].id,
      coverLetter: "Метавонам дизайни UI-ро омода кунам.",
      price: 900,
      deliveryDays: 14,
    },
  });

  await prisma.notification.create({
    data: {
      userId: client1.id,
      type: "NEW_PROPOSAL",
      title: "Пешниҳоди нав",
      body: "Дилшод Неъматов ба лоиҳаи «Вебсайти ширкати тиҷоратӣ» пешниҳод дод",
      link: `/projects/${p1.id}`,
      read: false,
    },
  });

  const translator = await prisma.user.create({
    data: {
      email: "translator@demo.tj",
      passwordHash,
      name: "Нигора Юсуфӣ",
      role: "FREELANCER",
      profile: {
        create: {
          title: "Тарҷумон",
          bio: "Тарҷумаи касбӣ: тоҷикӣ, русӣ, англисӣ.",
          skills: "Тарҷума,Тоҷикӣ,Русӣ,Англисӣ",
          hourlyRate: 15,
          portfolio: "https://proz.com/demo",
        },
      },
    },
  });

  const pDone = await prisma.project.create({
    data: {
      clientId: client2.id,
      title: "Тарҷумаи ҳуҷҷатҳои ширкат",
      description: "Тарҷума аз русӣ ба тоҷикӣ ва англисӣ.",
      category: "Тарҷума",
      skills: "Тарҷума,Тоҷикӣ,Англисӣ",
      budget: 500,
      deadline: new Date(Date.now() - 5 * 86400000),
      status: "COMPLETED",
    },
  });

  const propDone = await prisma.proposal.create({
    data: {
      projectId: pDone.id,
      freelancerId: translator.id,
      coverLetter: "Зуд ва бо сифат анҷом медиҳам.",
      price: 450,
      deliveryDays: 7,
      status: "ACCEPTED",
    },
  });
  await prisma.project.update({
    where: { id: pDone.id },
    data: { acceptedProposalId: propDone.id },
  });

  await prisma.review.create({
    data: {
      projectId: pDone.id,
      fromUserId: client2.id,
      toUserId: translator.id,
      rating: 5,
      comment: "Корро зуд ва бо сифати аъло анҷом дод!",
    },
  });
  await prisma.review.create({
    data: {
      projectId: pDone.id,
      fromUserId: translator.id,
      toUserId: client2.id,
      rating: 5,
      comment: "Мизоҷи хуб.",
    },
  });

  await prisma.notification.create({
    data: {
      userId: translator.id,
      type: "NEW_REVIEW",
      title: "Баҳои нав",
      body: "Заррина Қаюмова ба шумо 5 ситора дод",
      link: `/projects/${pDone.id}`,
      read: false,
    },
  });

  const pProg = await prisma.project.create({
    data: {
      clientId: client1.id,
      title: "Даштборди аналитика",
      description: "Даштборди оддӣ бо графикҳо барои фурӯш.",
      category: "Веб-таҳия",
      skills: "React,Chart.js,API",
      budget: 1800,
      deadline: in30,
      status: "IN_PROGRESS",
    },
  });

  const propProg = await prisma.proposal.create({
    data: {
      projectId: pProg.id,
      freelancerId: freelancers[0].id,
      coverLetter: "Чунин даштбордҳоро қаблан сохтаам.",
      price: 1700,
      deliveryDays: 18,
      status: "ACCEPTED",
    },
  });
  await prisma.project.update({
    where: { id: pProg.id },
    data: { acceptedProposalId: propProg.id },
  });

  const m1 = await prisma.message.create({
    data: {
      projectId: pProg.id,
      senderId: client1.id,
      body: "Салом Дилшод! Кай макетро медиҳед?",
    },
  });
  await prisma.message.create({
    data: {
      projectId: pProg.id,
      senderId: freelancers[0].id,
      body: "Салом! То ҷумъа макети аввалияро мефиристам.",
      readAt: new Date(),
      attachments: {
        create: {
          uploaderId: freelancers[0].id,
          url: chatImg,
          name: "mock.png",
          mimeType: "image/png",
          size: 70,
        },
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: freelancers[0].id,
      type: "CHAT_MESSAGE",
      title: "Паёми нав",
      body: "Алишер Раҳимов: Салом Дилшод! Кай макетро медиҳед?",
      link: `/projects/${pProg.id}/chat`,
      read: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId: freelancers[0].id,
      type: "PROPOSAL_ACCEPTED",
      title: "Пешниҳод қабул шуд",
      body: "Пешниҳоди шумо барои «Даштборди аналитика» қабул шуд",
      link: `/projects/${pProg.id}/chat`,
      read: true,
    },
  });

  console.log("Seed OK (Postgres)");
  console.log("Demo password: password123");
  console.log("  client@demo.tj, freelancer@demo.tj, designer@demo.tj, ...");
  console.log("chat project", pProg.id, "msg", m1.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
