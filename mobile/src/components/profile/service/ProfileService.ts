import { Platform } from "react-native";
import { api, API_BASE_URL } from "../../../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

            let type =
                extension === 'png'
                    ? 'image/png'
                    : extension === 'webp'
                        ? 'image/webp'
                        : 'image/jpeg'

            // React Native fetch uses file:// for both Android and iOS
            let normalizedUri = fileUri

            formData.append('media', {
                uri: normalizedUri,
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

            console.log('Upload status:', response.status)

            const data = await response.json()
            return data
        } catch (e) {
            console.error('Error calling uploadAvatar API: ', e)
            throw e
        }
    }
}
