import request from "supertest";
import express from "express";
import { validate } from "../src/middlewares/validate";
import { z } from "zod";

const app = express();
app.use(express.json());

app.post(
  "/check",
  validate({ body: z.object({ name: z.string().min(1) }) }),
  (req, res) => {
    res.json({ success: true, name: req.body.name });
  }
);

describe("validate middleware", () => {
  it("accepts valid body and returns parsed data", async () => {
    const res = await request(app).post("/check").send({ name: "Horn" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, name: "Horn" });
  });

  it("rejects invalid body", async () => {
    const res = await request(app).post("/check").send({ name: "" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.status).toBe(400);
  });
});
