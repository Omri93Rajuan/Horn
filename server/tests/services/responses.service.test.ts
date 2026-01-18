jest.mock("../../src/db/prisma", () => {
  const { createPrismaMock } = require("../utils/prismaMock");
  return createPrismaMock();
});

import * as responsesService from "../../src/services/responses.service";

const { __mock } = require("../../src/db/prisma");

describe("responses.service", () => {
  beforeEach(() => {
    __mock.reset();
    jest.clearAllMocks();
  });

  it("rejects missing event", async () => {
    await expect(
      responsesService.submitResponse({ userId: "user-1", eventId: "missing", status: "OK" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("creates a new response", async () => {
    __mock.seedCollection("alert_events", {
      "event-1": { areaId: "area-1", triggeredAt: "2024-01-01T00:00:00.000Z" },
    });

    const result = await responsesService.submitResponse({
      userId: "user-1",
      eventId: "event-1",
      status: "OK",
    });

    expect(result.userId).toBe("user-1");
    expect(result.eventId).toBe("event-1");
    expect(result.status).toBe("OK");

    const responses = __mock.getCollectionData("responses");
    expect(responses).toHaveLength(1);
    expect(responses[0].data.status).toBe("OK");
  });

  it("updates an existing response", async () => {
    __mock.seedCollection("alert_events", {
      "event-1": { areaId: "area-1", triggeredAt: "2024-01-01T00:00:00.000Z" },
    });
    __mock.seedCollection("responses", {
      "resp-1": {
        userId: "user-1",
        eventId: "event-1",
        status: "OK",
        respondedAt: "2024-01-01T01:00:00.000Z",
      },
    });

    const result = await responsesService.submitResponse({
      userId: "user-1",
      eventId: "event-1",
      status: "HELP",
    });

    expect(result.id).toBe("resp-1");
    expect(result.status).toBe("HELP");

    const responses = __mock.getCollectionData("responses");
    expect(responses).toHaveLength(1);
    expect(responses[0].data.status).toBe("HELP");
  });
});
