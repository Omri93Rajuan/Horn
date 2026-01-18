import { pollAndTriggerIfNeeded } from "../../src/services/alert-source.service";

describe("alert-source.service", () => {
  it("resolves without triggering by default", async () => {
    await expect(pollAndTriggerIfNeeded()).resolves.toBeUndefined();
  });
});
