-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twitch_username" TEXT,
ADD COLUMN     "twitch_verified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_twitch_username_key" ON "users"("twitch_username");

-- CreateIndex
CREATE INDEX "idx_users_twitch_username" ON "users"("twitch_username");
