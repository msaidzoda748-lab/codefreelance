-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "submissionId" TEXT,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "FreelancerProfile" ADD COLUMN     "available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "languages" TEXT NOT NULL DEFAULT 'Тоҷикӣ,Русӣ',
ADD COLUMN     "rateMax" INTEGER,
ADD COLUMN     "rateMin" INTEGER;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budgetMax" INTEGER,
ADD COLUMN     "budgetMin" INTEGER,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'tj',
ADD COLUMN     "proposalDeadline" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'SENT';

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "images" TEXT NOT NULL DEFAULT '',
    "tech" TEXT NOT NULL DEFAULT '',
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameTj" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "deadline" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount" INTEGER,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "position" INTEGER NOT NULL DEFAULT 0,
    "deadlineNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneEvent" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "comment" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MilestoneEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FreelancerSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProposalPortfolio" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProjectSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "PortfolioItem_profileId_idx" ON "PortfolioItem"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SavedProject_userId_projectId_key" ON "SavedProject"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_projectId_key" ON "Order"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_proposalId_key" ON "Order"("proposalId");

-- CreateIndex
CREATE INDEX "Order_clientId_status_idx" ON "Order"("clientId", "status");

-- CreateIndex
CREATE INDEX "Order_freelancerId_status_idx" ON "Order"("freelancerId", "status");

-- CreateIndex
CREATE INDEX "Milestone_orderId_idx" ON "Milestone"("orderId");

-- CreateIndex
CREATE INDEX "Milestone_status_deadline_idx" ON "Milestone"("status", "deadline");

-- CreateIndex
CREATE INDEX "Submission_milestoneId_idx" ON "Submission"("milestoneId");

-- CreateIndex
CREATE INDEX "MilestoneEvent_milestoneId_idx" ON "MilestoneEvent"("milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "_FreelancerSkills_AB_unique" ON "_FreelancerSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_FreelancerSkills_B_index" ON "_FreelancerSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProposalPortfolio_AB_unique" ON "_ProposalPortfolio"("A", "B");

-- CreateIndex
CREATE INDEX "_ProposalPortfolio_B_index" ON "_ProposalPortfolio"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectSkills_AB_unique" ON "_ProjectSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectSkills_B_index" ON "_ProjectSkills"("B");

-- CreateIndex
CREATE INDEX "Project_status_createdAt_idx" ON "Project"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "Project"("clientId");

-- CreateIndex
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");

-- CreateIndex
CREATE INDEX "Proposal_freelancerId_status_idx" ON "Proposal"("freelancerId", "status");

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProject" ADD CONSTRAINT "SavedProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProject" ADD CONSTRAINT "SavedProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneEvent" ADD CONSTRAINT "MilestoneEvent_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneEvent" ADD CONSTRAINT "MilestoneEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreelancerSkills" ADD CONSTRAINT "_FreelancerSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "FreelancerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreelancerSkills" ADD CONSTRAINT "_FreelancerSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposalPortfolio" ADD CONSTRAINT "_ProposalPortfolio_A_fkey" FOREIGN KEY ("A") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposalPortfolio" ADD CONSTRAINT "_ProposalPortfolio_B_fkey" FOREIGN KEY ("B") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectSkills" ADD CONSTRAINT "_ProjectSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectSkills" ADD CONSTRAINT "_ProjectSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ================= DATA MIGRATION (preserves existing data) =================
-- 1) Categories (seeded once; idempotent)
INSERT INTO "Category" ("id","slug","nameTj","nameRu","nameEn","sort") VALUES
 ('cat_web','web','Веб-таҳия','Веб-разработка','Web development',1),
 ('cat_mobile','mobile','Мобилӣ','Мобильная разработка','Mobile apps',2),
 ('cat_dev','dev','Барномасозӣ','Программирование','Programming',3),
 ('cat_bots','bots','Ботҳо','Боты','Bots',4),
 ('cat_design','design','Дизайн','Дизайн','Design',5),
 ('cat_marketing','marketing','Маркетинг','Маркетинг','Marketing',6),
 ('cat_translate','translate','Тарҷума','Переводы','Translation',7),
 ('cat_writing','writing','Навиштан','Тексты','Writing',8),
 ('cat_other','other','Дигар','Другое','Other',9)
