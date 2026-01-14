type DocData = Record<string, any>;

type CollectionStore = Map<string, DocData>;
type StoreMap = Map<string, CollectionStore>;

type Filter = { field: string; value: any };

class MockDocSnapshot {
  constructor(
    public readonly id: string,
    private readonly store: CollectionStore,
    public readonly ref: MockDocRef
  ) {}

  get exists() {
    return this.store.has(this.id);
  }

  data() {
    return this.store.get(this.id);
  }
}

class MockQuerySnapshot {
  constructor(public readonly docs: MockDocSnapshot[]) {}

  get empty() {
    return this.docs.length === 0;
  }

  forEach(fn: (doc: MockDocSnapshot) => void) {
    this.docs.forEach(fn);
  }
}

class MockDocRef {
  constructor(
    private readonly store: CollectionStore,
    public readonly id: string
  ) {}

  async get() {
    return new MockDocSnapshot(this.id, this.store, this);
  }

  async set(data: DocData) {
    this.store.set(this.id, { ...data });
  }

  async update(data: DocData) {
    const existing = this.store.get(this.id);
    if (!existing) {
      throw new Error("not-found");
    }
    this.store.set(this.id, { ...existing, ...data });
  }

  async delete() {
    this.store.delete(this.id);
  }
}

class MockQuery {
  private readonly filters: Filter[];
  private readonly limitCount?: number;

  constructor(
    private readonly store: CollectionStore,
    filters: Filter[] = [],
    limitCount?: number
  ) {
    this.filters = filters;
    this.limitCount = limitCount;
  }

  where(field: string, _op: "==" | string, value: any) {
    return new MockQuery(this.store, [...this.filters, { field, value }], this.limitCount);
  }

  limit(count: number) {
    return new MockQuery(this.store, this.filters, count);
  }

  async get() {
    let entries = Array.from(this.store.entries());
    for (const filter of this.filters) {
      entries = entries.filter(([, data]) => data[filter.field] === filter.value);
    }
    if (typeof this.limitCount === "number") {
      entries = entries.slice(0, this.limitCount);
    }

    const docs = entries.map(([id]) => {
      const ref = new MockDocRef(this.store, id);
      return new MockDocSnapshot(id, this.store, ref);
    });
    return new MockQuerySnapshot(docs);
  }
}

class MockCollection {
  constructor(
    private readonly store: CollectionStore,
    private readonly idCounter: { value: number }
  ) {}

  doc(id?: string) {
    const docId = id || `id-${++this.idCounter.value}`;
    return new MockDocRef(this.store, docId);
  }

  where(field: string, op: "==" | string, value: any) {
    return new MockQuery(this.store).where(field, op, value);
  }

  limit(count: number) {
    return new MockQuery(this.store).limit(count);
  }

  async get() {
    return new MockQuery(this.store).get();
  }
}

function createStore() {
  const stores: StoreMap = new Map();
  const idCounter = { value: 0 };

  const getCollectionStore = (name: string) => {
    const existing = stores.get(name);
    if (existing) {
      return existing;
    }
    const store: CollectionStore = new Map();
    stores.set(name, store);
    return store;
  };

  const collection = (name: string) => new MockCollection(getCollectionStore(name), idCounter);

  const reset = () => {
    stores.forEach((store) => store.clear());
    idCounter.value = 0;
  };

  const seedCollection = (name: string, docs: Record<string, DocData>) => {
    const store = getCollectionStore(name);
    for (const [id, data] of Object.entries(docs)) {
      store.set(id, { ...data });
    }
  };

  const getCollectionData = (name: string) => {
    const store = getCollectionStore(name);
    return Array.from(store.entries()).map(([id, data]) => ({ id, data: { ...data } }));
  };

  return { collection, reset, seedCollection, getCollectionData };
}

export function createFirestoreMock() {
  const store = createStore();
  const messaging = {
    sendEachForMulticast: jest.fn(),
  };

  const admin = {
    messaging: () => messaging,
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn(), applicationDefault: jest.fn() },
  };

  const db = {
    collection: (name: string) => store.collection(name),
  };

  const __mock = {
    reset: store.reset,
    seedCollection: store.seedCollection,
    getCollectionData: store.getCollectionData,
    messaging,
  };

  return { admin, db, __mock };
}
