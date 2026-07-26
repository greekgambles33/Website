-- AlterTable
ALTER TABLE "stream_games" ADD COLUMN     "prize_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prize_rules_text" TEXT;

-- CreateEnum
CREATE TYPE "LadderRunStatus" AS ENUM ('ACTIVE', 'CASHED_OUT', 'FAILED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "LadderRunPhase" AS ENUM ('ATTEMPTING', 'DECISION');

-- CreateTable
CREATE TABLE "ladder_runs" (
    "id" TEXT NOT NULL,
    "stream_game_id" TEXT NOT NULL,
    "participant_name" TEXT NOT NULL,
    "status" "LadderRunStatus" NOT NULL DEFAULT 'ACTIVE',
    "phase" "LadderRunPhase" NOT NULL DEFAULT 'ATTEMPTING',
    "current_level" INTEGER NOT NULL DEFAULT 0,
    "secured_floor" INTEGER NOT NULL DEFAULT 0,
    "final_points" INTEGER,
    "chat_pass_votes" INTEGER NOT NULL DEFAULT 0,
    "chat_fail_votes" INTEGER NOT NULL DEFAULT 0,
    "chat_cashout_votes" INTEGER NOT NULL DEFAULT 0,
    "chat_climb_votes" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "ladder_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_ladder_runs_game_status" ON "ladder_runs"("stream_game_id", "status");

-- AddForeignKey
ALTER TABLE "ladder_runs" ADD CONSTRAINT "ladder_runs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ladder_runs" ADD CONSTRAINT "ladder_runs_stream_game_id_fkey" FOREIGN KEY ("stream_game_id") REFERENCES "stream_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
