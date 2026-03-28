import { api } from "../../../config/api"

export const ShopService = {
    getMyShop: async (userId: number) => {
        try {
            const response = await api.get('/shops/my-shop', { params: { userId } })
            return response.data
        } catch (e) {
            console.error('Error fetching my shop:', e)
        }
    },
}