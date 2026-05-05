import { api, API_BASE_URL } from "../../../config/api";
import { getPaymentRedirectUrl } from "../utils/paymentRedirect";

export interface PromotionPackage {
    promotionPackageId: number;
    promotionPackageTitle: string;
    promotionPackageDurationDays: number;
    promotionPackagePrice: number;
    promotionPackageMaxPosts?: number;
    promotionPackageDisplayQuota?: number;
    promotionPackageDescription?: string | null;
    slotCode?: string | null;
    slotTitle?: string | null;
    slotCapacity?: number;
    currentUsage?: number;
    slotRules?: Record<string, any> | null;
}

export interface PaymentIntentResponse {
    paymentUrl?: string;
    [key: string]: any;
}

const toSafeNumber = (value: unknown) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

const normalizePackage = (raw: any): PromotionPackage => {
    const normalized: PromotionPackage = {
        promotionPackageId: Number(raw?.promotionPackageId || 0),
        promotionPackageTitle: String(raw?.promotionPackageTitle || ''),
        promotionPackageDurationDays: toSafeNumber(raw?.promotionPackageDurationDays),
        promotionPackagePrice: toSafeNumber(raw?.promotionPackagePrice),
        promotionPackageMaxPosts: raw?.promotionPackageMaxPosts === undefined ? undefined : toSafeNumber(raw?.promotionPackageMaxPosts),
        promotionPackageDisplayQuota: raw?.promotionPackageDisplayQuota === undefined ? undefined : toSafeNumber(raw?.promotionPackageDisplayQuota),
        promotionPackageDescription: raw?.promotionPackageDescription || null,
        slotCode: raw?.slotCode || null,
        slotTitle: raw?.slotTitle || null,
        slotCapacity: raw?.slotCapacity === undefined ? undefined : toSafeNumber(raw?.slotCapacity),
        currentUsage: raw?.currentUsage === undefined ? undefined : toSafeNumber(raw?.currentUsage),
        slotRules:
            raw?.slotRules && typeof raw.slotRules === 'object'
                ? raw.slotRules
                : null,
    };

    return normalized;
}

const normalizePackageList = (rawList: unknown): PromotionPackage[] => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map(normalizePackage).filter((item) => item.promotionPackageId > 0);
}

export const paymentService = {
    getPackages: async (): Promise<PromotionPackage[]> => {
        const response = await api.get('/promotions/packages');
        return normalizePackageList(response.data);
    },

    getEligiblePackages: async (): Promise<{ audience: string; reason?: string; packages: PromotionPackage[] }> => {
        const response = await api.get('/promotions/packages/eligible');
        return {
            audience: response.data?.audience || 'individual',
            reason: response.data?.reason,
            packages: normalizePackageList(response.data?.packages),
        };
    },

    buyPackage: async (postId: number, packageId: number): Promise<PaymentIntentResponse> => {
        const mobileRedirectUrl = getPaymentRedirectUrl();
        console.log('[PaymentService.buyPackage]', {
            url: `${API_BASE_URL}/payment/buy-package`,
            method: 'POST',
            payload: { postId, packageId, platform: 'mobile', mobileRedirectUrl },
        });

        const response = await api.post('/payment/buy-package', {
            postId,
            packageId,
            platform: 'mobile',
            mobileRedirectUrl,
        });
        return response.data;
    },

    getShopVipPackage: async (): Promise<PromotionPackage | null> => {
        try {
            const response = await api.get('/promotions/packages/shop-vip');
            console.log('[VIP Package] Raw API package:', response.data);
            const normalized = normalizePackage(response.data);
            console.log('[VIP Package] Normalized package:', normalized);
            return normalized.promotionPackageId > 0 ? normalized : null;
        } catch (error: any) {
            console.error('[VIP Package] Failed to load shop VIP package:', {
                url: `${API_BASE_URL}/promotions/packages/shop-vip`,
                status: error?.response?.status || null,
                data: error?.response?.data || null,
                message: error?.message,
            });
            return null;
        }
    },

    getPricingConfig: async () => {
        const response = await api.get('/pricing-config');
        return response.data;
    },

    buyShopVipPackage: async () => {
        const mobileRedirectUrl = getPaymentRedirectUrl();
        console.log('[PaymentService.buyShopVipPackage]', {
            url: `${API_BASE_URL}/payment/buy-shop-vip`,
            method: 'POST',
            payload: { platform: 'mobile', mobileRedirectUrl },
        });

        const response = await api.post('/payment/buy-shop-vip', { platform: 'mobile', mobileRedirectUrl });
        return response.data;
    },

    buyPersonalPackage: async () => {
        const mobileRedirectUrl = getPaymentRedirectUrl();
        console.log('[PaymentService.buyPersonalPackage]', {
            url: `${API_BASE_URL}/payment/buy-personal`,
            method: 'POST',
            payload: { platform: 'mobile', mobileRedirectUrl },
        });

        const response = await api.post('/payment/buy-personal', { platform: 'mobile', mobileRedirectUrl });
        return response.data;
    },

    createShopPaymentIntent: async (): Promise<{ paymentUrl: string }> => {
        const mobileRedirectUrl = getPaymentRedirectUrl();
        console.log('[PaymentService.createShopPaymentIntent]', {
            url: `${API_BASE_URL}/payment/register-shop`,
            method: 'POST',
            payload: { platform: 'mobile', mobileRedirectUrl },
        });

        const response = await api.post<{ paymentUrl: string }>('/payment/register-shop', { platform: 'mobile', mobileRedirectUrl });
        return response.data;
    }
};
