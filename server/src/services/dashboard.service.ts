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
  event: AlertEvent | null;
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

    const since = new Date(Date.now() - ACTIVE_EVENT_WINDOW_MINUTES * 60 * 1000);
    const events = await prisma.alertEvent.findMany({
      where: { areaId: { in: areas }, triggeredAt: { gte: since } },
      orderBy: { triggeredAt: "desc" },
    });

    const latestByArea = new Map<string, AlertEvent>();
    for (const event of events) {
      if (!latestByArea.has(event.areaId)) {
        latestByArea.set(event.areaId, {
          id: event.id,
          areaId: event.areaId,
          triggeredAt: event.triggeredAt.toISOString(),
        });
      }
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

      const event = latestByArea.get(areaId) ?? null;
      if (!event) {
        areaSummaries.push({
          areaId,
          event: null,
          totalUsers: totalUsersInArea,
          responded: 0,
          pending: totalUsersInArea,
          ok: 0,
          help: 0,
          isComplete: false,
          isOverdue: false,
        });
        pending += totalUsersInArea;
        continue;
      }

      activeAreas += 1;
      const responses = await prisma.response.groupBy({
        by: ["status"],
        where: { eventId: event.id },
        _count: { _all: true },
      });
      const okCount = responses.find((r) => r.status === "OK")?._count._all ?? 0;
      const helpCount = responses.find((r) => r.status === "HELP")?._count._all ?? 0;
      const respondedCount = okCount + helpCount;
      const pendingCount = Math.max(totalUsersInArea - respondedCount, 0);
      const isComplete = pendingCount === 0;
      const isOverdue =
        !isComplete &&
        now - new Date(event.triggeredAt).getTime() >
          ACTIVE_EVENT_WINDOW_MINUTES * 60 * 1000;

      ok += okCount;
      help += helpCount;
      responded += respondedCount;
      pending += pendingCount;

      areaSummaries.push({
        areaId,
        event,
        totalUsers: totalUsersInArea,
        responded: respondedCount,
        pending: pendingCount,
        ok: okCount,
        help: helpCount,
        isComplete,
        isOverdue,
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
