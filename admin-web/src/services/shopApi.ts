const API_BASE_URL = "http://localhost:5000/api/admin/shops";

export type ApiShopStatus = "Pending" | "Active" | "Suspended" | "Rejected";

export type ApiShop = {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  totalPosts: number;
  status: ApiShopStatus;
  createdAt: string;
  description: string;
};

type UpdateShopStatusResponse = {
  message: string;
  shop: ApiShop;
  postsAssigned?: number;
};

const parseErrorMessage = async (response: Response) => {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
    };
    return data.error || data.message || "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
};

const getAdminToken = () => {
  return (
    localStorage.getItem("adminToken") ||
    sessionStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    ""
  );
};

const buildHeaders = (includeJsonContentType = false): HeadersInit => {
  const token = getAdminToken();

  return {
    ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const shopApi = {
  async getShops(): Promise<ApiShop[]> {
    const response = await fetch(API_BASE_URL, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as ApiShop[];
  },

  async getShopById(shopId: number): Promise<ApiShop> {
    const response = await fetch(`${API_BASE_URL}/${shopId}`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as ApiShop;
  },

  async updateShopStatus(
    shopId: number,
    status: ApiShopStatus,
  ): Promise<UpdateShopStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/${shopId}/status`, {
      method: "PATCH",
      headers: buildHeaders(true),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return (await response.json()) as UpdateShopStatusResponse;
  },
};
