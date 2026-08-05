-- Admin controls for wager leaderboards: race start time, per-rank prize
-- distribution, and an archive snapshot so past winners stay visible after
-- a board is taken down.
ALTER TABLE "wager_leaderboards" ADD COLUMN "starts_at" TIMESTAMP(3);
ALTER TABLE "wager_leaderboards" ADD COLUMN "prize_distribution" JSONB;
ALTER TABLE "wager_leaderboards" ADD COLUMN "archived_at" TIMESTAMP(3);
ALTER TABLE "wager_leaderboards" ADD COLUMN "winners" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX "idx_wager_leaderboards_archived_at" ON "wager_leaderboards"("archived_at");
