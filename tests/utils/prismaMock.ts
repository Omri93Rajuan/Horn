type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  areaId: string;
  deviceToken: string;
  createdAt: Date;
};

type RefreshRow = {
  userId: string;
  refreshTokenHash: string;
  updatedAt: Date;
};

type AlertEventRow = {
  id: string;
  areaId: string;
  triggeredAt: Date;
  triggeredByUserId: string | null;
};

type ResponseRow = {
  id: string;
  userId: string;
  eventId: string;
  status: "OK" | "HELP";
  respondedAt: Date;
};

type Store = {
  users: Map<string, UserRow>;
  refresh: Map<string, RefreshRow>;
  events: Map<string, AlertEventRow>;
  responses: Map<string, ResponseRow>;
};

type SeedData = Record<string, Record<string, any>>;

const idCounters = {
  user: 0,
  event: 0,
  response: 0,
};

function nextId(prefix: keyof typeof idCounters) {
  idCounters[prefix] += 1;
  return `${prefix}-${idCounters[prefix]}`;
}

function toDate(value: any): Date {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return new Date();
}

function seedCollection(store: Store, name: string, data: Record<string, any>) {
  if (name === "users") {
    Object.entries(data).forEach(([id, row]) => {
      store.users.set(id, {
        id,
        email: row.email ?? "",
        passwordHash: row.passwordHash ?? "",
        name: row.name ?? "",
        areaId: row.areaId ?? "",
        deviceToken: row.deviceToken ?? "",
        createdAt: toDate(row.createdAt),
      });
    });
    return;
  }
  if (name === "auth_refresh_tokens") {
    Object.entries(data).forEach(([userId, row]) => {
      store.refresh.set(userId, {
        userId,
        refreshTokenHash: row.refreshTokenHash ?? "",
        updatedAt: toDate(row.updatedAt),
      });
    });
    return;
  }
  if (name === "alert_events") {
    Object.entries(data).forEach(([id, row]) => {
      store.events.set(id, {
        id,
        areaId: row.areaId ?? "",
        triggeredAt: toDate(row.triggeredAt),
        triggeredByUserId: row.triggeredByUserId ?? null,
      });
    });
    return;
  }
  if (name === "responses") {
    Object.entries(data).forEach(([id, row]) => {
      store.responses.set(id, {
        id,
        userId: row.userId ?? "",
        eventId: row.eventId ?? "",
        status: row.status ?? "OK",
        respondedAt: toDate(row.respondedAt),
      });
    });
  }
}

function getCollectionData(store: Store, name: string) {
  if (name === "users") {
    return Array.from(store.users.values()).map((row) => ({ id: row.id, data: row }));
  }
  if (name === "auth_refresh_tokens") {
    return Array.from(store.refresh.values()).map((row) => ({ id: row.userId, data: row }));
  }
  if (name === "alert_events") {
    return Array.from(store.events.values()).map((row) => ({ id: row.id, data: row }));
  }
  if (name === "responses") {
    return Array.from(store.responses.values()).map((row) => ({ id: row.id, data: row }));
  }
  return [];
}

function createStore(): Store {
  return {
    users: new Map(),
    refresh: new Map(),
    events: new Map(),
    responses: new Map(),
  };
}

export function createPrismaMock() {
  const store = createStore();

  const prisma = {
    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where?.id) {
          return store.users.get(where.id) ?? null;
        }
        if (where?.email) {
          return Array.from(store.users.values()).find((row) => row.email === where.email) ?? null;
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        const all = Array.from(store.users.values());
        if (!where) {
          return all;
        }
        if (where.areaId) {
          return all.filter((row) => row.areaId === where.areaId);
        }
        return all;
      }),
      create: jest.fn(async ({ data }: any) => {
        const id = data.id ?? nextId("user");
        const row: UserRow = {
          id,
          email: data.email ?? "",
          passwordHash: data.passwordHash ?? "",
          name: data.name ?? "",
          areaId: data.areaId ?? "",
          deviceToken: data.deviceToken ?? "",
          createdAt: toDate(data.createdAt),
        };
        store.users.set(id, row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.users.get(where.id);
        if (!existing) {
          throw new Error("User not found");
        }
        const updated = { ...existing, ...data };
        store.users.set(where.id, updated);
        return updated;
      }),
    },
    authRefreshToken: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (!where?.userId) {
          return null;
        }
        return store.refresh.get(where.userId) ?? null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const row: RefreshRow = {
          userId: data.userId,
          refreshTokenHash: data.refreshTokenHash ?? "",
          updatedAt: toDate(data.updatedAt ?? new Date()),
        };
        store.refresh.set(data.userId, row);
        return row;
      }),
      upsert: jest.fn(async ({ where, update, create }: any) => {
        const existing = store.refresh.get(where.userId);
        if (existing) {
          const updated: RefreshRow = {
            ...existing,
            refreshTokenHash: update.refreshTokenHash ?? existing.refreshTokenHash,
            updatedAt: toDate(update.updatedAt ?? new Date()),
          };
          store.refresh.set(where.userId, updated);
          return updated;
        }
        const created: RefreshRow = {
          userId: create.userId,
          refreshTokenHash: create.refreshTokenHash ?? "",
          updatedAt: toDate(create.updatedAt ?? new Date()),
        };
        store.refresh.set(create.userId, created);
        return created;
      }),
      delete: jest.fn(async ({ where }: any) => {
        const existing = store.refresh.get(where.userId);
        if (!existing) {
          throw new Error("Refresh token not found");
        }
        store.refresh.delete(where.userId);
        return existing;
      }),
    },
    alertEvent: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (!where?.id) {
          return null;
        }
        return store.events.get(where.id) ?? null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const id = data.id ?? nextId("event");
        const row: AlertEventRow = {
          id,
          areaId: data.areaId ?? "",
          triggeredAt: toDate(data.triggeredAt),
          triggeredByUserId: data.triggeredByUserId ?? null,
        };
        store.events.set(id, row);
        return row;
      }),
    },
    response: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where?.id) {
          return store.responses.get(where.id) ?? null;
        }
        if (where?.userId_eventId) {
          const { userId, eventId } = where.userId_eventId;
          return (
            Array.from(store.responses.values()).find((row) => row.userId === userId && row.eventId === eventId) ??
            null
          );
        }
        return null;
      }),
      findMany: jest.fn(async ({ where }: any) => {
        const all = Array.from(store.responses.values());
        if (!where) {
          return all;
        }
        if (where.eventId) {
          return all.filter((row) => row.eventId === where.eventId);
        }
        return all;
      }),
      create: jest.fn(async ({ data }: any) => {
        const id = data.id ?? nextId("response");
        const row: ResponseRow = {
          id,
          userId: data.userId,
          eventId: data.eventId,
          status: data.status,
          respondedAt: toDate(data.respondedAt),
        };
        store.responses.set(id, row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const existing = store.responses.get(where.id);
        if (!existing) {
          throw new Error("Response not found");
        }
        const updated = { ...existing, ...data };
        store.responses.set(where.id, updated);
        return updated;
      }),
    },
  };

  const __mock = {
    reset: () => {
      store.users.clear();
      store.refresh.clear();
      store.events.clear();
      store.responses.clear();
    },
    seedCollection: (name: string, data: Record<string, any>) => seedCollection(store, name, data),
    getCollectionData: (name: string) => getCollectionData(store, name),
  };

  return { prisma, __mock };
}
