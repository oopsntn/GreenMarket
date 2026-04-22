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

export interface PaymentIntentResponse {
    paymentUrl?: string;
    [key: string]: any;
}

export const paymentService = {
    getPackages: async (): Promise<PromotionPackage[]> => {
        const response = await api.get('/promotions/packages');
        return response.data;
    },

    getEligiblePackages: async (): Promise<{ audience: string; reason?: string; packages: PromotionPackage[] }> => {
        const response = await api.get('/promotions/packages/eligible');
        return response.data;
    },

    buyPackage: async (postId: number, packageId: number): Promise<PaymentIntentResponse> => {
        const response = await api.post('/payment/buy-package', {
            postId,
            packageId,
            platform: 'mobile'
        });
        return response.data;
    },

    getShopVipPackage: async (): Promise<PromotionPackage | null> => {
        // Lấy toàn bộ packages rồi filter theo slotCode SHOP_VIP
        // (Backend không có endpoint riêng /packages/shop-vip)
        try {
            const res = await api.get('/promotions/packages');
            const packages: PromotionPackage[] = Array.isArray(res.data) ? res.data : [];
            return packages.find(p => p.slotCode === 'SHOP_VIP') ?? null;
        } catch {
            return null;
        }
    },

    getPricingConfig: async () => {
        const response = await api.get('/pricing-config');
        return response.data;
    },

    buyShopVipPackage: async () => {
        const response = await api.post('/payment/buy-shop-vip', { platform: 'mobile' });
        return response.data;
    },

    buyPersonalPackage: async () => {
        const response = await api.post('/payment/buy-personal', { platform: 'mobile' });
        return response.data;
    },

    createShopPaymentIntent: async (): Promise<{ paymentUrl: string }> => {
        const response = await api.post<{ paymentUrl: string }>('/payment/register-shop', { platform: 'mobile' });
        return response.data;
    }
};
