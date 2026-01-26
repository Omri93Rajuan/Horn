import api from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  areaId: string;
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    areaId: string;
  };
  accessToken: string;
}

export const authService = {
  login: async (
    data: LoginRequest,
  ): Promise<{ user: AuthResponse["user"]; token: string }> => {
    const response = await api.post("/auth/login", data);
    return {
      user: response.data.user,
      token: response.data.accessToken,
    };
  },

  register: async (
    data: RegisterRequest,
  ): Promise<{ user: AuthResponse["user"]; token: string }> => {
    const response = await api.post("/auth/register", data);
    return {
      user: response.data.user,
      token: response.data.accessToken,
    };
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
