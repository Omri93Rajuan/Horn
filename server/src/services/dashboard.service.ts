import { prisma } from "../db/prisma";
import { AlertEvent, ResponseStatus, User } from "../types/domain";
import { mapPrismaError } from "../utils/prismaErrors";
import { ACTIVE_EVENT_WINDOW_MINUTES } from "../config/events";

type EventStatusItem = {
  user: User;
  responseStatus: ResponseStatus | "PENDING";
  notes?: string;
  respondedAt?: string;
};

type EventStatusResult = {
  event: AlertEvent;
  counts: { ok: number; help: number; pending: number };
  list: EventStatusItem[];
};

type CommanderAreaStats = {
  areaId: string;
  totalEvents: number;
  last30Days: number;
  lastEventAt?: string;
};

export type CommanderOverview = {
  areas: CommanderAreaStats[];
  totalEvents: number;
  totalLast30Days: number;
};

export type CommanderActiveArea = {
  areaId: string;
  events: (AlertEvent & {
    totalUsers: number;
    responded: number;
    pending: number;
    ok: number;
    help: number;
    isComplete: boolean;
    isOverdue: boolean;
  })[];
  totalUsers: number;
  responded: number;
  pending: number;
  ok: number;
  help: number;
  isComplete: boolean;
  isOverdue: boolean;
};

export type CommanderActiveSummary = {
  windowMinutes: number;
  areas: CommanderActiveArea[];
  totals: {
    totalUsers: number;
    responded: number;
    pending: number;
    ok: number;
    help: number;
    activeAreas: number;
  };
};

type UserDoc = {
  name: string;
  phone?: string;
  areaId: string;
  deviceToken: string;
  createdAt: Date;
};

