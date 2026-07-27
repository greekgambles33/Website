-- CreateTable
CREATE TABLE "hunt_slot_suggestions" (
    "id" TEXT NOT NULL,
    "hunt_id" TEXT NOT NULL,
    "slot_name" TEXT NOT NULL,
    "chat_username" TEXT NOT NULL,
    "source" "PredictionVoteSource" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hunt_slot_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_hunt_slot_suggestions_hunt" ON "hunt_slot_suggestions"("hunt_id");

-- AddForeignKey
ALTER TABLE "hunt_slot_suggestions" ADD CONSTRAINT "hunt_slot_suggestions_hunt_id_fkey" FOREIGN KEY ("hunt_id") REFERENCES "hunts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
