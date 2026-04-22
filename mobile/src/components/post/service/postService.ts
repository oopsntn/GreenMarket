import { Platform } from 'react-native'
import { api, API_BASE_URL } from '../../../config/api'
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BrowsePostsParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
}

export interface PostPayload {
    categoryId: number;
    postTitle: string;
    postPrice?: string | number;
    postLocation?: string;
    postContactPhone?: string;
    shopId?: number;
    images?: string[];
    videos?: string[];
    attributes?: Array<{
        attributeId: number;
        value: string;
    }>;
}

type UploadOptions = {
    onProgress?: (progress: number) => void
    retries?: number
    timeout?: number
}

type UploadResponse = {
    urls: string[]
}

const MIME_MAP: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
}

const getFileInfo = (uri: string) => {
    const cleanUri = uri.split('?')[0]
    const fileName = cleanUri.split('/').pop() || `upload_${Date.now()}.jpg`
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'

    const mimeType = MIME_MAP[ext] || 'application/octet-stream'
    return { fileName, mimeType }
}

export const postService = {
    getPublicPosts: async (params?: BrowsePostsParams) => {
        const response = await api.get('/posts/browse', { params })
        return response.data
    },

    getPostDetail: async (slug: any) => {
        const response = await api.get(`/posts/detail/${slug}`)
        return response.data
    },

    toggleFavorite: async (postId: number) => {
        const res = await api.post(`/posts/${postId}/favorite`)
        return res.data
    },

    checkIsSaved: async (postId: number) => {
        const res = await api.get(`/posts/${postId}/favorite`)
        return res.data
    },

    getFavoritePosts: async () => {
        const res = await api.get(`/profile/favorites`)
        return res.data
    },

    recordContactClick: async (postId: number) => {
        const response = await api.post(`/posts/${postId}/contact-click`)
        return response.data
    },

    getMyPosts: async () => {
        const response = await api.get('/posts/my-posts')
        return response.data
    },

    createPost: async (postData: PostPayload) => {
        try {
            const response = await api.post('/posts', postData)
            return response.data
        } catch (error: any) {
            console.error('createPost failed:', {
                status: error?.response?.status,
                data: error?.response?.data,
                payload: postData,
            })
            throw error
        }
    },

    updatePost: async (postId: number, data: Partial<PostPayload>) => {
        const response = await api.patch(`/posts/${postId}`, data)
        return response.data
    },

    deletePost: async (postId: number) => {
        const response = await api.delete(`/posts/${postId}`)
        return response.data
    },

    restorePost: async (postId: number) => {
        const response = await api.post(`/posts/${postId}/restore`)
        return response.data
    },

    uploadMedia: async (mediaUris: string[] = []): Promise<UploadResponse> => {
        try {
            const formData = new FormData()

            for (const uri of mediaUris) {
                const { fileName, mimeType } = getFileInfo(uri)

                // Giữ nguyên URI cho React Native fetch
                let normalizedUri = uri
                console.log(`uri: ${uri}, fileName: ${fileName}, mimeType: ${mimeType}`)
                if (Platform.OS === 'web') {
                    const response = await fetch(uri)
                    const blob = await response.blob()
                    const file = new File([blob], fileName, { type: blob.type || mimeType })
                    formData.append('media', file)
                } else {
                    formData.append('media', {
                        uri: normalizedUri,
                        name: fileName,
                        type: mimeType,
                    } as any)
                }
            }
            const token = await AsyncStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    // KHÔNG set Content-Type — fetch tự set multipart boundary
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            })
            console.log('Upload status:', response.status)
            
            if (!response.ok) {
                let errorData = null;
                try { errorData = await response.json(); } catch(e) {}
                throw {
                    response: {
                        status: response.status,
                        data: errorData || { error: 'Lỗi tải ảnh/video từ máy chủ' }
                    },
                    message: 'Network error or bad response'
                };
            }

            const data = await response.json()
            if (!data?.urls) {
                throw new Error('Invalid upload response')
            }
            return data
        } catch (error: any) {
            console.error('uploadMedia failed:', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
            })
            throw error
        }
    },

    getCategories: async () => {
        const response = await api.get('/categories')
        return response.data
    },

    getCategoryAttributes: async (categoryId: number) => {
        const response = await api.get(`/categories/${categoryId}/attributes`)
        return response.data
    },

    getPostingPolicy: async () => {
        const response = await api.get('/posts/posting-policy')
        return response.data
    },

    toggleVisibility: async (postId: number) => {
        const response = await api.patch(`/posts/${postId}/toggle-visibility`)
        return response.data
    },

    activateMockPlan: async (durationDays: number = 30) => {
        const response = await api.post('/posts/personal-plan/mock-activate', { durationDays })
        return response.data
    }
}
