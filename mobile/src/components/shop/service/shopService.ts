import { api, API_BASE_URL } from "../../../config/api"
import AsyncStorage from "@react-native-async-storage/async-storage"

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
    shopEmail?: string;
    shopLocation?: string;
    shopDescription?: string;
    shopLogoUrl?: string;
    shopCoverUrl?: string;
    shopGalleryImages?: string[] | string;
    shopFacebook?: string;
    shopInstagram?: string;
    shopYoutube?: string;
    shopLat?: number;
    shopLng?: number;
    phones?: string[];
    posts?: ShopPost[];
}

export interface ShopCollaborator {
    userId: number;
    displayName: string | null;
    mobile: string;
    avatarUrl: string | null;
    relationshipStatus: 'pending' | 'active' | 'rejected';
    joinedAt: string;
}

export interface PendingOwnerPost {
    postId: number;
    postTitle: string;
    postSlug: string | null;
    postStatus: string;
    postCreatedAt: string;
    authorName: string | null;
    authorMobile: string;
}

export interface ShopPayload {
    shopName?: string;
    shopPhone?: string;
    shopLocation?: string;
    shopEmail?: string;
    shopDescription?: string;
    shopLat?: number;
    shopLng?: number;
    shopLogoUrl?: string;
    shopCoverUrl?: string;
    //Gallery
    shopGalleryImages?: string[];
    //Social Media
    shopFacebook?: string;
    shopInstagram?: string;
    shopYoutube?: string;
}

export interface ShopDashboardSummary {
    totalPosts?: number;
    approvedPosts?: number;
    pendingPosts?: number;
    rejectedPosts?: number;
    totalViews?: number;
    totalContacts?: number;
    totalShopViews?: number;
    totalShopContactClicks?: number;
    contactRate?: number;
    totalPromotionSpend?: number;
    successfulPayments?: number;
    activePromotions?: number;
}

export interface ShopDashboardTopPost {
    postId: number;
    postSlug?: string;
    postTitle?: string;
    postStatus?: string;
    postViewCount?: number;
    postContactCount?: number;
    isPromoted?: boolean;
    postUpdatedAt?: string;
}

export interface ShopDashboardPayment {
    paymentId?: number;
    paymentStatus?: string;
    amount?: number | string;
    createdAt?: string;
    updatedAt?: string;
    packageTitle?: string;
    promotionPackageTitle?: string;
    postTitle?: string;
    orderId?: string;
    transactionId?: string;
}

export interface ShopDashboardResponse {
    shop?: Pick<ShopDetail, 'shopId' | 'shopName' | 'shopStatus'>;
    summary?: ShopDashboardSummary;
    topPosts?: ShopDashboardTopPost[];
    recentPayments?: ShopDashboardPayment[];
}

const normalizeDashboardPayment = (item: any): ShopDashboardPayment => {
    const amountValue = item?.amount ?? item?.paymentTxnAmount ?? item?.transactionAmount ?? 0

    return {
        paymentId: item?.paymentId ?? item?.paymentTxnId ?? item?.transactionId,
        paymentStatus: item?.paymentStatus ?? item?.paymentTxnStatus ?? item?.status,
        amount: Number(amountValue),
        createdAt: item?.createdAt ?? item?.paymentTxnCreatedAt ?? item?.transactionCreatedAt,
        updatedAt: item?.updatedAt ?? item?.paymentTxnUpdatedAt ?? item?.transactionUpdatedAt,
        packageTitle: item?.packageTitle,
        promotionPackageTitle: item?.promotionPackageTitle,
        postTitle: item?.postTitle,
        orderId: item?.orderId ?? item?.paymentTxnProviderTxnId,
        transactionId: item?.transactionId ?? item?.paymentTxnProviderTxnId,
    }
}

