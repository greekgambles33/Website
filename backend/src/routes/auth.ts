import { Router } from "express";
import { AuthController } from "@/controllers/AuthController";
import { authMiddleware, optionalAuthMiddleware } from "@/middleware/auth";
import { authLimiter, refreshLimiter } from "@/middleware/rateLimit";

const router = Router();

router.get("/discord/initiate", authLimiter, AuthController.initiateDiscordAuth);
router.get("/discord/callback", authLimiter, AuthController.handleDiscordCallback);

router.post("/refresh", refreshLimiter, AuthController.refreshToken);
router.get("/status", optionalAuthMiddleware, AuthController.getAuthStatus);
router.get("/me", authMiddleware, AuthController.getCurrentUser);
router.post("/logout", authMiddleware, AuthController.logout);
router.get("/validate", authMiddleware, AuthController.validateToken);

router.post("/kick-verify/initiate", authMiddleware, AuthController.initiateKickVerify);
router.get("/kick-verify/status", authMiddleware, AuthController.checkKickVerifyStatus);
router.delete("/kick/unlink", authMiddleware, AuthController.unlinkKick);

router.get("/twitch-verify/initiate", authLimiter, authMiddleware, AuthController.initiateTwitchVerify);
router.get("/twitch/callback", authLimiter, AuthController.handleTwitchCallback);
router.delete("/twitch/unlink", authMiddleware, AuthController.unlinkTwitch);

export default router;
