import { clearAdminSession, getAdminToken } from "../utils/adminSession";

const DEFAULT_API_BASE_URL = "http://ntncarameoo.ddns.net:5000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

export type ApiRequestOptions = RequestInit & {
  includeJsonContentType?: boolean;
  skipAuth?: boolean;
  defaultErrorMessage?: string;
};

export const getApiBaseUrl = () => {
  return (
    import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") ||
    DEFAULT_API_BASE_URL
  );
};

const buildApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getApiBaseUrl();

  if (baseUrl.endsWith("/api") && normalizedPath === "/api") {
    return baseUrl;
  }

  if (baseUrl.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${baseUrl}${normalizedPath.slice(4)}`;
  }

  return `${baseUrl}${normalizedPath}`;
};

const parseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
) => {
  try {
    const data = (await response.json()) as ApiErrorPayload;
    return data.error || data.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const buildHeaders = ({
  headers,
  includeJsonContentType,
  skipAuth,
}: Pick<ApiRequestOptions, "headers" | "includeJsonContentType" | "skipAuth">) => {
  const requestHeaders = new Headers(headers);

  if (includeJsonContentType && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = getAdminToken();

    if (token && !requestHeaders.has("Authorization")) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  return requestHeaders;
};

export const apiClient = {
  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      includeJsonContentType = false,
      skipAuth = false,
      defaultErrorMessage = "Request failed.",
      headers,
      ...init
    } = options;

    const response = await fetch(buildApiUrl(path), {
      ...init,
      headers: buildHeaders({
        headers,
        includeJsonContentType,
        skipAuth,
      }),
    });

    if (!response.ok) {
      if ((response.status === 401 || response.status === 403) && !skipAuth) {
        clearAdminSession();

        throw new ApiError(
          "Your admin session has expired or is not authorized.",
          response.status,
        );
      }

      throw new ApiError(
        await parseErrorMessage(response, defaultErrorMessage),
        response.status,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  },
};
