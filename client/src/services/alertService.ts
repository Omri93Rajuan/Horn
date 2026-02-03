import api from "./api";
import type { AlertEvent, EventStatusResult } from "../types";

export const alertService = {
  triggerEvent: async (areaId: string): Promise<AlertEvent> => {
    const response = await api.post("/alerts/trigger", { areaId });
    return response.data.event;
  },

  getEvents: async (): Promise<AlertEvent[]> => {
    const response = await api.get("/alerts/all");
    return response.data.events || [];
  },

  getEventStatus: async (eventId: string): Promise<EventStatusResult> => {
    const response = await api.get(`/dashboard/events/${eventId}`);
    return response.data.result || response.data;
  },

  closeEvent: async (eventId: string, reason?: string): Promise<{ success: boolean }> => {
    const response = await api.post("/alerts/close", { eventId, reason });
    return response.data;
  },
};