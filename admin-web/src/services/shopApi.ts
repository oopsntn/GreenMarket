import { apiClient } from "../lib/apiClient";

const SHOPS_API_PATH = "/api/admin/shops";

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

export const shopApi = {
  async getShops(): Promise<ApiShop[]> {
    return apiClient.request<ApiShop[]>(SHOPS_API_PATH, {
      defaultErrorMessage: "Không thể tải danh sách cửa hàng.",
    });
  },

  async getShopById(shopId: number): Promise<ApiShop> {
    return apiClient.request<ApiShop>(`${SHOPS_API_PATH}/${shopId}`, {
      defaultErrorMessage: "Không thể tải chi tiết cửa hàng.",
    });
  },

  async updateShopStatus(
    shopId: number,
    status: ApiShopStatus,
  ): Promise<UpdateShopStatusResponse> {
    return apiClient.request<UpdateShopStatusResponse>(
      `${SHOPS_API_PATH}/${shopId}/status`,
      {
        method: "PATCH",
        includeJsonContentType: true,
        defaultErrorMessage: "Không thể cập nhật trạng thái cửa hàng.",
        body: JSON.stringify({ status }),
      },
    );
  },
};
