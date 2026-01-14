jest.mock("../../src/db/firestore", () => {
  const { createFirestoreMock } = require("../utils/firestoreMock");
  return createFirestoreMock();
});

import { sendPushToArea } from "../../src/services/push.service";

const { __mock } = require("../../src/db/firestore");

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
    expect(__mock.messaging.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it("sends push to tokens and reports counts", async () => {
    __mock.seedCollection("users", {
      "user-1": { name: "A", areaId: "area-1", deviceToken: "token-1", createdAt: "2024-01-01T00:00:00.000Z" },
      "user-2": { name: "B", areaId: "area-1", deviceToken: "token-2", createdAt: "2024-01-01T00:00:00.000Z" },
    });
    __mock.messaging.sendEachForMulticast.mockResolvedValue({ successCount: 1, failureCount: 1 });

    const result = await sendPushToArea("area-1", "event-1");
    expect(result).toEqual({ sent: 1, failed: 1 });
    expect(__mock.messaging.sendEachForMulticast).toHaveBeenCalledTimes(1);

    const call = __mock.messaging.sendEachForMulticast.mock.calls[0][0];
    expect(call.data).toEqual({ type: "ALERT_EVENT", eventId: "event-1", areaId: "area-1" });
  });

  it("handles push failures", async () => {
    __mock.seedCollection("users", {
      "user-1": { name: "A", areaId: "area-1", deviceToken: "token-1", createdAt: "2024-01-01T00:00:00.000Z" },
    });
    __mock.messaging.sendEachForMulticast.mockRejectedValue(new Error("boom"));

    const result = await sendPushToArea("area-1", "event-1");
    expect(result).toEqual({ sent: 0, failed: 1 });
  });
});
