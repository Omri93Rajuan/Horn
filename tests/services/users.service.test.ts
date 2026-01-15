jest.mock("../../src/db/prisma", () => {
  const { createPrismaMock } = require("../utils/prismaMock");
  return createPrismaMock();
});

import * as usersService from "../../src/services/users.service";

const { __mock } = require("../../src/db/prisma");

describe("users.service", () => {
  beforeEach(() => {
    __mock.reset();
    jest.clearAllMocks();
  });

  it("rejects missing user for registerDevice", async () => {
    await expect(
      usersService.registerDevice({
        userId: "missing",
        areaId: "area-1",
        deviceToken: "device-1",
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("updates device and area for user", async () => {
    __mock.seedCollection("users", {
      "user-1": {
        name: "Existing",
        areaId: "area-0",
        deviceToken: "",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });

    const result = await usersService.registerDevice({
      userId: "user-1",
      areaId: "area-1",
      deviceToken: "device-1",
      name: "Updated",
    });

    expect(result.user).toEqual({
      id: "user-1",
      name: "Updated",
      areaId: "area-1",
      deviceToken: "device-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const users = __mock.getCollectionData("users");
    expect(users[0].data.deviceToken).toBe("device-1");
    expect(users[0].data.areaId).toBe("area-1");
  });
});