const normalizeDashboardResponse = (response: any): ShopDashboardResponse => {
    const recentPaymentsRaw = Array.isArray(response?.recentPayments) ? response.recentPayments : []
    const recentPayments = recentPaymentsRaw.map(normalizeDashboardPayment)

    console.log('[ShopDashboard] Raw recent payments', recentPaymentsRaw)
    console.log('[ShopDashboard] Normalized recent payments', recentPayments)

    return {
        ...response,
        recentPayments,
    }
}

const normalizeShopCoordinates = (shop: ShopDetail | null) => {
    if (!shop) return null

    const phoneList = typeof shop.shopPhone === 'string'
        ? shop.shopPhone.split('|').map((item) => item.trim()).filter(Boolean)
        : []

    // Normalize gallery: backend có thể trả string pipe-separated hoặc array
    let galleryImages: string[] = []
    if (Array.isArray(shop.shopGalleryImages)) {
        galleryImages = shop.shopGalleryImages.filter(Boolean)
    } else if (typeof shop.shopGalleryImages === 'string' && shop.shopGalleryImages) {
        galleryImages = shop.shopGalleryImages.split('|').map(s => s.trim()).filter(Boolean)
    }

    return {
        ...shop,
        shopPhone: phoneList[0] || shop.shopPhone,
        phones: phoneList,
        shopLat: shop.shopLat !== null && shop.shopLat !== undefined ? Number(shop.shopLat) : undefined,
        shopLng: shop.shopLng !== null && shop.shopLng !== undefined ? Number(shop.shopLng) : undefined,
        shopGalleryImages: galleryImages,
    }
}

const logShopRequest = (label: string, method: string, path: string, extra?: Record<string, unknown>) => {
    console.log(`[ShopService.${label}]`, {
        method,
        url: `${API_BASE_URL}${path}`,
        ...extra,
    })
}

