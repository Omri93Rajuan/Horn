import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AlertEvent, EventStatusItem, MyResponse } from "../types";

interface DataState {
  events: AlertEvent[];
  currentEvent: AlertEvent | null;
  eventStatus: {
    counts: { ok: number; help: number; pending: number };
    list: EventStatusItem[];
  } | null;
  myResponses: MyResponse[];
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
    setMyResponses: (state, action: PayloadAction<MyResponse[]>) => {
      state.myResponses = action.payload;
    },
    addResponse: (state, action: PayloadAction<MyResponse>) => {
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