import { Router } from "express";
import { SiteContentController } from "@/controllers/SiteContentController";
import { authMiddleware, moderatorMiddleware } from "@/middleware/auth";

const router = Router();

// Public reads — the homepage/etc. fetch these directly.
router.get("/", SiteContentController.getAll);
router.get("/keys", SiteContentController.listKeys);
router.get("/:key", SiteContentController.get);

// Moderator/admin — day-to-day content editing, same tier as Hunt Tracker.
router.use(authMiddleware, moderatorMiddleware);

router.put("/:key", SiteContentController.upsert);
router.delete("/:key", SiteContentController.remove);

export default router;
