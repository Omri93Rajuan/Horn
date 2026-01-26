import api from "./api";
import type { Response } from "../types";

export const responseService = {
  submitResponse: async (data: {
    eventId: string;
    status: "OK" | "HELP";
    notes?: string;
  }): Promise<Response> => {
    const response = await api.post("/responses", data);
    return response.data;
  },

  getMyResponses: async (): Promise<Response[]> => {
    const response = await api.get("/responses/my");
    return response.data.responses || [];
  },
};
