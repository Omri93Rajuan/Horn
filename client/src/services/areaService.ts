import api from "./api";

export const areaService = {
  getAreas: async (): Promise<string[]> => {
    const response = await api.get("/areas");
    return response.data.areas || [];
  },
};
