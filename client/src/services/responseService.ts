import api from "./api";
import type { MyResponse, Response } from "../types";

export const responseService = {
  submitResponse: async (data: {
    eventId: string;
    status: "OK" | "HELP";
    notes?: string;
  }): Promise<Response> => {
    const response = await api.post("/responses", data);
    const payload = response.data;
    return {
      id: payload.id,
      userId: payload.userId,
      eventId: payload.eventId,
      status: payload.status,
      notes: payload.notes,
      respondedAt: payload.respondedAt,
    };
  },

  getMyResponses: async (): Promise<MyResponse[]> => {
    const response = await api.get("/responses/my");
    return response.data.responses || [];
  },
};