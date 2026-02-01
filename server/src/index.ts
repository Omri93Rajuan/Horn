import express from "express";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available to routes
export { io };

// CORS
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute (very high for development)
  message: "Too many requests from this IP, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: "Too many login attempts, please try again later.",
});

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
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

app.use((req, res) => {
  return handleError(res, 404, "Not found");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("join-commander-room", () => {
    socket.join("commanders");
    console.log("👑 Client joined commanders room:", socket.id);
  });

  socket.on("join-area-room", async (areaId: string) => {
    socket.join(`area-${areaId}`);
    console.log(`🎖️ Client joined area room: ${areaId}`, socket.id);
    
    // Check for active events in this area and notify the user immediately
    // Active = events where not all users have responded yet
    try {
      const activeEvents = await prisma.alertEvent.findMany({
        where: {
          areaId,
        },
        orderBy: {
          triggeredAt: 'desc',
        },
      });
      
      // Filter to only incomplete events
      const incompleteEvents = [];
      for (const event of activeEvents) {
        const totalUsers = await prisma.user.count({
          where: { areaId },
        });
        
        const responsesCount = await prisma.response.count({
          where: { eventId: event.id },
        });
        
        // Event is active if not all users responded
        if (responsesCount < totalUsers) {
          incompleteEvents.push(event);
        }
      }
      
      if (incompleteEvents.length > 0) {
        console.log(`📤 Sending ${incompleteEvents.length} active event(s) to newly connected soldier`);
        // Send active events to the newly connected soldier
        for (const event of incompleteEvents) {
          socket.emit("new-alert", {
            eventId: event.id,
            areaId: event.areaId,
            triggeredAt: event.triggeredAt.toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching active events:", error);
    }
  });

  socket.on("leave-area-room", (areaId: string) => {
    socket.leave(`area-${areaId}`);
    console.log(`Client left area room: ${areaId}`, socket.id);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

async function start() {
  const seedResult = await seedIfEmpty();
  if (seedResult.seeded) {
    console.log(
      `Seeded database: users=${seedResult.users}, events=${seedResult.events}, responses=${seedResult.responses}, refreshTokens=${seedResult.refreshTokens}`,
    );
  }

  server.listen(PORT, () => {
    console.log(`Horn backend listening on ${PORT}`);
    console.log(`WebSocket server ready`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);
  prisma.$disconnect().finally(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
