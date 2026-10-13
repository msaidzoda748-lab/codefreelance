-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Душанбе',
ADD COLUMN     "coverUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT NOT NULL DEFAULT 'Душанбе';
