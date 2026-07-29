import { Router } from "express";
import { HuntController } from "@/controllers/HuntController";
import { authMiddleware, adminMiddleware, moderatorMiddleware } from "@/middleware/auth";

const router = Router();

// Public — anyone can watch the live hunt or a specific (e.g. completed/shared) hunt.
router.get("/live", HuntController.getLive);
router.get("/slug/:slug", HuntController.getBySlug);
router.get("/:id", HuntController.get);
router.get("/:id/guess-summary", HuntController.getGuessSummary);

// Logged-in viewers — "Guess the Balance".
router.get("/:id/my-guess", authMiddleware, HuntController.getMyGuess);
router.post("/:id/guess", authMiddleware, HuntController.submitGuess);

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
router.post("/:id/guessing/open", HuntController.openGuessing);
router.post("/:id/guessing/close", HuntController.closeGuessing);

router.get("/:id/suggestions", HuntController.listSlotSuggestions);
router.delete("/:id/suggestions/:suggestionId", HuntController.dismissSlotSuggestion);
router.put("/:id/suggestions/:suggestionId/provider", HuntController.retagSlotSuggestion);

// Publishing to the public "live" slot is admin-only — a stricter gate than
// day-to-day hunt building, mirroring how sensitive/broadcast actions are
// scoped elsewhere in this codebase.
router.post("/:id/live", adminMiddleware, HuntController.setLive);
router.delete("/:id/live", adminMiddleware, HuntController.unsetLive);

export default router;
