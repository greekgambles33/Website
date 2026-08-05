import { Router } from "express";
import { BingoController } from "@/controllers/BingoController";
import { authMiddleware, moderatorMiddleware, optionalAuthMiddleware } from "@/middleware/auth";

const router = Router();

// Public — the live public page and OBS overlay poll these. optionalAuthMiddleware
// lets an admin/mod see DRAFT games in the list without a separate endpoint.
router.get("/games/:slug", optionalAuthMiddleware, BingoController.list);
router.get("/games/:slug/active", BingoController.getActive);
router.get("/:id", BingoController.getById);

// Moderator/admin — running a bingo game live.
router.use(authMiddleware, moderatorMiddleware);

router.post("/games/:slug", BingoController.create);
router.post("/:id/keyword", BingoController.setKeyword);
router.post("/:id/open-registration", BingoController.openRegistration);
router.post("/:id/start", BingoController.startGame);
router.post("/:id/spin-cell", BingoController.spinCell);
router.post("/:id/draw-player", BingoController.drawPlayer);
router.post("/:id/cells/:cellId/slot", BingoController.setSlot);
router.post("/:id/result", BingoController.markResult);
router.post("/:id/complete", BingoController.completeGame);
router.post("/:id/unlive", BingoController.unlive);
router.post("/:id/cancel", BingoController.cancel);
router.delete("/:id", BingoController.deleteGame);

router.post("/:id/participants", BingoController.addParticipant);
router.delete("/:id/participants/:chatUsername", BingoController.removeParticipant);

export default router;
