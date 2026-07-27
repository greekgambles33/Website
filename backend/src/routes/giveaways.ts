import { Router } from "express";
import { GiveawayController } from "@/controllers/GiveawayController";
import { authMiddleware, moderatorMiddleware } from "@/middleware/auth";

const router = Router();

// Public — the /giveaways page.
router.get("/", GiveawayController.list);
router.get("/:id", GiveawayController.get);

// Logged-in viewers — entering/leaving a raffle.
router.get("/:id/my-entry", authMiddleware, GiveawayController.getMyEntry);
router.post("/:id/enter", authMiddleware, GiveawayController.enter);
router.delete("/:id/enter", authMiddleware, GiveawayController.leave);

// Moderator/admin — running giveaways.
router.use(authMiddleware, moderatorMiddleware);

router.post("/", GiveawayController.create);
router.put("/:id", GiveawayController.update);
router.delete("/:id", GiveawayController.remove);
router.post("/:id/open", GiveawayController.open);
router.post("/:id/close", GiveawayController.close);
router.get("/:id/entries", GiveawayController.listEntries);
router.post("/:id/draw", GiveawayController.drawWinner);

export default router;