const logShopError = (label: string, path: string, error: any, extra?: Record<string, unknown>) => {
    console.error(`[ShopService.${label}] failed`, {
        url: `${API_BASE_URL}${path}`,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        ...extra,
    })
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

    getDashboard: async (): Promise<ShopDashboardResponse> => {
        const response = await api.get('/shops/dashboard')
        return normalizeDashboardResponse(response.data)
    },

    createShop: async (data: ShopPayload) => {
        try {
            const payload = {
                ...data,
                shopLat: data.shopLat ? Number(data.shopLat) : undefined,
                shopLng: data.shopLng ? Number(data.shopLng) : undefined,
            }
            const res = await api.post('/shops/register', payload)
            return res.data
        } catch (e) {
            console.error('Error register shop:', e)
            throw e
        }
    },

    updateShop: async (id: number, data: ShopPayload) => {
        try {
            const payload = {
                ...data,
                shopLat: data.shopLat ? Number(data.shopLat) : undefined,
                shopLng: data.shopLng ? Number(data.shopLng) : undefined,
            }
            const res = await api.patch(`/shops/${id}`, payload)
            return res.data
        } catch (e) {
            console.error('Error updating shop:', e)
            throw e
        }
    },

    requestVerifyOTP: async (target: string, type: 'email' | 'phone') => {
        const response = await api.post('/shops/verify/request', { target, type })
        return response.data
    },

    verifyEmail: async (email: string, otp: string) => {
        const response = await api.post('/shops/verify/email', { email, otp })
        return response.data
    },

    addPhone: async (phone: string, otp: string) => {
        const response = await api.post('/shops/phones', { phone, otp })
        return response.data
    },

    removePhone: async (phone: string) => {
        const response = await api.delete('/shops/phones', { data: { phone } })
        return response.data
    },

    setPrimaryPhone: async (phone: string, emailOtp: string) => {
        const response = await api.patch('/shops/phones/primary', { phone, emailOtp })
        return response.data
    },

    recordShopContactClick: async (shopId: number) => {
        const response = await api.post(`/shops/${shopId}/contact-click`)
        return response.data
    },

    // ─── Cộng tác viên (Owner side) ──────────────────────────────────────
    getCollaborators: async (): Promise<ShopCollaborator[]> => {
        const path = '/shops/collaborators/all'
        try {
            logShopRequest('getCollaborators', 'GET', path)
            const response = await api.get(path)
            return Array.isArray(response.data) ? response.data : []
        } catch (error: any) {
            logShopError('getCollaborators', path, error)
            throw error
        }
    },

    inviteCollaborator: async (userIdentifier: string) => {
        const path = '/shops/collaborators/invite'
        try {
            logShopRequest('inviteCollaborator', 'POST', path, {
                payload: { userIdentifier },
            })
            const response = await api.post(path, { userIdentifier })
            return response.data
        } catch (error: any) {
            logShopError('inviteCollaborator', path, error, { userIdentifier })
            throw error
        }
    },

    removeCollaborator: async (collaboratorUserId: number) => {
        const response = await api.delete(`/shops/collaborators/${collaboratorUserId}`)
        return response.data
    },

    // ─── Duyệt bài CTV (Owner side) ──────────────────────────────────────
    getPendingOwnerPosts: async (): Promise<PendingOwnerPost[]> => {
        const path = '/shops/collaborators/posts/pending'
        try {
            logShopRequest('getPendingOwnerPosts', 'GET', path)
            const response = await api.get(path)
            return Array.isArray(response.data) ? response.data : []
        } catch (error: any) {
            logShopError('getPendingOwnerPosts', path, error)
            throw error
        }
    },

    approveCollaboratorPost: async (postId: number) => {
        const path = `/shops/collaborators/posts/${postId}/approve`
        try {
            logShopRequest('approveCollaboratorPost', 'POST', path, { postId })
            const response = await api.post(path)
            return response.data
        } catch (error: any) {
            logShopError('approveCollaboratorPost', path, error, { postId })
            throw error
        }
    },

    rejectCollaboratorPost: async (postId: number, reason: string) => {
        const path = `/shops/collaborators/posts/${postId}/reject`
        try {
            logShopRequest('rejectCollaboratorPost', 'POST', path, {
                postId,
                payload: { reason },
            })
            const response = await api.post(path, { reason })
            return response.data
        } catch (error: any) {
            logShopError('rejectCollaboratorPost', path, error, { postId, reason })
            throw error
        }
    },

    // ─── Hình Ảnh Shop ──────────────────────────────────────
    uploadShopLogo: async (fileUri: string) => {
        try {
            const formData = new FormData()

            const cleanUri = fileUri.split('?')[0]
            const fileName = cleanUri.split('/').pop() || 'shop_logo.jpg'
            const extension = fileName.split('.').pop()?.toLowerCase()

            let type =
                extension === 'png'
                    ? 'image/png'
                    : extension === 'webp'
                        ? 'image/webp'
                        : 'image/jpeg'

            formData.append('media', {
                uri: fileUri,
                type,
                name: fileName,
            } as any)

            const token = await AsyncStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            })

            const data = await response.json()
            return data
        } catch (e) {
            console.error('Error calling uploadShopLogo API: ', e)
            throw e
        }
    },

    uploadShopGallery: async (fileUris: string[]) => {
        try {
            const formData = new FormData()

            fileUris.forEach((uri, index) => {
                const cleanUri = uri.split('?')[0]
                const fileName = cleanUri.split('/').pop() || `gallery_${index}.jpg`
                const extension = fileName.split('.').pop()?.toLowerCase()

                let type =
                    extension === 'png'
                        ? 'image/png'
                        : extension === 'webp'
                            ? 'image/webp'
                            : 'image/jpeg'

                formData.append('media', {
                    uri,
                    type,
                    name: fileName,
                } as any)
            })

            const token = await AsyncStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            })

            const data = await response.json()
            return data
        } catch (e) {
            console.error('Error calling uploadShopGallery API: ', e)
            throw e
        }
    },
}
