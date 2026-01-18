import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import alertsRoutes from "./routes/alerts.routes";
import responsesRoutes from "./routes/responses.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { handleError } from "./utils/ErrorHandle";
import { prisma } from "./db/prisma";
import { seedIfEmpty } from "./db/seed";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  return handleError(res, 404, "Not found");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function start() {
  const seedResult = await seedIfEmpty();
  if (seedResult.seeded) {
    console.log(
      `Seeded database: users=${seedResult.users}, events=${seedResult.events}, responses=${seedResult.responses}, refreshTokens=${seedResult.refreshTokens}`
    );
  }

  app.listen(PORT, () => {
    console.log(`Horn backend listening on ${PORT}`);
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
