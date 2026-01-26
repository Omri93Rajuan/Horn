import api from "./api";
import type { EventStatusResult } from "../types";

export const dashboardService = {
  getEventStatus: async (eventId: string): Promise<EventStatusResult> => {
    const response = await api.get(`/dashboard/event/${eventId}`);
    return response.data.result || response.data;
  },

  getRecentEvents: async () => {
    const response = await api.get("/alerts");
    return response.data.events || response.data;
  },
};
