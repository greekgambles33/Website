-- AlterTable
ALTER TABLE "giveaways" ADD COLUMN     "requirement_text" TEXT;

-- AlterTable
ALTER TABLE "giveaway_entries" ADD COLUMN     "added_by_admin" BOOLEAN NOT NULL DEFAULT false;
