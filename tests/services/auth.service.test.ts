jest.mock("../../src/db/prisma", () => {
  const { createPrismaMock } = require("../utils/prismaMock");
  return createPrismaMock();
});

jest.mock("../../src/helpers/bcrypt", () => ({
  hashPassword: jest.fn(async (value: string) => `hash:${value}`),
  comparePassword: jest.fn(async (value: string, hash: string) => hash === `hash:${value}`),
}));

jest.mock("../../src/helpers/jwt", () => ({
  signAccessToken: jest.fn(() => "access-token"),
  signRefreshToken: jest.fn(() => "refresh-token"),
  verifyRefreshToken: jest.fn(() => ({ userId: "user-1", email: "user@test.com" })),
}));

import * as authService from "../../src/services/auth.service";
import { verifyRefreshToken } from "../../src/helpers/jwt";

const { __mock } = require("../../src/db/prisma");

describe("auth.service", () => {
  beforeEach(() => {
    __mock.reset();
    jest.clearAllMocks();
  });

  it("registers a new user and stores refresh token", async () => {
    const result = await authService.register({
      email: "user@test.com",
      password: "secret",
      name: "Test User",
      areaId: "area-1",
    });

    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    const users = __mock.getCollectionData("users");
    expect(users).toHaveLength(1);
    expect(users[0].data.email).toBe("user@test.com");
    expect(users[0].data.passwordHash).toBe("hash:secret");

    const refreshTokens = __mock.getCollectionData("auth_refresh_tokens");
    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0].id).toBe(users[0].id);
    expect(refreshTokens[0].data.refreshTokenHash).toBe("hash:refresh-token");
  });

  it("rejects duplicate email on register", async () => {
    __mock.seedCollection("users", {
      "user-1": {
        email: "user@test.com",
        passwordHash: "hash:secret",
        name: "Existing",
        areaId: "area-1",
        deviceToken: "",
        createdAt: new Date().toISOString(),
      },
    });

    await expect(
      authService.register({
        email: "user@test.com",
        password: "secret",
        name: "Test User",
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("logs in an existing user", async () => {
    __mock.seedCollection("users", {
      "user-1": {
        email: "user@test.com",
        passwordHash: "hash:secret",
        name: "Existing",
        areaId: "area-1",
        deviceToken: "token-1",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });

    const result = await authService.login({ email: "user@test.com", password: "secret" });
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(result.user.id).toBe("user-1");

    const refreshTokens = __mock.getCollectionData("auth_refresh_tokens");
    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0].id).toBe("user-1");
  });

  it("rejects invalid credentials on login", async () => {
    __mock.seedCollection("users", {
      "user-1": {
        email: "user@test.com",
        passwordHash: "hash:secret",
        name: "Existing",
        areaId: "",
        deviceToken: "",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });

    await expect(authService.login({ email: "user@test.com", password: "wrong" })).rejects.toMatchObject({
      status: 401,
    });
  });

  it("refreshes access token with a valid refresh token", async () => {
    __mock.seedCollection("auth_refresh_tokens", {
      "user-1": { refreshTokenHash: "hash:refresh-token", updatedAt: "2024-01-01T00:00:00.000Z" },
    });

    const result = await authService.refresh({ refreshToken: "refresh-token" });
    expect(result.accessToken).toBe("access-token");
  });

  it("rejects revoked refresh token", async () => {
    await expect(authService.refresh({ refreshToken: "refresh-token" })).rejects.toMatchObject({ status: 401 });
  });

  it("rejects invalid refresh token", async () => {
    (verifyRefreshToken as jest.Mock).mockImplementationOnce(() => {
      throw new Error("bad token");
    });

    await expect(authService.refresh({ refreshToken: "refresh-token" })).rejects.toMatchObject({ status: 401 });
  });

  it("logs out by deleting refresh token", async () => {
    __mock.seedCollection("auth_refresh_tokens", {
      "user-1": { refreshTokenHash: "hash:refresh-token", updatedAt: "2024-01-01T00:00:00.000Z" },
    });

    const result = await authService.logout({ userId: "user-1" });
    expect(result.loggedOut).toBe(true);
    expect(__mock.getCollectionData("auth_refresh_tokens")).toHaveLength(0);
  });

  it("returns current user profile", async () => {
    __mock.seedCollection("users", {
      "user-1": {
        email: "user@test.com",
        passwordHash: "hash:secret",
        name: "Existing",
        areaId: "area-1",
        deviceToken: "token-1",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });

    const result = await authService.getMe({ userId: "user-1" });
    expect(result.user).toEqual({
      id: "user-1",
      name: "Existing",
      areaId: "area-1",
      deviceToken: "token-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
  });

  it("rejects missing user for getMe", async () => {
    await expect(authService.getMe({ userId: "missing" })).rejects.toMatchObject({ status: 404 });
  });
});
