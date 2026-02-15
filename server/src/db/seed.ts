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

type CommanderSeedPlan = {
  email: string;
  name: string;
  phone: string;
  primaryArea: string;
  commanderAreas: string[];
};

function splitAreasIntoGroups(areas: string[], groupsCount: number): string[][] {
  const groups = Array.from({ length: groupsCount }, () => [] as string[]);
  for (let index = 0; index < areas.length; index += 1) {
    groups[index % groupsCount].push(areas[index]);
  }
  return groups;
}

function getCommanderPlan(): CommanderSeedPlan[] {
  const safeAreas = AREAS.length > 0 ? AREAS : ["jerusalem", "gush-dan", "haifa-krayot"];
  const groups = splitAreasIntoGroups(safeAreas, 3);

  return [
    {
      email: "commander.north@horn.local",
      name: "מפקד צפון",
      phone: "0501000001",
      primaryArea: groups[0][0] ?? safeAreas[0],
      commanderAreas: groups[0].length > 0 ? groups[0] : [safeAreas[0]],
    },
    {
      email: "commander.center@horn.local",
      name: "מפקד מרכז",
      phone: "0501000002",
      primaryArea: groups[1][0] ?? safeAreas[0],
      commanderAreas: groups[1].length > 0 ? groups[1] : [safeAreas[0]],
    },
    {
      email: "commander.south@horn.local",
      name: "מפקד דרום",
      phone: "0501000003",
      primaryArea: groups[2][0] ?? safeAreas[0],
      commanderAreas: groups[2].length > 0 ? groups[2] : [safeAreas[0]],
    },
  ];
}

export async function ensureDefaultCommanders() {
  const commanderPlan = getCommanderPlan();
  const commanderPasswordHash = await hashPassword("Commander!1");

  let created = 0;
  let updated = 0;

  for (const commander of commanderPlan) {
    const existing = await prisma.user.findUnique({ where: { email: commander.email } });
    await prisma.user.upsert({
      where: { email: commander.email },
      update: {
        name: commander.name,
        phone: commander.phone,
        role: "COMMANDER",
        areaId: commander.primaryArea,
        commanderAreas: commander.commanderAreas,
      },
      create: {
        email: commander.email,
        passwordHash: commanderPasswordHash,
        name: commander.name,
        phone: commander.phone,
        areaId: commander.primaryArea,
        role: "COMMANDER",
        commanderAreas: commander.commanderAreas,
        deviceToken: faker.string.uuid(),
      },
    });
    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }
  }

  return { created, updated, total: commanderPlan.length };
}

export async function seedIfEmpty(): Promise<SeedResult> {
  const primaryArea = AREAS[0] ?? "jerusalem";
  const secondArea = AREAS[1] ?? primaryArea;
  const thirdArea = AREAS[2] ?? secondArea;

  const commanderEmail = "commander.north@horn.local";
  const existingCommander = await prisma.user.findUnique({
    where: { email: commanderEmail },
  });
  
  // Check if demo users exist
  const soldier1Exists = await prisma.user.findUnique({
    where: { email: "soldier1@horn.local" },
  });
  
  // If commander and demo users exist, skip seeding
  if (existingCommander && soldier1Exists) {
    const userCount = await prisma.user.count();
    return { seeded: false, users: userCount, events: 0, responses: 0, refreshTokens: 0 };
  }

  let commanderCreated = false;
  if (!existingCommander) {
    await prisma.user.create({
      data: {
        email: commanderEmail,
        passwordHash: await hashPassword("Commander!1"),
        name: "מפקד קומנדור",
        areaId: primaryArea,
        role: "COMMANDER",
        commanderAreas: AREAS,
        deviceToken: faker.string.uuid(),
        createdAt: faker.date.recent({ days: 10 }),
      },
    });
    commanderCreated = true;
  }

  const passwordHash = await hashPassword("Passw0rd!");
  const users = [];

  // Add known demo users for easy testing (only if they don't exist)
  const demoUsers = [
    { email: "soldier1@horn.local", name: "חייל אחד", areaId: primaryArea },
    { email: "soldier2@horn.local", name: "חייל שניים", areaId: secondArea },
    { email: "soldier3@horn.local", name: "חייל שלוש", areaId: thirdArea },
  ];

  for (const demo of demoUsers) {
    users.push({
      email: demo.email,
      passwordHash,
      name: demo.name,
      areaId: demo.areaId,
      role: "USER" as const,
      commanderAreas: [],
      deviceToken: faker.string.uuid(),
      createdAt: faker.date.recent({ days: 30 }),
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
  const commanders = createdUsers.filter(u => u.role === "COMMANDER");
  for (const areaId of AREAS) {
    const eventCount = faker.number.int({ min: 2, max: 4 });
    for (let i = 0; i < eventCount; i += 1) {
      const usersInArea = createdUsers.filter((user) => user.areaId === areaId);
      const triggeredByUserId = usersInArea.length
        ? faker.helpers.arrayElement(usersInArea).id
        : null;
      
      // Decide if event should be completed
      // Older events are more likely to be completed
      const isOlderEvent = i < eventCount - 1;
      const shouldComplete = isOlderEvent && faker.number.int({ min: 1, max: 10 }) <= 6;
      const completedByCommander = commanders.length > 0 ? commanders[0] : null;
      
      // Some completed events are auto-closed (null completedByUserId)
      const isAutoClose = shouldComplete && faker.datatype.boolean({ probability: 0.4 });
      
      events.push(
        await prisma.alertEvent.create({
          data: {
            areaId,
            triggeredAt: faker.date.recent({ days: 14 }),
            triggeredByUserId,
            completedAt: shouldComplete ? faker.date.recent({ days: 7 }) : null,
            completedByUserId: shouldComplete && !isAutoClose && completedByCommander ? completedByCommander.id : null,
            completionReason: shouldComplete ? (
              isAutoClose 
                ? "כל החיילים דיווחו - נסגר אוטומטית"
                : faker.helpers.arrayElement([
                    "האירוע טופל בהצלחה",
                    "תרגיל - לא התראה אמיתית",
                    "טעות בהפעלה - התראה שגויה",
                    "כל הכוחות דיווחו ומוכנים",
                    "האירוע בוטל",
                  ])
            ) : null,
          },
        })
      );
    }
  }

  let responses = 0;
  for (const event of events) {
    const usersInArea = createdUsers.filter((user) => user.areaId === event.areaId);
    for (const user of usersInArea) {
      // Only create responses for non-completed events, or all users for completed ones
      const shouldRespond = !event.completedAt 
        ? faker.number.int({ min: 1, max: 10 }) <= 7 
        : faker.number.int({ min: 1, max: 10 }) <= 9;
        
      if (shouldRespond) {
        const hasNotes = faker.datatype.boolean({ probability: 0.3 });
        await prisma.response.create({
          data: {
            userId: user.id,
            eventId: event.id,
            status: faker.helpers.arrayElement(["OK", "HELP"]),
            notes: hasNotes ? faker.helpers.arrayElement([
              "הכל בסדר, מוכן לפעולה",
              "צריך עזרה דחופה",
              "בדרך לנקודת המפגש",
              "מוכן ומזומן",
              "יש לי בעיה בציוד",
            ]) : undefined,
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
