import { api } from "../../../config/api"

interface ShopPost {
    postId: number;
    postTitle: string;
    postPrice: string | number;
    postStatus?: string;
    postShopId?: number | null;
}

export interface ShopDetail {
    shopId: number;
    shopName: string;
    shopStatus: string;
    shopPhone?: string;
    shopLocation?: string;
    shopDescription?: string;
    shopLogoUrl?: string;
    shopCoverUrl?: string;
    shopLat?: number | string | null;
    shopLng?: number | string | null;
    posts?: ShopPost[];
}

export interface ShopPayload {
    shopName?: string;
    shopPhone?: string;
    shopLocation?: string;
    shopDescription?: string;
    shopLat?: string | number | null;
    shopLng?: string | number | null;
    shopLogoUrl?: string;
    shopCoverUrl?: string;
}

const normalizeShopCoordinates = (shop: ShopDetail | null) => {
    if (!shop) return null

    return {
        ...shop,
        shopLat: shop.shopLat !== null && shop.shopLat !== undefined ? Number(shop.shopLat) : undefined,
        shopLng: shop.shopLng !== null && shop.shopLng !== undefined ? Number(shop.shopLng) : undefined,
    }
}

export const ShopService = {
    getAllShops: async (params?: { page?: number; limit?: number }) => {
        const response = await api.get('/shops/browse', { params })
        return response.data
    },

    getShopById: async (shopId: number) => {
        const response = await api.get(`/shops/${shopId}`)
        return normalizeShopCoordinates(response.data)
    },

    getMyShop: async () => {
        try {
            const response = await api.get('/shops/my-shop')
            const shop = normalizeShopCoordinates(response.data)

            if (!shop?.shopId) {
                return shop
            }

            try {
                const detailResponse = await api.get(`/shops/${shop.shopId}`)
                const detailShop = normalizeShopCoordinates(detailResponse.data)

                return {
                    ...shop,
                    ...detailShop,
                    posts: Array.isArray(detailShop?.posts) ? detailShop.posts : [],
                }
            } catch (detailError) {
                console.error('Error fetching shop detail, fallback to my-shop data:', detailError)
                return {
                    ...shop,
                    posts: Array.isArray(shop.posts) ? shop.posts : [],
                }
            }
        } catch (e: any) {
            if (e?.response?.status === 404) {
                return null
            }

            console.error('Error fetching my shop:', e)
            throw e
        }
    },

    createShop: async (data: ShopPayload) => {
        try {
            const res = await api.post('/shops/register', data)
            return res.data
        } catch (e) {
            console.error('Error register shop:', e)
            throw e
        }
    },

    updateShop: async (id: number, data: ShopPayload) => {
        try {
            const res = await api.patch(`/shops/${id}`, data)
            return res.data
        } catch (e) {
            console.error('Error updating shop:', e)
            throw e
        }
    }
}
