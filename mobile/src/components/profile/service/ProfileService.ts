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
    updateProfile: async (data: any) => {
        try {
            const res = await api.patch('/profile', data)
            return res.data
        } catch (e) {
            console.error('Error calling updateProfile API: ', e);
        }
    },
    updateShop: async (shopId: number, data: any) => {
        try {
            const res = await api.patch(`/shops/${shopId}`, data)
            return res.data
        } catch (e) {
            console.error('Error calling updateShop API: ', e);
        }
    },
    uploadAvatar: async (fileUri: string) => {
        try {
            const formData = new FormData()
            const fileName = fileUri.split('/').pop() || 'avatar.jpg'
            const extension = fileName.split('.').pop()?.toLowerCase()

            let type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'

            if (Platform.OS === 'web') {
                const response = await fetch(fileUri);
                const blob = await response.blob();
                const file = new File([blob], fileName, { type });
                formData.append('media', file);
            } else {
                formData.append('media', {
                    uri: fileUri,
                    type: type,
                    name: fileName,
                } as any)
            }

            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return res.data
        } catch (e) {
            console.error('Error calling uploadAvatar API: ', e);
        }
    }
}
