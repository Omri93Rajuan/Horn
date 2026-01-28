import { faker } from "@faker-js/faker";
import { prisma } from "./prisma";
import { hashPassword } from "../helpers/bcrypt";
import { AREAS } from "../config/areas";

type SeedResult = {
  seeded: boolean;
  users: number;
  events: number;
  responses: number;
  refreshTokens: number;
};

const USERS_PER_AREA = 5;

export async function seedIfEmpty(): Promise<SeedResult> {
  const userCount = await prisma.user.count();
  const commanderEmail = "commander@horn.local";
  const existingCommander = await prisma.user.findUnique({
    where: { email: commanderEmail },
  });
  let commanderCreated = false;
  if (!existingCommander) {
    await prisma.user.create({
      data: {
        email: commanderEmail,
        passwordHash: await hashPassword("Commander!1"),
        name: "מפקד קומנדור",
        areaId: "area-1",
        role: "COMMANDER",
        commanderAreas: AREAS,
        deviceToken: faker.string.uuid(),
        createdAt: faker.date.recent({ days: 10 }),
      },
    });
    commanderCreated = true;
  }

  if (userCount > 0) {
    return { seeded: false, users: 0, events: 0, responses: 0, refreshTokens: 0 };
  }

  const passwordHash = await hashPassword("Passw0rd!");
  const users = [];

  if (!commanderCreated) {
    users.push({
      email: commanderEmail,
      passwordHash: await hashPassword("Commander!1"),
      name: "מפקד קומנדור",
      areaId: "area-1",
      role: "COMMANDER" as const,
      commanderAreas: AREAS,
      deviceToken: faker.string.uuid(),
      createdAt: faker.date.recent({ days: 10 }),
    });
  }

  for (const areaId of AREAS) {
    for (let i = 0; i < USERS_PER_AREA; i += 1) {
      users.push({
        email: faker.internet.email().toLowerCase(),
        passwordHash,
        name: faker.person.fullName(),
        areaId,
        role: "USER" as const,
        commanderAreas: [],
        deviceToken: faker.string.uuid(),
        createdAt: faker.date.recent({ days: 30 }),
      });
    }
  }

  const createdUsers = [];
  for (const user of users) {
    createdUsers.push(await prisma.user.create({ data: user }));
  }

  let refreshTokens = 0;
  for (const user of createdUsers) {
    if (faker.number.int({ min: 1, max: 10 }) <= 7) {
      const refreshToken = faker.string.uuid();
      const refreshTokenHash = await hashPassword(refreshToken);
      await prisma.authRefreshToken.create({
        data: { userId: user.id, refreshTokenHash, updatedAt: faker.date.recent({ days: 7 }) },
      });
      refreshTokens += 1;
    }
  }

  const events = [];
  for (const areaId of AREAS) {
    const eventCount = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < eventCount; i += 1) {
      const usersInArea = createdUsers.filter((user) => user.areaId === areaId);
      const triggeredByUserId = usersInArea.length
        ? faker.helpers.arrayElement(usersInArea).id
        : null;
      events.push(
        await prisma.alertEvent.create({
          data: {
            areaId,
            triggeredAt: faker.date.recent({ days: 14 }),
            triggeredByUserId,
          },
        })
      );
    }
  }

  let responses = 0;
  for (const event of events) {
    const usersInArea = createdUsers.filter((user) => user.areaId === event.areaId);
    for (const user of usersInArea) {
      if (faker.number.int({ min: 1, max: 10 }) <= 7) {
        await prisma.response.create({
          data: {
            userId: user.id,
            eventId: event.id,
            status: faker.helpers.arrayElement(["OK", "HELP"]),
            respondedAt: faker.date.recent({ days: 7 }),
          },
        });
        responses += 1;
      }
    }
  }

  return {
    seeded: true,
    users: createdUsers.length,
    events: events.length,
    responses,
    refreshTokens,
  };
}
