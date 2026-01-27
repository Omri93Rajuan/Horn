import api from "./api";
import type { CommanderActiveSummary, CommanderOverview, EventStatusResult } from "../types";

export const dashboardService = {
  getEventStatus: async (eventId: string): Promise<EventStatusResult> => {
    const response = await api.get(`/dashboard/events/${eventId}`);
    return response.data.result || response.data;
  },

  getRecentEvents: async () => {
    const response = await api.get("/alerts");
    return response.data.events || response.data;
  },

  getCommanderOverview: async (): Promise<CommanderOverview> => {
    const response = await api.get("/dashboard/commander/overview");
    return response.data;
  },

  getCommanderActive: async (): Promise<CommanderActiveSummary> => {
    const response = await api.get("/dashboard/commander/active");
    return response.data;
  },
};
