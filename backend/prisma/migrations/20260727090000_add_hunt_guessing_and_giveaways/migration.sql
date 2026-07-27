-- AlterTable
ALTER TABLE "hunts" ADD COLUMN     "final_balance" DECIMAL(12,2),
ADD COLUMN     "guess_winner_id" TEXT;

-- CreateTable
CREATE TABLE "hunt_guesses" (
    "id" TEXT NOT NULL,
    "hunt_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "guess" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hunt_guesses_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "GiveawayStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "giveaways" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entry_cost" INTEGER NOT NULL DEFAULT 0,
    "status" "GiveawayStatus" NOT NULL DEFAULT 'DRAFT',
    "ends_at" TIMESTAMP(3),
    "winner_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "drawn_at" TIMESTAMP(3),

    CONSTRAINT "giveaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giveaway_entries" (
    "id" TEXT NOT NULL,
    "giveaway_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giveaway_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hunt_guesses_hunt_id_user_id_key" ON "hunt_guesses"("hunt_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "giveaway_entries_giveaway_id_user_id_key" ON "giveaway_entries"("giveaway_id", "user_id");

-- AddForeignKey
ALTER TABLE "hunts" ADD CONSTRAINT "hunts_guess_winner_id_fkey" FOREIGN KEY ("guess_winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hunt_guesses" ADD CONSTRAINT "hunt_guesses_hunt_id_fkey" FOREIGN KEY ("hunt_id") REFERENCES "hunts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hunt_guesses" ADD CONSTRAINT "hunt_guesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giveaways" ADD CONSTRAINT "giveaways_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giveaways" ADD CONSTRAINT "giveaways_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giveaway_entries" ADD CONSTRAINT "giveaway_entries_giveaway_id_fkey" FOREIGN KEY ("giveaway_id") REFERENCES "giveaways"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giveaway_entries" ADD CONSTRAINT "giveaway_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
