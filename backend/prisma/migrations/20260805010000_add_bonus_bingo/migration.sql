-- CreateEnum
CREATE TYPE "BingoStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BingoCellStatus" AS ENUM ('EMPTY', 'ACTIVE', 'GREEN');

-- CreateTable
CREATE TABLE "bonus_bingo" (
    "id" TEXT NOT NULL,
    "stream_game_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keyword" TEXT NOT NULL DEFAULT '!join',
    "grid_size" INTEGER NOT NULL DEFAULT 5,
    "line_points" INTEGER NOT NULL DEFAULT 500,
    "status" "BingoStatus" NOT NULL DEFAULT 'DRAFT',
    "current_cell_id" TEXT,
    "current_chat_username" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "bonus_bingo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bingo_cells" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "status" "BingoCellStatus" NOT NULL DEFAULT 'EMPTY',
    "slot_name" TEXT,
    "claimed_by_chat_username" TEXT,
    "claimed_by_user_id" TEXT,
    "claimed_at" TIMESTAMP(3),

    CONSTRAINT "bingo_cells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bingo_participants" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "chat_username" TEXT NOT NULL,
    "user_id" TEXT,
    "preferred_slot" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bingo_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bingo_line_wins" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "line_type" TEXT NOT NULL,
    "line_index" INTEGER NOT NULL,
    "points_each" INTEGER NOT NULL,
    "winners" JSONB NOT NULL DEFAULT '[]',
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bingo_line_wins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_bonus_bingo_stream_game_status" ON "bonus_bingo"("stream_game_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bingo_cells_game_id_row_col_key" ON "bingo_cells"("game_id", "row", "col");

-- CreateIndex
CREATE UNIQUE INDEX "bingo_participants_game_id_chat_username_key" ON "bingo_participants"("game_id", "chat_username");

-- CreateIndex
CREATE UNIQUE INDEX "bingo_line_wins_game_id_line_type_line_index_key" ON "bingo_line_wins"("game_id", "line_type", "line_index");

-- AddForeignKey
ALTER TABLE "bonus_bingo" ADD CONSTRAINT "bonus_bingo_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_bingo" ADD CONSTRAINT "bonus_bingo_stream_game_id_fkey" FOREIGN KEY ("stream_game_id") REFERENCES "stream_games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_cells" ADD CONSTRAINT "bingo_cells_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "bonus_bingo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_cells" ADD CONSTRAINT "bingo_cells_claimed_by_user_id_fkey" FOREIGN KEY ("claimed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_participants" ADD CONSTRAINT "bingo_participants_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "bonus_bingo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_participants" ADD CONSTRAINT "bingo_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bingo_line_wins" ADD CONSTRAINT "bingo_line_wins_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "bonus_bingo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
