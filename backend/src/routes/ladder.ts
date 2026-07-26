import { Router } from "express";
import { LadderController } from "@/controllers/LadderController";
import { authMiddleware, moderatorMiddleware } from "@/middleware/auth";

const router = Router();

// Public — the live public page and OBS overlay poll these.
router.get("/levels", LadderController.getLevels);
router.get("/games/:slug/active", LadderController.getActiveRun);
router.get("/games/:slug/runs", LadderController.listRuns);

// Moderator/admin — running a climb live.
router.use(authMiddleware, moderatorMiddleware);

router.post("/games/:slug/runs", LadderController.createRun);
router.delete("/runs/:runId", LadderController.deleteRun);
router.post("/runs/:runId/pass", LadderController.passChallenge);
router.post("/runs/:runId/fail", LadderController.failChallenge);
router.post("/runs/:runId/cashout", LadderController.cashOut);
router.post("/runs/:runId/climb", LadderController.climbHigher);

export default router;
