jest.mock("../../src/db/prisma", () => {
  const { createPrismaMock } = require("../utils/prismaMock");
  return createPrismaMock();
});

jest.mock("../../src/db/firebase", () => {
  const messaging = { sendEachForMulticast: jest.fn() };
  return { admin: { messaging: () => messaging }, __mock: { messaging } };
});

import { sendPushToArea } from "../../src/services/push.service";

const { __mock } = require("../../src/db/prisma");
const { __mock: firebaseMock } = require("../../src/db/firebase");

describe("push.service", () => {
  beforeEach(() => {
    __mock.reset();
    jest.clearAllMocks();
  });

  it("returns zero when no device tokens exist", async () => {
    __mock.seedCollection("users", {
      "user-1": { name: "A", areaId: "area-1", deviceToken: "", createdAt: "2024-01-01T00:00:00.000Z" },
    });

    const result = await sendPushToArea("area-1", "event-1");
    expect(result).toEqual({ sent: 0, failed: 0 });
    expect(firebaseMock.messaging.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it("sends push to tokens and reports counts", async () => {
    __mock.seedCollection("users", {
      "user-1": { name: "A", areaId: "area-1", deviceToken: "token-1", createdAt: "2024-01-01T00:00:00.000Z" },
      "user-2": { name: "B", areaId: "area-1", deviceToken: "token-2", createdAt: "2024-01-01T00:00:00.000Z" },
    });
    firebaseMock.messaging.sendEachForMulticast.mockResolvedValue({ successCount: 1, failureCount: 1 });

    const result = await sendPushToArea("area-1", "event-1");
    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(firebaseMock.messaging.sendEachForMulticast).toHaveBeenCalledTimes(1);

    const call = firebaseMock.messaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data).toEqual({ type: "ALERT_EVENT", eventId: "event-1", areaId: "area-1" });
  });

  it("handles push failures", async () => {
    __mock.seedCollection("users", {
      "user-1": { name: "A", areaId: "area-1", deviceToken: "token-1", createdAt: "2024-01-01T00:00:00.000Z" },
    });
    firebaseMock.messaging.sendEachForMulticast.mockRejectedValue(new Error("boom"));

    const result = await sendPushToArea("area-1", "event-1");
    expect(result).toEqual({ sent: 0, failed: 1 });
  });
});