export async function getEventStatus(
  eventId: string,
  requesterId: string,
): Promise<EventStatusResult> {
  try {
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    if (!requester) {
      const err: any = new Error("User not found");
      err.status = 404;
      throw err;
    }
    if (requester.role !== "COMMANDER") {
      const err: any = new Error("Commander role required");
      err.status = 403;
      throw err;
    }

    const eventRow = await prisma.alertEvent.findUnique({
      where: { id: eventId },
    });
    if (!eventRow) {
      const err: any = new Error("Event not found");
      err.status = 404;
      throw err;
    }

    const event: AlertEvent = {
      id: eventRow.id,
      areaId: eventRow.areaId,
      triggeredAt: eventRow.triggeredAt.toISOString(),
    };

    const allowedAreas = requester.commanderAreas.length
      ? requester.commanderAreas
      : [requester.areaId].filter(Boolean);
    if (!allowedAreas.includes(event.areaId)) {
      const err: any = new Error("Not allowed for this area");
      err.status = 403;
      throw err;
    }

    const [users, responses] = await Promise.all([
      prisma.user.findMany({ where: { areaId: event.areaId } }),
      prisma.response.findMany({ where: { eventId } }),
    ]);

    const responseMap = new Map<
      string,
      { status: ResponseStatus; notes?: string; respondedAt: string }
    >();
    responses.forEach((row) => {
      responseMap.set(row.userId, {
        status: row.status as ResponseStatus,
        notes: row.notes || undefined,
        respondedAt: row.respondedAt.toISOString(),
      });
    });

    const list: EventStatusItem[] = [];
    let ok = 0;
    let help = 0;
    let pending = 0;

    users.forEach((row) => {
      const user: User = {
        id: row.id,
        name: row.name,
        phone: row.phone ?? undefined,
        areaId: row.areaId,
        role: row.role as "USER" | "COMMANDER",
        commanderAreas: row.commanderAreas,
        deviceToken: row.deviceToken,
        createdAt: row.createdAt.toISOString(),
      };

      const response = responseMap.get(row.id);
      if (response) {
        if (response.status === "OK") {
          ok += 1;
        } else {
          help += 1;
        }
        list.push({
          user,
          responseStatus: response.status,
          notes: response.notes,
          respondedAt: response.respondedAt,
        });
      } else {
        pending += 1;
        list.push({ user, responseStatus: "PENDING" });
      }
    });

    return {
      event,
      counts: { ok, help, pending },
      list,
    };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}

export async function getCommanderOverview(
  userId: string,
): Promise<CommanderOverview> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err: any = new Error("User not found");
      err.status = 404;
      throw err;
    }

    if (user.role !== "COMMANDER") {
      const err: any = new Error("Commander role required");
      err.status = 403;
      throw err;
    }

    const areas = user.commanderAreas.length
      ? user.commanderAreas
      : [user.areaId].filter(Boolean);

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [overall, last30] = await Promise.all([
      prisma.alertEvent.groupBy({
        by: ["areaId"],
        where: { areaId: { in: areas } },
        _count: { _all: true },
        _max: { triggeredAt: true },
      }),
      prisma.alertEvent.groupBy({
        by: ["areaId"],
        where: { areaId: { in: areas }, triggeredAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    const last30Map = new Map(
      last30.map((row) => [row.areaId, row._count._all]),
    );

    const areasStats: CommanderAreaStats[] = overall.map((row) => ({
      areaId: row.areaId,
      totalEvents: row._count._all,
      last30Days: last30Map.get(row.areaId) ?? 0,
      lastEventAt: row._max.triggeredAt
        ? row._max.triggeredAt.toISOString()
        : undefined,
    }));

    const totalEvents = areasStats.reduce(
      (sum, area) => sum + area.totalEvents,
      0,
    );
    const totalLast30Days = areasStats.reduce(
      (sum, area) => sum + area.last30Days,
      0,
    );

    return { areas: areasStats, totalEvents, totalLast30Days };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}

export async function getCommanderActiveSummary(
  userId: string,
): Promise<CommanderActiveSummary> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const err: any = new Error("User not found");
      err.status = 404;
      throw err;
    }

    if (user.role !== "COMMANDER") {
      const err: any = new Error("Commander role required");
      err.status = 403;
      throw err;
    }

    const areas = user.commanderAreas.length
      ? user.commanderAreas
      : [user.areaId].filter(Boolean);

    // Get recent events (last 90 days or 1000 events max) - filter only active (not completed)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const events = await prisma.alertEvent.findMany({
      where: { 
        areaId: { in: areas },
        triggeredAt: { gte: ninetyDaysAgo }, // Limit to last 90 days for performance
        completedAt: null // Only active events
      },
      orderBy: { triggeredAt: "desc" },
      take: 1000, // Maximum 1000 events to prevent memory issues
    });

    // Group ALL events by area
    const eventsByArea = new Map<string, AlertEvent[]>();
    for (const event of events) {
      if (!eventsByArea.has(event.areaId)) {
        eventsByArea.set(event.areaId, []);
      }
      eventsByArea.get(event.areaId)!.push({
        id: event.id,
        areaId: event.areaId,
        triggeredAt: event.triggeredAt.toISOString(),
      });
    }

    const usersCount = await prisma.user.groupBy({
      by: ["areaId"],
      where: { areaId: { in: areas } },
      _count: { _all: true },
    });
    const usersCountMap = new Map(
      usersCount.map((row) => [row.areaId, row._count._all]),
    );

    const areaSummaries: CommanderActiveArea[] = [];
    let totalUsers = 0;
    let responded = 0;
    let pending = 0;
    let ok = 0;
    let help = 0;
    let activeAreas = 0;

    const now = Date.now();
    for (const areaId of areas) {
      const totalUsersInArea = usersCountMap.get(areaId) ?? 0;
      totalUsers += totalUsersInArea;

      const areaEvents = eventsByArea.get(areaId) ?? [];
      
      // Skip area if no events at all
      if (areaEvents.length === 0) {
        continue;
      }
      
      // Process each event separately with its own stats
      const eventsWithStats = [];
      for (const event of areaEvents) {
        const responses = await prisma.response.groupBy({
          by: ["status"],
          where: { eventId: event.id },
          _count: { _all: true },
        });
        
        const eventOkCount = responses.find((r) => r.status === "OK")?._count._all ?? 0;
        const eventHelpCount = responses.find((r) => r.status === "HELP")?._count._all ?? 0;
        const eventRespondedCount = eventOkCount + eventHelpCount;
        const eventPendingCount = Math.max(totalUsersInArea - eventRespondedCount, 0);
        const eventIsComplete = eventPendingCount === 0;
        const eventIsOverdue = !eventIsComplete; // Event is overdue if not complete (no time limit)

        // Only include incomplete events (active events)
        if (!eventIsComplete) {
          eventsWithStats.push({
            ...event,
            totalUsers: totalUsersInArea,
            responded: eventRespondedCount,
            pending: eventPendingCount,
            ok: eventOkCount,
            help: eventHelpCount,
            isComplete: eventIsComplete,
            isOverdue: eventIsOverdue,
          });
        }
      }
      
      // Skip area if no active events
      if (eventsWithStats.length === 0) {
        continue;
      }
      
      activeAreas += 1;
      
      // Calculate area totals (sum of all events, but cap at totalUsers)
      const areaOkCount = eventsWithStats.reduce((sum, e) => sum + e.ok, 0);
      const areaHelpCount = eventsWithStats.reduce((sum, e) => sum + e.help, 0);
      const areaRespondedCount = Math.min(areaOkCount + areaHelpCount, totalUsersInArea);
      const areaPendingCount = Math.max(totalUsersInArea - areaRespondedCount, 0);
      const areaIsComplete = areaPendingCount === 0;
      const areaIsOverdue = eventsWithStats.some((e) => e.isOverdue);

      ok += areaOkCount;
      help += areaHelpCount;
      responded += areaRespondedCount;
      pending += areaPendingCount;

      areaSummaries.push({
        areaId,
        events: eventsWithStats,
        totalUsers: totalUsersInArea,
        responded: areaRespondedCount,
        pending: areaPendingCount,
        ok: areaOkCount,
        help: areaHelpCount,
        isComplete: areaIsComplete,
        isOverdue: areaIsOverdue,
      });
    }

    return {
      windowMinutes: ACTIVE_EVENT_WINDOW_MINUTES,
      areas: areaSummaries,
      totals: { totalUsers, responded, pending, ok, help, activeAreas },
    };
  } catch (err) {
    throw mapPrismaError(err, "Server error");
  }
}
