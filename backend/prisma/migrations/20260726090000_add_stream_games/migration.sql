-- CreateEnum
CREATE TYPE "PredictionChoice" AS ENUM ('CHAT', 'STREAMER');

-- CreateEnum
CREATE TYPE "PredictionMatchFormat" AS ENUM ('SHORT', 'NORMAL', 'EVENT');

-- CreateEnum
CREATE TYPE "PredictionMatchStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PredictionRoundStatus" AS ENUM ('OPEN', 'LOCKED', 'RESOLVED', 'VOID');

-- CreateEnum
CREATE TYPE "PredictionVoteSource" AS ENUM ('TWITCH', 'KICK');

-- CreateTable
CREATE TABLE "stream_games" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stream_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_matches" (
    "id" TEXT NOT NULL,
    "stream_game_id" TEXT NOT NULL,
    "format" "PredictionMatchFormat" NOT NULL DEFAULT 'NORMAL',
    "target_score" INTEGER NOT NULL DEFAULT 15,
    "status" "PredictionMatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "chat_score" INTEGER NOT NULL DEFAULT 0,
    "streamer_score" INTEGER NOT NULL DEFAULT 0,
    "chat_streak" INTEGER NOT NULL DEFAULT 0,
    "streamer_streak" INTEGER NOT NULL DEFAULT 0,
    "chat_underdog" BOOLEAN NOT NULL DEFAULT false,
    "streamer_underdog" BOOLEAN NOT NULL DEFAULT false,
    "winner" "PredictionChoice",
    "challenge_text" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "prediction_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_rounds" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "streamer_call" TEXT NOT NULL,
    "status" "PredictionRoundStatus" NOT NULL DEFAULT 'OPEN',
    "votes_chat" INTEGER NOT NULL DEFAULT 0,
    "votes_streamer" INTEGER NOT NULL DEFAULT 0,
    "chat_pick" "PredictionChoice",
    "streamer_correct" BOOLEAN,
    "opened_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prediction_votes" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "choice" "PredictionChoice" NOT NULL,
    "source" "PredictionVoteSource" NOT NULL,
    "chat_username" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prediction_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stream_games_slug_key" ON "stream_games"("slug");

-- CreateIndex
CREATE INDEX "idx_prediction_matches_game_status" ON "prediction_matches"("stream_game_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_rounds_match_id_round_number_key" ON "prediction_rounds"("match_id", "round_number");

-- CreateIndex
CREATE UNIQUE INDEX "prediction_votes_round_id_chat_username_key" ON "prediction_votes"("round_id", "chat_username");

-- CreateIndex
CREATE INDEX "idx_prediction_votes_user" ON "prediction_votes"("user_id");

-- AddForeignKey
ALTER TABLE "stream_games" ADD CONSTRAINT "stream_games_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_matches" ADD CONSTRAINT "prediction_matches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_matches" ADD CONSTRAINT "prediction_matches_stream_game_id_fkey" FOREIGN KEY ("stream_game_id") REFERENCES "stream_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_rounds" ADD CONSTRAINT "prediction_rounds_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "prediction_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_votes" ADD CONSTRAINT "prediction_votes_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "prediction_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prediction_votes" ADD CONSTRAINT "prediction_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
