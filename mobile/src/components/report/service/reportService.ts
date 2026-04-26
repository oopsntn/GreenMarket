import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api, API_BASE_URL } from '../../../config/api'

interface CreateReportPayload {
    postId: number;
    reportReason: string;
    reportReasonCode?: string;
    reportNote?: string;
    evidenceUrls?: string[];
}

type UploadResponse = {
    urls: string[];
}

const MIME_MAP: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
}

const getFileInfo = (uri: string) => {
    const cleanUri = uri.split('?')[0]
    const fileName = cleanUri.split('/').pop() || `report_${Date.now()}.jpg`
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const mimeType = MIME_MAP[ext] || 'application/octet-stream'
    return { fileName, mimeType }
}

export const ReportService = {
    createReport: async (data: CreateReportPayload) => {
        const payload = {
            ...data,
            evidenceUrls: Array.isArray(data.evidenceUrls) ? data.evidenceUrls : [],
        }

        console.log('[ReportService.createReport]', {
            method: 'POST',
            url: `${API_BASE_URL}/reports`,
            payload,
        })

        const res = await api.post('/reports', payload)
        return res.data
    },

    uploadEvidenceImages: async (imageUris: string[] = []): Promise<UploadResponse> => {
        const formData = new FormData()

        console.log('[ReportService.uploadEvidenceImages]', {
            method: 'POST',
            url: `${API_BASE_URL}/upload/images`,
            imageCount: imageUris.length,
            imageUris,
        })

        for (const uri of imageUris) {
            const { fileName, mimeType } = getFileInfo(uri)

            if (Platform.OS === 'web') {
                const response = await fetch(uri)
                const blob = await response.blob()
                const file = new File([blob], fileName, { type: blob.type || mimeType })
                formData.append('media', file)
            } else {
                formData.append('media', {
                    uri,
                    name: fileName,
                    type: mimeType,
                } as any)
            }
        }

        const token = await AsyncStorage.getItem('token')
        const response = await fetch(`${API_BASE_URL}/upload/images`, {
            method: 'POST',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
        })

        console.log('[ReportService.uploadEvidenceImages] Response status:', response.status)

        if (!response.ok) {
            let errorData = null
            try { errorData = await response.json() } catch (e) {}

            throw {
                response: {
                    status: response.status,
                    data: errorData || { error: 'Lỗi tải ảnh bằng chứng từ máy chủ' }
                },
                message: 'Network error or bad response'
            }
        }

        const data = await response.json()
        if (!data?.urls) {
            throw new Error('Invalid upload response')
        }

        console.log('[ReportService.uploadEvidenceImages] Response data:', data)
        return data
    }
}
