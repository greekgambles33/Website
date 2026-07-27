-- AlterTable
ALTER TABLE "hunts" ADD COLUMN     "guesses_open" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "guess_prize_coins" INTEGER NOT NULL DEFAULT 0;
