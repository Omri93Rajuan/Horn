import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import alertsRoutes from "./routes/alerts.routes";
import responsesRoutes from "./routes/responses.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { handleError } from "./utils/ErrorHandle";
import { prisma } from "./db/prisma";

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
app.listen(PORT, () => {
  console.log(`Horn backend listening on ${PORT}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}. Closing server...`);
  prisma.$disconnect().finally(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