ON CONFLICT ("slug") DO NOTHING;
-- unknown legacy categories become their own category rows
INSERT INTO "Category" ("id","slug","nameTj","nameRu","nameEn","sort")
SELECT 'cat_' || md5(p."category"), 'legacy-' || substr(md5(p."category"),1,8), p."category", p."category", p."category", 50
FROM (SELECT DISTINCT "category" FROM "Project") p
WHERE p."category" <> '' AND NOT EXISTS (SELECT 1 FROM "Category" c WHERE c."nameTj" = p."category")
ON CONFLICT DO NOTHING;
UPDATE "Project" p SET "categoryId" = c."id" FROM "Category" c WHERE c."nameTj" = p."category" AND p."categoryId" IS NULL;

-- 2) Skills from comma-separated strings
INSERT INTO "Skill" ("id","name")
SELECT 'sk_' || md5(s), s FROM (
  SELECT DISTINCT trim(x) AS s FROM "Project", unnest(string_to_array("skills", ',')) AS x
  UNION
  SELECT DISTINCT trim(x) AS s FROM "FreelancerProfile", unnest(string_to_array("skills", ',')) AS x
) q WHERE s <> '' ON CONFLICT ("name") DO NOTHING;
INSERT INTO "_ProjectSkills" ("A","B")
SELECT DISTINCT p."id", k."id" FROM "Project" p, unnest(string_to_array(p."skills", ',')) AS x JOIN "Skill" k ON k."name" = trim(x)
ON CONFLICT DO NOTHING;
INSERT INTO "_FreelancerSkills" ("A","B")
SELECT DISTINCT f."id", k."id" FROM "FreelancerProfile" f, unnest(string_to_array(f."skills", ',')) AS x JOIN "Skill" k ON k."name" = trim(x)
ON CONFLICT DO NOTHING;

-- 3) Proposal statuses: PENDING -> SENT
UPDATE "Proposal" SET "status" = 'SENT' WHERE "status" = 'PENDING';

-- 4) Projects: publishedAt for already-public projects
UPDATE "Project" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL AND "status" <> 'DRAFT';

-- 5) Orders for already-hired projects (one per project, guaranteed by unique index)
INSERT INTO "Order" ("id","projectId","proposalId","clientId","freelancerId","price","status","deadline","completedAt","createdAt","updatedAt")
SELECT 'ord_' || p."id", p."id", pr."id", p."clientId", pr."freelancerId", pr."price",
       CASE WHEN p."status" = 'COMPLETED' THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
       GREATEST(p."deadline", pr."createdAt" + make_interval(days => pr."deliveryDays")),
       CASE WHEN p."status" = 'COMPLETED' THEN p."updatedAt" ELSE NULL END,
       pr."createdAt", NOW()
FROM "Project" p JOIN "Proposal" pr ON pr."id" = p."acceptedProposalId"
WHERE p."status" IN ('IN_PROGRESS','COMPLETED')
ON CONFLICT DO NOTHING;
-- 6) One default milestone per migrated order
INSERT INTO "Milestone" ("id","orderId","title","description","deadline","status","position","createdAt","updatedAt")
SELECT 'ms_' || o."id", o."id", 'Иҷрои лоиҳа', '', o."deadline",
       CASE WHEN o."status" = 'COMPLETED' THEN 'ACCEPTED' ELSE 'IN_PROGRESS' END, 0, o."createdAt", NOW()
FROM "Order" o WHERE NOT EXISTS (SELECT 1 FROM "Milestone" m WHERE m."orderId" = o."id");

-- 7) Legacy portfolio links -> PortfolioItem
INSERT INTO "PortfolioItem" ("id","profileId","title","link","createdAt")
SELECT 'pf_' || md5(f."id" || l), f."id",
       regexp_replace(regexp_replace(trim(l), '^https?://(www\.)?', ''), '/.*$', '') , trim(l), NOW()
FROM "FreelancerProfile" f, unnest(string_to_array(f."portfolio", E'\n')) AS l
WHERE trim(l) <> ''
ON CONFLICT DO NOTHING;

-- 8) Existing project/proposal/chat attachments: chat & proposal files become private
UPDATE "Attachment" SET "visibility" = 'PRIVATE' WHERE "messageId" IS NOT NULL OR "proposalId" IS NOT NULL;
