const AUTH_API_URL = "http://localhost:5000/api/auth/admin/login";

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

const parseErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };

    return data.error || data.message || "Login failed.";
  } catch {
    return "Login failed.";
  }
};

export const authApi = {
  async login(payload: AdminLoginPayload): Promise<AdminLoginResponse> {
    const response = await fetch(AUTH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as AdminLoginResponse;
  },
};
