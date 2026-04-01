import { api } from "../../../config/api"

export const ShopService = {
    getMyShop: async () => {
        try {
            const response = await api.get('/shops/my-shop')
            return response.data
        } catch (e) {
            console.error('Error fetching my shop:', e)
        }
    },
    createShop: async (data: any) => {
        try {
            const res = await api.post('/shops/register', data)
            console.log("createShop: ", data)
            return res.data
        } catch (e) {
            console.error('Error register shop:', e)
            throw e
        }
    },
    updateShop: async (id: number, data: any) => {
        try {
            const res = await api.patch(`/shops/${id}`, data);
            return res.data;
        } catch (e) {
            console.error('Error updating shop:', e);
            throw e;
        }
    }
}