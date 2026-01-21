import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AlertEvent {
  id: string;
  areaId: string;
  triggeredAt: string;
  triggeredByUserId?: string;
}

export type ResponseStatus = "OK" | "HELP" | "PENDING";

export interface Response {
  id: string;
  userId: string;
  eventId: string;
  status: ResponseStatus;
  notes?: string;
  respondedAt: string;
}

export interface EventStatusItem {
  user: {
    id: string;
    name: string;
    phone?: string;
  };
  responseStatus: ResponseStatus;
  notes?: string;
  respondedAt?: string;
}

interface DataState {
  events: AlertEvent[];
  currentEvent: AlertEvent | null;
  eventStatus: {
    counts: { ok: number; help: number; pending: number };
    list: EventStatusItem[];
  } | null;
  myResponses: Response[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DataState = {
  events: [],
  currentEvent: null,
  eventStatus: null,
  myResponses: [],
  isLoading: false,
  error: null,
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<AlertEvent[]>) => {
      state.events = action.payload;
    },
    setCurrentEvent: (state, action: PayloadAction<AlertEvent | null>) => {
      state.currentEvent = action.payload;
    },
    addEvent: (state, action: PayloadAction<AlertEvent>) => {
      state.events.unshift(action.payload);
      state.currentEvent = action.payload;
    },
    setEventStatus: (
      state,
      action: PayloadAction<{
        counts: { ok: number; help: number; pending: number };
        list: EventStatusItem[];
      }>,
    ) => {
      state.eventStatus = action.payload;
    },
    setMyResponses: (state, action: PayloadAction<Response[]>) => {
      state.myResponses = action.payload;
    },
    addResponse: (state, action: PayloadAction<Response>) => {
      state.myResponses.unshift(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearEventStatus: (state) => {
      state.eventStatus = null;
    },
  },
});

export const {
  setEvents,
  setCurrentEvent,
  addEvent,
  setEventStatus,
  setMyResponses,
  addResponse,
  setLoading,
  setError,
  clearError,
  clearEventStatus,
} = dataSlice.actions;

export default dataSlice.reducer;
