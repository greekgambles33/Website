import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "@/config/env";
import { apiLimiter } from "@/middleware/rateLimit";
import { notFoundHandler, errorHandler } from "@/middleware/errorHandler";
import { KickChatService } from "@/services/KickChatService";
import authRoutes from "@/routes/auth";
import adminRoutes from "@/routes/admin";
import huntRoutes from "@/routes/hunts";
import tournamentRoutes from "@/routes/tournament";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(compression());
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.get("/health", (_req, res) => res.json({ success: true, status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/hunts", huntRoutes);
app.use("/api/tournaments", tournamentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[ggb-backend] listening on port ${env.PORT} (${env.NODE_ENV})`);
});

KickChatService.start();
