import { Router } from "express";
import { PredictionController } from "@/controllers/PredictionController";
import { authMiddleware, moderatorMiddleware } from "@/middleware/auth";

const router = Router();

// Public — the live public page and OBS overlay poll these.
router.get("/games/:slug/active", PredictionController.getActiveMatch);
router.get("/matches/:matchId", PredictionController.getMatch);
router.get("/leaderboard", PredictionController.getLeaderboard);

// Logged-in viewer's own stats (for a personal widget on the public page).
router.get("/me/stats", authMiddleware, PredictionController.getMyStats);

// Moderator/admin — running the game live.
router.use(authMiddleware, moderatorMiddleware);

router.get("/games/:slug/matches", PredictionController.listMatches);
router.post("/games/:slug/matches", PredictionController.createMatch);
router.post("/matches/:matchId/end", PredictionController.endMatch);
router.put("/matches/:matchId/challenge", PredictionController.setChallenge);
router.post("/matches/:matchId/rounds", PredictionController.openRound);
router.post("/rounds/:roundId/lock", PredictionController.lockRound);
router.post("/rounds/:roundId/void", PredictionController.voidRound);
router.post("/rounds/:roundId/resolve", PredictionController.resolveRound);

export default router;
