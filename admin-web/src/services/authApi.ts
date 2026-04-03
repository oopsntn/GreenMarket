import { apiClient } from "../lib/apiClient";

const AUTH_API_PATH = "/api/auth/admin/login";

export type AdminLoginPayload = {
  email: string;
  password: string;
};

export type AdminLoginResponse = {
  token: string;
  admin: {
    id: number;
    email: string;
    name: string;
    roleCodes: string[];
  };
};

export const authApi = {
  async login(payload: AdminLoginPayload): Promise<AdminLoginResponse> {
    return apiClient.request<AdminLoginResponse>(AUTH_API_PATH, {
      method: "POST",
      includeJsonContentType: true,
      skipAuth: true,
      defaultErrorMessage: "Login failed.",
      body: JSON.stringify(payload),
    });
  },
};
