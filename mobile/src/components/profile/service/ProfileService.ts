import { Platform } from "react-native";
import { api } from "../../../config/api";

export interface ProfilePayload {
    userDisplayName?: string;
    userAvatarUrl?: string;
    userEmail?: string;
    userLocation?: string;
    userBio?: string;
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

export const ProfileService = {
    getProfile: async () => {
        try {
            const res = await api.get('/profile')
            return res.data
        } catch (e) {
            console.error('Error calling getProfile API: ', e);
        }
    },
    updateProfile: async (data: ProfilePayload) => {
        try {
            const res = await api.patch('/profile', data)
            return res.data
        } catch (e) {
            console.error('Error calling updateProfile API: ', e);
            throw e
        }
    },
    updateShop: async (shopId: number, data: ShopPayload) => {
        try {
            const res = await api.patch(`/shops/${shopId}`, data)
            return res.data
        } catch (e) {
            console.error('Error calling updateShop API: ', e);
            throw e
        }
    },
    uploadAvatar: async (fileUri: string) => {
        try {
            const formData = new FormData()
            const cleanUri = fileUri.split('?')[0]
            const fileName = cleanUri.split('/').pop() || 'avatar.jpg'
            const extension = fileName.split('.').pop()?.toLowerCase()

            let type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'

            if (Platform.OS === 'web') {
                const response = await fetch(fileUri);
                const blob = await response.blob();
                const file = new File([blob], fileName, { type: blob.type || type });
                formData.append('media', file);
            } else {
                formData.append('media', {
                    uri: fileUri,
                    type: type,
                    name: fileName,
                } as any)
            }

            const res = await api.post('/upload', formData)
            return res.data
        } catch (e) {
            console.error('Error calling uploadAvatar API: ', e);
            throw e
        }
    }
}
