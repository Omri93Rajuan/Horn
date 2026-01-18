jest.mock("../../src/services/auth.service", () => ({
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
  getMe: jest.fn(),
}));

jest.mock("../../src/services/alert.service", () => ({
  triggerAlert: jest.fn(),
}));

jest.mock("../../src/services/responses.service", () => ({
  submitResponse: jest.fn(),
}));

jest.mock("../../src/services/users.service", () => ({
  registerDevice: jest.fn(),
}));

jest.mock("../../src/services/dashboard.service", () => ({
  getEventStatus: jest.fn(),
}));

jest.mock("../../src/middlewares/requireAuth", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: "user-1", email: "user@test.com" };
    next();
  },
}));

import express from "express";
import request from "supertest";
import authRoutes from "../../src/routes/auth.routes";
import alertsRoutes from "../../src/routes/alerts.routes";
import responsesRoutes from "../../src/routes/responses.routes";
import usersRoutes from "../../src/routes/users.routes";
import dashboardRoutes from "../../src/routes/dashboard.routes";
import * as authService from "../../src/services/auth.service";
import * as alertsService from "../../src/services/alert.service";
import * as responsesService from "../../src/services/responses.service";
import * as usersService from "../../src/services/users.service";
import * as dashboardService from "../../src/services/dashboard.service";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/dashboard", dashboardRoutes);

describe("routes", () => {
  const user = {
    id: "user-1",
    name: "Test User",
    areaId: "area-1",
    deviceToken: "token-1",
    createdAt: "2024-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (authService.register as jest.Mock).mockResolvedValue({ user, accessToken: "a", refreshToken: "r" });
    (authService.login as jest.Mock).mockResolvedValue({ user, accessToken: "a", refreshToken: "r" });
    (authService.refresh as jest.Mock).mockResolvedValue({ accessToken: "a" });
    (authService.logout as jest.Mock).mockResolvedValue({ loggedOut: true });
    (authService.getMe as jest.Mock).mockResolvedValue({ user });
    (alertsService.triggerAlert as jest.Mock).mockResolvedValue({
      event: { id: "event-1", areaId: "area-1", triggeredAt: "2024-01-01T00:00:00.000Z" },
      push: { sent: 1, failed: 0 },
    });
    (responsesService.submitResponse as jest.Mock).mockResolvedValue({
      id: "resp-1",
      userId: "user-1",
      eventId: "event-1",
      status: "OK",
      respondedAt: "2024-01-01T00:00:00.000Z",
    });
    (usersService.registerDevice as jest.Mock).mockResolvedValue({ user });
    (dashboardService.getEventStatus as jest.Mock).mockResolvedValue({
      event: { id: "event-1", areaId: "area-1", triggeredAt: "2024-01-01T00:00:00.000Z" },
      counts: { ok: 1, help: 0, pending: 0 },
      list: [],
    });
  });

  it("registers a user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "user@test.com", password: "secret1", name: "Test User" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects invalid register payload", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "bad", password: "1" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("logs in a user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "user@test.com", password: "secret1" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("refreshes token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "token" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("logs out with auth", async () => {
    const res = await request(app).post("/api/auth/logout").send({});
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("gets current user with auth", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("triggers alerts", async () => {
    const res = await request(app).post("/api/alerts/trigger").send({ areaId: "area-1" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects invalid alert payload", async () => {
    const res = await request(app).post("/api/alerts/trigger").send({ areaId: "" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("submits a response", async () => {
    const res = await request(app).post("/api/responses").send({ eventId: "event-1", status: "OK" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects invalid response payload", async () => {
    const res = await request(app).post("/api/responses").send({ eventId: "event-1", status: "BAD" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("registers a device", async () => {
    const res = await request(app)
      .post("/api/users/register-device")
      .send({ areaId: "area-1", deviceToken: "token-1", name: "User" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns dashboard status", async () => {
    const res = await request(app).get("/api/dashboard/events/event-1");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
