jest.mock("../../src/db/firestore", () => {
  const { createFirestoreMock } = require("../utils/firestoreMock");
  return createFirestoreMock();
});

import * as dashboardService from "../../src/services/dashboard.service";

const { __mock } = require("../../src/db/firestore");

describe("dashboard.service", () => {
  beforeEach(() => {
    __mock.reset();
    jest.clearAllMocks();
  });

  it("rejects missing event", async () => {
    await expect(dashboardService.getEventStatus("missing")).rejects.toMatchObject({ status: 404 });
  });

  it("returns status counts per event", async () => {
    __mock.seedCollection("alert_events", {
      "event-1": { areaId: "area-1", triggeredAt: "2024-01-01T00:00:00.000Z" },
    });
    __mock.seedCollection("users", {
      "user-1": { name: "A", areaId: "area-1", deviceToken: "", createdAt: "2024-01-01T00:00:00.000Z" },
      "user-2": { name: "B", areaId: "area-1", deviceToken: "", createdAt: "2024-01-01T00:00:00.000Z" },
      "user-3": { name: "C", areaId: "area-1", deviceToken: "", createdAt: "2024-01-01T00:00:00.000Z" },
    });
    __mock.seedCollection("responses", {
      "resp-1": { userId: "user-1", eventId: "event-1", status: "OK", respondedAt: "2024-01-01T01:00:00.000Z" },
      "resp-2": { userId: "user-2", eventId: "event-1", status: "HELP", respondedAt: "2024-01-01T01:01:00.000Z" },
    });

    const result = await dashboardService.getEventStatus("event-1");
    expect(result.event).toEqual({
      id: "event-1",
      areaId: "area-1",
      triggeredAt: "2024-01-01T00:00:00.000Z",
    });
    expect(result.counts).toEqual({ ok: 1, help: 1, pending: 1 });
    expect(result.list).toHaveLength(3);
  });
});
