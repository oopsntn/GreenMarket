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
};
