import { api } from "../../../config/api";

export const paymentService = {
    /**
     * Get list of published promotion packages
     */
    getPackages: async () => {
        const response = await api.get('/promotions/packages');
        return response.data;
    },

    /**
     * Create a payment URL for a promotion package via VNPay
     * @param postId ID of the post to promote
     * @param packageId ID of the promotion package
     */
    buyPackage: async (postId: number, packageId: number) => {
        const response = await api.post('/payment/buy-package', {
            postId,
            packageId
        });
        return response.data;
    }
};
