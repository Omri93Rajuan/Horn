import axios from "axios";
import type { AxiosInstance } from "axios";
import { store } from "../store";
import { logout } from "../store/authSlice";
import { disconnectSocket } from "../hooks/useSocket";
import { clientEnv } from "../config/env";

const API_BASE_URL = clientEnv.apiBaseUrl;
const AUTH_EXPIRED_FLAG = "horn_auth_expired";

let isHandlingUnauthorized = false;

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const requestUrl = String(error.config?.url ?? "");
        const isAuthRoute =
          requestUrl.includes("/auth/login") ||
          requestUrl.includes("/auth/register") ||
          requestUrl.includes("/auth/demo-login");

        if (status === 401 && !isAuthRoute && !isHandlingUnauthorized) {
          isHandlingUnauthorized = true;

          disconnectSocket();
          store.dispatch(logout());
          sessionStorage.setItem(AUTH_EXPIRED_FLAG, "1");

          if (!window.location.pathname.startsWith("/login")) {
            window.location.assign("/login");
          }

          window.setTimeout(() => {
            isHandlingUnauthorized = false;
          }, 1500);
        }
        return Promise.reject(error);
      },
    );
  }

  getApi() {
    return this.api;
  }
}

export default new ApiService().getApi();
