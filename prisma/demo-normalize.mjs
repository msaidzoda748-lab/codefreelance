// Idempotent normalizer: brings legacy-shaped rows up to the v4 model (categories, skills, orders,
// milestones, conversations, review→order links, portfolio items). Used by seed.mjs and
// seed-refresh-demo.mjs. When `userIds` is given, only rows owned by those users are touched.
const CAT_BY_NAME = { "Веб-таҳия": "cat_web", "Дизайн": "cat_design", "Мобилӣ": "cat_mobile", "Маркетинг": "cat_marketing", "Тарҷума": "cat_translate", "Ботҳо": "cat_bots", "Барномасозӣ": "cat_dev", "Матн": "cat_writing" };
const split = (s) => [...new Set((s || "").split(/[,\n]/).map((x) => x.trim()).filter(Boolean))];

export async function normalize(prisma, { userIds } = {}) {
  const own = userIds ? { clientId: { in: userIds } } : {};
  const cats = new Set((await prisma.category.findMany({ select: { id: true } })).map((c) => c.id));
  const catOf = (name) => { const id = CAT_BY_NAME[name] || "cat_other"; return cats.has(id) ? id : null; };

  for (const p of await prisma.project.findMany({ where: { ...own }, include: { skillsRel: { select: { id: true } } } })) {
    const data = {};
    if (!p.categoryId) data.categoryId = catOf(p.category);
    if (!p.publishedAt && p.status !== "DRAFT") data.publishedAt = p.createdAt;
    if (!p.skillsRel.length && p.skills) {
      const names = split(p.skills);
      for (const name of names) await prisma.skill.upsert({ where: { name }, create: { name }, update: {} });
      data.skillsRel = { connect: names.map((name) => ({ name })) };
    }
    if (Object.keys(data).length) await prisma.project.update({ where: { id: p.id }, data });
  }
  for (const f of await prisma.freelancerProfile.findMany({ where: userIds ? { userId: { in: userIds } } : {}, include: { skillsRel: { select: { id: true } }, portfolioItems: { select: { id: true } } } })) {
    const data = {};
    if (!f.skillsRel.length && f.skills) {
      const names = split(f.skills);
      for (const name of names) await prisma.skill.upsert({ where: { name }, create: { name }, update: {} });
      data.skillsRel = { connect: names.map((name) => ({ name })) };
    }
    if (!f.portfolioItems.length && f.portfolio) {
      data.portfolioItems = { create: split(f.portfolio).filter((l) => /^https?:\/\//.test(l)).slice(0, 6).map((link) => ({ title: link.replace(/^https?:\/\/(www\.)?/, "").split("/")[0], link })) };
    }
    if (Object.keys(data).length) await prisma.freelancerProfile.update({ where: { id: f.id }, data });
  }
  await prisma.proposal.updateMany({ where: { status: "PENDING", ...(userIds ? { project: own } : {}) }, data: { status: "SENT" } });

  // Hired projects without an order → order + milestone + conversation (legacy chat messages attached).
  const hired = await prisma.project.findMany({ where: { ...own, acceptedProposalId: { not: null }, order: null, status: { in: ["IN_PROGRESS", "COMPLETED"] } } });
  for (const p of hired) {
    const pr = await prisma.proposal.findUnique({ where: { id: p.acceptedProposalId } });
    if (!pr) continue;
    const done = p.status === "COMPLETED";
    const order = await prisma.order.create({ data: {
      projectId: p.id, proposalId: pr.id, clientId: p.clientId, freelancerId: pr.freelancerId, price: pr.price, deadline: p.deadline,
      status: done ? "COMPLETED" : "IN_PROGRESS", completedAt: done ? p.updatedAt : null, createdAt: pr.updatedAt,
      milestones: { create: { title: ({ tj: "Иҷрои лоиҳа", ru: "Выполнение проекта", en: "Project delivery" })[p.language] || "Иҷрои лоиҳа", description: p.title, deadline: p.deadline, amount: pr.price, status: done ? "ACCEPTED" : "IN_PROGRESS" } },
    } });
    let conv = await prisma.conversation.findFirst({ where: { projectId: p.id, orderId: null, AND: [{ members: { some: { userId: p.clientId } } }, { members: { some: { userId: pr.freelancerId } } }] } });
    if (conv) conv = await prisma.conversation.update({ where: { id: conv.id }, data: { orderId: order.id } });
    else conv = await prisma.conversation.create({ data: { projectId: p.id, orderId: order.id, members: { create: [{ userId: p.clientId }, { userId: pr.freelancerId }] } } });
    await prisma.message.updateMany({ where: { projectId: p.id, conversationId: null }, data: { conversationId: conv.id } });
    const last = await prisma.message.findFirst({ where: { conversationId: conv.id }, orderBy: { createdAt: "desc" } });
    if (last) await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: last.createdAt } });
    await prisma.attachment.updateMany({ where: { message: { conversationId: conv.id } }, data: { visibility: "PRIVATE" } });
    await prisma.review.updateMany({ where: { projectId: p.id, orderId: null }, data: { orderId: order.id } });
  }
}
