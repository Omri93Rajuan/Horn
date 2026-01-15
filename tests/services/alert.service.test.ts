jest.mock("../../src/db/prisma", () => {
  const { createPrismaMock } = require("../utils/prismaMock");
  return createPrismaMock();
});

jest.mock("../../src/services/push.service", () => ({
  sendPushToArea: jest.fn(),
}));

import * as alertService from "../../src/services/alert.service";
import { sendPushToArea } from "../../src/services/push.service";

const { __mock } = require("../../src/db/prisma");

describe("alert.service", () => {
  beforeEach(() => {
    __mock.reset();
    jest.clearAllMocks();
  });

  it("rejects missing areaId", async () => {
    await expect(alertService.triggerAlert("")).rejects.toMatchObject({ status: 400 });
  });

  it("creates an alert event and sends push", async () => {
    (sendPushToArea as jest.Mock).mockResolvedValue({ sent: 2, failed: 1 });

    const result = await alertService.triggerAlert("area-1", "user-1");
    expect(result.event.areaId).toBe("area-1");
    expect(result.push).toEqual({ sent: 2, failed: 1 });

    const events = __mock.getCollectionData("alert_events");
    expect(events).toHaveLength(1);
    expect(events[0].data.areaId).toBe("area-1");
    expect(events[0].data.triggeredByUserId).toBe("user-1");
    expect(events[0].data.triggeredAt).toBeTruthy();
  });
});
