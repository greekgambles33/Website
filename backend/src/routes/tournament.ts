import { Router } from "express";
import { TournamentController } from "@/controllers/TournamentController";
import { authMiddleware, adminMiddleware, optionalAuthMiddleware } from "@/middleware/auth";

const router = Router();

// Public reads.
router.get("/", TournamentController.list);
router.get("/:id", optionalAuthMiddleware, TournamentController.get);

// Logged-in viewer actions.
router.get("/:id/my-entry", authMiddleware, TournamentController.getMyEntry);
router.post("/:id/enter", authMiddleware, TournamentController.enterRaffle);
router.delete("/:id/enter", authMiddleware, TournamentController.leaveRaffle);
router.post("/:id/slot", authMiddleware, TournamentController.setSlot);

// Admin management — mirrors how sensitive/broadcast-facing actions are
// scoped elsewhere in this codebase (stricter than the moderator-level
// access Hunt Tracker uses).
router.use(authMiddleware, adminMiddleware);

router.post("/", TournamentController.create);
router.delete("/:id", TournamentController.remove);
router.post("/:id/cancel", TournamentController.cancel);
router.post("/:id/open-registration", TournamentController.openRegistration);
router.get("/:id/entries", TournamentController.getEntries);
router.post("/:id/draw", TournamentController.drawWinners);
router.post("/:id/start", TournamentController.startTournament);
router.post("/:id/participants/:participantId/reroll", TournamentController.rerollParticipant);

router.post("/matches/:matchId/winner", TournamentController.declareMatchWinner);
router.delete("/matches/:matchId/winner", TournamentController.revertMatchWinner);

export default router;
