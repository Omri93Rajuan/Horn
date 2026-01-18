import request from "supertest";
import express from "express";

function setupApp() {
  const app = express();
  app.get("/secure", async (req, res) => {
    const { requireAuth } = await import("../src/middlewares/requireAuth");
    return requireAuth(req, res, () => res.json({ success: true, user: req.user }));
  });
  return app;
}

describe("requireAuth middleware", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "test_access_secret";
    process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
  });

  it("returns 401 without token", async () => {
    const app = setupApp();
    const res = await request(app).get("/secure");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("accepts valid token and attaches user", async () => {
    jest.resetModules();
    const { signAccessToken } = await import("../src/helpers/jwt");

    const token = signAccessToken({ userId: "user-1", email: "user@test.com" });
    const app = setupApp();
    const res = await request(app).get("/secure").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toEqual({ userId: "user-1", email: "user@test.com" });
  });
});
