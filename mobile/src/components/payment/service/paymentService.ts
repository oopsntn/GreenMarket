import { api } from "../../../config/api";

export interface PromotionPackage {
    promotionPackageId: number;
    promotionPackageTitle: string;
    promotionPackageDurationDays: number;
    promotionPackagePrice: number;
    slotCode?: string;
    slotTitle?: string;
    slotRules?: {
        priority?: number;
    } | null;
}

export const paymentService = {
    getPackages: async (): Promise<PromotionPackage[]> => {
        const response = await api.get('/promotions/packages');
        return response.data;
    },

    buyPackage: async (postId: number, packageId: number) => {
        const response = await api.post('/payment/buy-package', {
            postId,
            packageId
        });
        return response.data;
    },

    getShopVipPackage: async (): Promise<PromotionPackage> => {
        const response = await api.get('/promotions/packages/shop-vip');
        return response.data;
    },

    getPricingConfig: async () => {
        const response = await api.get('/pricing-config');
        return response.data;
    },

    buyShopVipPackage: async () => {
        const response = await api.post('/payment/buy-shop-vip');
        return response.data;
    },

    buyPersonalPackage: async () => {
        const response = await api.post('/payment/buy-personal');
        return response.data;
    },

    createShopPaymentIntent: async () => {
        const response = await api.post('/payment/register-shop');
        return response.data;
    }
};
