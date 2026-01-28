import api from "./api";
import type { AuthUser } from "../types";

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
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

export const authService = {
  login: async (
    data: LoginRequest,
  ): Promise<{ user: AuthUser; token: string }> => {
    const response = await api.post("/auth/login", data);
    return {
      user: { ...response.data.user, email: data.email },
      token: response.data.accessToken,
    };
  },

  register: async (
    data: RegisterRequest,
  ): Promise<{ user: AuthUser; token: string }> => {
    const response = await api.post("/auth/register", data);
    return {
      user: { ...response.data.user, email: data.email },
      token: response.data.accessToken,
    };
  },

  logout: async (): Promise<void> => {
    await api.post("/auth/logout");
  },

  getProfile: async (): Promise<AuthResponse> => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};