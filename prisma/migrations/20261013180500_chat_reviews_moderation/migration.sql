-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "clientMessageId" TEXT,
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "dedupeKey" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orderId" TEXT;

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "orderId" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMember" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedById" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "meta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_orderId_key" ON "Conversation"("orderId");

-- CreateIndex
CREATE INDEX "Conversation_projectId_idx" ON "Conversation"("projectId");

-- CreateIndex
CREATE INDEX "ConversationMember_userId_idx" ON "ConversationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_targetType_targetId_key" ON "Report"("reporterId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_senderId_clientMessageId_key" ON "Message"("senderId", "clientMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "Review_toUserId_hidden_idx" ON "Review"("toUserId", "hidden");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_fromUserId_key" ON "Review"("orderId", "fromUserId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ================= DATA MIGRATION =================
-- Conversations for every order (participants = client + hired freelancer)
INSERT INTO "Conversation" ("id","projectId","orderId","lastMessageAt","createdAt")
SELECT 'conv_' || o."id", o."projectId", o."id",
       COALESCE((SELECT MAX(m."createdAt") FROM "Message" m WHERE m."projectId" = o."projectId"), o."createdAt"), o."createdAt"
FROM "Order" o ON CONFLICT DO NOTHING;
INSERT INTO "ConversationMember" ("id","conversationId","userId","lastReadAt","createdAt")
SELECT 'cm_' || md5(c."id" || u.uid), c."id", u.uid,
       (SELECT MAX(m."readAt") FROM "Message" m WHERE m."projectId" = c."projectId" AND m."senderId" <> u.uid), NOW()
FROM "Conversation" c JOIN "Order" o ON o."id" = c."orderId"
CROSS JOIN LATERAL (VALUES (o."clientId"), (o."freelancerId")) AS u(uid)
ON CONFLICT DO NOTHING;
-- Messages of projects without an order: one conversation per project with all senders + client
INSERT INTO "Conversation" ("id","projectId","lastMessageAt","createdAt")
SELECT 'conv_p_' || p."id", p."id", MAX(m."createdAt"), MIN(m."createdAt")
FROM "Message" m JOIN "Project" p ON p."id" = m."projectId"
WHERE NOT EXISTS (SELECT 1 FROM "Order" o WHERE o."projectId" = p."id")
GROUP BY p."id" ON CONFLICT DO NOTHING;
INSERT INTO "ConversationMember" ("id","conversationId","userId","createdAt")
SELECT DISTINCT 'cm_' || md5('conv_p_' || x.pid || x.uid), 'conv_p_' || x.pid, x.uid, NOW()
FROM (SELECT m."projectId" AS pid, m."senderId" AS uid FROM "Message" m UNION SELECT p."id", p."clientId" FROM "Project" p) x
WHERE EXISTS (SELECT 1 FROM "Conversation" c WHERE c."id" = 'conv_p_' || x.pid)
ON CONFLICT DO NOTHING;
UPDATE "Message" m SET "conversationId" = c."id" FROM "Conversation" c
WHERE m."conversationId" IS NULL AND c."projectId" = m."projectId";

-- Reviews linked to orders
UPDATE "Review" r SET "orderId" = o."id" FROM "Order" o WHERE o."projectId" = r."projectId" AND r."orderId" IS NULL;
