describe("jwt helpers", () => {
  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = "access_secret";
    process.env.JWT_REFRESH_SECRET = "refresh_secret";
    process.env.JWT_ACCESS_TTL = "15m";
    process.env.JWT_REFRESH_TTL = "30d";
  });

  it("signs and verifies access tokens", async () => {
    jest.resetModules();
    const { signAccessToken, verifyAccessToken } = await import("../src/helpers/jwt");
    const token = signAccessToken({ userId: "u1", email: "a@b.com" });
    const payload = verifyAccessToken(token);
    expect(payload).toMatchObject({ userId: "u1", email: "a@b.com" });
  });

  it("signs and verifies refresh tokens", async () => {
    jest.resetModules();
    const { signRefreshToken, verifyRefreshToken } = await import("../src/helpers/jwt");
    const token = signRefreshToken({ userId: "u2", email: "c@d.com" });
    const payload = verifyRefreshToken(token);
    expect(payload).toMatchObject({ userId: "u2", email: "c@d.com" });
  });
});
