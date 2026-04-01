import { Platform } from "react-native";
import { api } from "../../../config/api";

export const ProfileService = {
    getProfile: async () => {
        try {
            const res = await api.get('/profile')
            return res.data
        } catch (e) {
            console.error("Lỗi khi gọi api getProfile: ", e);
        }
    },
    updateProfile: async (data: any) => {
        try {
            const res = await api.patch('/profile', data)
            return res.data
        } catch (e) {
            console.error("Lỗi khi gọi api updateProfile: ", e);
        }
    },
    updateShop: async (shopId: number, data: any) => {
        try {
            const res = await api.patch(`/shops/${shopId}`, data)
            return res.data
        } catch (e) {
            console.error("Lỗi khi gọi api updateShop: ", e);
        }
    },
    uploadAvatar: async (fileUri: string) => {
        try {
            const formData = new FormData()
            //1. Lay ten fle va duoi file
            const fileName = fileUri.split('/').pop() || 'avatar.jpg'
            const extension = fileName.split('.').pop()?.toLowerCase()

            //2 Xax dinh MimeType chuan de bao ve BE
            let type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'

            if (Platform.OS === 'web') {
                const response = await fetch(fileUri);
                const blob = await response.blob();
                const file = new File([blob], fileName, { type });
                formData.append('media', file); // Web dùng trực tiếp đối tượng File
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
            console.error('Lỗi khi gọi api uploadAvatar: ', e);
        }
    }
}