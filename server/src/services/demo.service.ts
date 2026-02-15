import { prisma } from "../db/prisma";
import { triggerAlert } from "./alert.service";
import { submitResponse } from "./responses.service";
import { env } from "../config/env";

type StartScenarioInput = {
  commanderId: string;
  allowedAreas: string[];
  areaId?: string;
};

type StartScenarioResult = {
  runId: string;
  eventId: string;
  areaId: string;
  queuedResponses: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickStatus(): "OK" | "HELP" {
  return Math.random() < 0.2 ? "HELP" : "OK";
}

function pickNote(status: "OK" | "HELP") {
  if (status === "OK") {
    const notes = [
      "Ready and available",
      "On standby",
      "All clear",
      "Position secured",
    ];
    return notes[Math.floor(Math.random() * notes.length)];
  }

  const notes = [
    "Need immediate support",
    "Requesting evacuation support",
    "Communication issue in area",
    "Need assistance with equipment",
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

export async function startDemoScenario(
  input: StartScenarioInput,
): Promise<StartScenarioResult> {
  if (!env.testModeEnabled) {
    const err: any = new Error("Test mode is disabled");
    err.status = 403;
    throw err;
  }

  const areaId = input.areaId && input.allowedAreas.includes(input.areaId)
    ? input.areaId
    : input.allowedAreas[0];

  if (!areaId) {
    const err: any = new Error("No allowed area available for demo");
    err.status = 400;
    throw err;
  }

  const users = await prisma.user.findMany({
    where: {
      role: "USER",
      areaId,
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: 24,
  });

  if (users.length === 0) {
    const err: any = new Error("No users found in selected area");
    err.status = 400;
    throw err;
  }

  const { event } = await triggerAlert(areaId, input.commanderId);
  const runId = `${event.id}-demo`;

  void (async () => {
    for (let index = 0; index < users.length; index += 1) {
      const user = users[index];
      await sleep(Math.max(250, env.testModeResponseDelayMs));

      try {
        const status = pickStatus();
        await submitResponse({
          userId: user.id,
          eventId: event.id,
          status,
          notes: pickNote(status),
        });
      } catch {
        // Best-effort simulation: continue even if one user failed to submit.
      }
    }
  })();

  return {
    runId,
    eventId: event.id,
    areaId,
    queuedResponses: users.length,
  };
}
