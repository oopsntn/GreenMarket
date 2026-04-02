export const ADMIN_WEB_ROLE_CODES = ["ROLE_SUPER_ADMIN", "ROLE_ADMIN"];

export type AdminProfile = {
  id: number;
  email: string;
  name: string;
  roleCodes?: string[];
};

const ADMIN_TOKEN_KEY = "adminToken";
const ADMIN_PROFILE_KEY = "adminProfile";

const parseStoredProfile = (value: string | null): AdminProfile | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AdminProfile> | null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      id: typeof parsed.id === "number" ? parsed.id : 0,
      email: typeof parsed.email === "string" ? parsed.email : "",
      name: typeof parsed.name === "string" ? parsed.name : "",
      roleCodes: Array.isArray(parsed.roleCodes)
        ? parsed.roleCodes.filter((code): code is string => typeof code === "string")
        : [],
    };
  } catch {
    return null;
  }
};

export const getAdminToken = () => {
  return (
    localStorage.getItem(ADMIN_TOKEN_KEY) ||
    sessionStorage.getItem(ADMIN_TOKEN_KEY) ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
};

export const getAdminProfile = (): AdminProfile | null => {
  const storedProfile =
    localStorage.getItem(ADMIN_PROFILE_KEY) ||
    sessionStorage.getItem(ADMIN_PROFILE_KEY);

  const parsedProfile = parseStoredProfile(storedProfile);

  if (parsedProfile) {
    return parsedProfile;
  }

  if (storedProfile) {
    clearAdminSession();
  }

  return null;
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_PROFILE_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_PROFILE_KEY);
};

export const setAdminSession = (
  token: string,
  profile: AdminProfile,
  rememberMe: boolean,
) => {
  clearAdminSession();

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ADMIN_TOKEN_KEY, token);
  storage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(profile));
};

export const hasAllowedAdminRole = (profile: AdminProfile | null) => {
  if (!profile) return false;

  return (profile.roleCodes ?? []).some((code) =>
    ADMIN_WEB_ROLE_CODES.includes(code),
  );
};

export const hasActiveAdminSession = () => {
  return Boolean(getAdminToken()) && hasAllowedAdminRole(getAdminProfile());
};
