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
  const primaryArea = AREAS[0] ?? "jerusalem";
  const secondArea = AREAS[1] ?? primaryArea;
  const thirdArea = AREAS[2] ?? secondArea;

  const commanderEmail = "commander@horn.local";
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
