import { Router } from "express";
import { HuntController } from "@/controllers/HuntController";
import { authMiddleware, adminMiddleware, moderatorMiddleware } from "@/middleware/auth";

const router = Router();

// Public — anyone can watch the live hunt or a specific (e.g. completed/shared) hunt.
router.get("/live", HuntController.getLive);
router.get("/slug/:slug", HuntController.getBySlug);
router.get("/:id", HuntController.get);

// Moderator/admin — building and running a hunt.
router.use(authMiddleware, moderatorMiddleware);

router.get("/", HuntController.list);
router.post("/", HuntController.create);
router.delete("/:id", HuntController.remove);

router.post("/:id/bonuses", HuntController.addBonus);
router.put("/:id/bonuses/:bonusId", HuntController.editBonus);
router.delete("/:id/bonuses/:bonusId", HuntController.removeBonus);
router.post("/:id/bonuses/:bonusId/open", HuntController.openBonus);

router.post("/:id/reorder", HuntController.reorder);
router.post("/:id/shuffle", HuntController.shuffle);
router.post("/:id/start", HuntController.start);
router.post("/:id/complete", HuntController.complete);

// Publishing to the public "live" slot is admin-only — a stricter gate than
// day-to-day hunt building, mirroring how sensitive/broadcast actions are
// scoped elsewhere in this codebase.
router.post("/:id/live", adminMiddleware, HuntController.setLive);
router.delete("/:id/live", adminMiddleware, HuntController.unsetLive);

export default router;
