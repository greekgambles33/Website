import { Router } from "express";
import { AdminController } from "@/controllers/AdminController";
import { authMiddleware, adminMiddleware } from "@/middleware/auth";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", AdminController.getStats);
router.get("/audit-logs", AdminController.listAuditLogs);

router.get("/users", AdminController.listUsers);
router.get("/users/:userId", AdminController.getUser);
router.put("/users/:userId/verify-kick", AdminController.verifyKickUsername);
router.put("/users/:userId/kick-username", AdminController.editKickUsername);
router.put("/users/:userId/coins", AdminController.adjustCoins);
router.put("/users/:userId/suspend", AdminController.setSuspended);
router.put("/users/:userId/moderator", AdminController.setModerator);

export default router;
