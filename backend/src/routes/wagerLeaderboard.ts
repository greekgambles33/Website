import { Router } from "express";
import { WagerLeaderboardController } from "@/controllers/WagerLeaderboardController";
import { authMiddleware, adminMiddleware } from "@/middleware/auth";

const router = Router();

// Public — anyone can view the live wager leaderboard.
router.get("/live", WagerLeaderboardController.getLive);
// Must be registered before the "/:id" catch-all below, or "archived" would be read as an id.
router.get("/archived", authMiddleware, adminMiddleware, WagerLeaderboardController.listArchived);
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
router.post("/:id/archive", WagerLeaderboardController.archive);

export default router;
