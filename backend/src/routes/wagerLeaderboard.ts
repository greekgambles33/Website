import { Router } from "express";
import { WagerLeaderboardController } from "@/controllers/WagerLeaderboardController";
import { authMiddleware, adminMiddleware } from "@/middleware/auth";

const router = Router();

// Public — anyone can view the live wager leaderboard.
router.get("/live", WagerLeaderboardController.getLive);
router.get("/:id", WagerLeaderboardController.get);

// Admin — this is manually curated from casino back-office data.
router.use(authMiddleware, adminMiddleware);

router.get("/", WagerLeaderboardController.list);
router.post("/", WagerLeaderboardController.create);
router.put("/:id", WagerLeaderboardController.update);
router.delete("/:id", WagerLeaderboardController.remove);

router.post("/:id/entries", WagerLeaderboardController.addEntry);
router.put("/:id/entries/:entryId", WagerLeaderboardController.editEntry);
router.delete("/:id/entries/:entryId", WagerLeaderboardController.removeEntry);

router.post("/:id/live", WagerLeaderboardController.setLive);
router.delete("/:id/live", WagerLeaderboardController.unsetLive);

export default router;
