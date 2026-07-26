import { Router } from "express";
import { StreamGameController } from "@/controllers/StreamGameController";
import { authMiddleware, moderatorMiddleware } from "@/middleware/auth";

const router = Router();

// Public — the /stream-games catalog page.
router.get("/", StreamGameController.listPublic);
router.get("/slug/:slug", StreamGameController.getBySlug);

// Moderator/admin — same tier as Hunt Tracker.
router.use(authMiddleware, moderatorMiddleware);

router.get("/all", StreamGameController.listAll);
router.post("/", StreamGameController.create);
router.put("/:id", StreamGameController.update);
router.delete("/:id", StreamGameController.remove);
router.post("/reorder", StreamGameController.reorder);

export default router;
