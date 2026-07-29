-- CreateTable
CREATE TABLE "wager_leaderboards" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "prize_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "entries" JSONB NOT NULL DEFAULT '[]',
    "is_live" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wager_leaderboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_wager_leaderboards_is_live" ON "wager_leaderboards"("is_live");

-- AddForeignKey
ALTER TABLE "wager_leaderboards" ADD CONSTRAINT "wager_leaderboards_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
