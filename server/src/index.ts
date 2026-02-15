import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import alertsRoutes from "./routes/alerts.routes";
import responsesRoutes from "./routes/responses.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import areasRoutes from "./routes/areas.routes";
import { handleError } from "./utils/ErrorHandle";
import { prisma } from "./db/prisma";
import { seedIfEmpty } from "./db/seed";
import { env, loadEnv } from "./config/env";
import { verifyAccessToken } from "./helpers/jwt";
import { requestLogger } from "./middlewares/requestLogger";
import { logger } from "./utils/logger";

loadEnv();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export { io };

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);

const limiter = rateLimit({
  windowMs: env.generalRateLimitWindowMs,
  max: env.generalRateLimitMax,
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  message: "Too many login attempts, please try again later.",
});

app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", limiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/areas", areasRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((_req, res) => handleError(res, 404, "Not found"));

const PORT = env.port;

io.on("connection", (socket) => {
  logger.info("ws.connect", { socketId: socket.id });

  socket.on("join-commander-room", () => {
    socket.join("commanders");
    logger.info("ws.join.commanders", { socketId: socket.id });
  });

  socket.on("join-area-room", async (areaId: string) => {
    socket.join(`area-${areaId}`);
    logger.info("ws.join.area", { socketId: socket.id, areaId });

    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn("ws.join.area.missing_token", { socketId: socket.id, areaId });
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      const userId = decoded.userId;

      const unrespondedEvent = await prisma.alertEvent.findFirst({
        where: {
          areaId,
          completedAt: null,
          responses: {
            none: {
              userId,
            },
          },
        },
        orderBy: {
          triggeredAt: "desc",
        },
      });

      if (unrespondedEvent) {
        logger.info("ws.new_alert.emit", {
          socketId: socket.id,
          areaId,
          eventId: unrespondedEvent.id,
        });
        socket.emit("new-alert", {
          eventId: unrespondedEvent.id,
          areaId: unrespondedEvent.areaId,
          triggeredAt: unrespondedEvent.triggeredAt.toISOString(),
        });
      } else {
        logger.debug("ws.join.area.no_unresponded_event", {
          socketId: socket.id,
          areaId,
        });
      }
    } catch (error) {
      logger.error("ws.join.area.failed", {
        socketId: socket.id,
        areaId,
        error: String(error),
      });
    }
  });

  socket.on("leave-area-room", (areaId: string) => {
    socket.leave(`area-${areaId}`);
    logger.info("ws.leave.area", { socketId: socket.id, areaId });
  });

  socket.on("disconnect", () => {
    logger.info("ws.disconnect", { socketId: socket.id });
  });
});

async function start() {
  if (env.seedOnStartup) {
    const seedResult = await seedIfEmpty();
    if (seedResult.seeded) {
      logger.info("db.seed.completed", {
        users: seedResult.users,
        events: seedResult.events,
        responses: seedResult.responses,
        refreshTokens: seedResult.refreshTokens,
      });
    }
  }

  server.listen(PORT, () => {
    logger.info("server.started", {
      port: PORT,
      env: env.appEnv,
      corsOrigins: env.corsOrigins,
    });
  });
}

start().catch((err) => {
  logger.error("server.start.failed", { error: String(err) });
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info("server.shutdown", { signal });
  prisma.$disconnect().finally(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
