import { Platform } from 'react-native'
import { api } from '../../../config/api'

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
    postContent?: string;
    postPrice?: string | number;
    postLocation?: string;
    postContactPhone?: string;
    images?: string[];
    videos?: string[];
    attributes?: Array<{
        attributeId: number;
        value: string;
    }>;
}

export const postService = {
    getPublicPosts: async (params?: BrowsePostsParams) => {
        const response = await api.get('/posts/browse', { params })
        return response.data
    },

    getPostDetail: async (slug: string) => {
        const response = await api.get(`/posts/detail/${slug}`)
        return response.data
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
        const response = await api.post('/posts', postData)
        return response.data
    },

    updatePost: async (postId: number, data: Partial<PostPayload>) => {
        const response = await api.patch(`/posts/${postId}`, data)
        return response.data
    },

    deletePost: async (postId: number) => {
        const response = await api.delete(`/posts/${postId}`)
        return response.data
    },

    uploadMedia: async (mediaUris: string[]) => {
        const formData = new FormData()

        for (const uri of mediaUris) {
            const cleanUri = uri.split('?')[0]
            const fileName = cleanUri.split('/').pop() || 'upload.jpg'
            const extension = fileName.split('.').pop()?.toLowerCase()

            let type = ''
            if (['jpg', 'jpeg', 'png', 'webp'].includes(extension!)) {
                type = `image/${extension === 'jpg' ? 'jpeg' : extension}`
            } else if (['mp4', 'mov', 'm4x', 'avi'].includes(extension!)) {
                type = `video/${extension === 'mov' ? 'quicktime' : extension}`
            } else {
                type = 'application/octet-stream'
            }

            if (Platform.OS === 'web') {
                const response = await fetch(uri)
                const blob = await response.blob()
                const file = new File([blob], fileName, { type: blob.type || type })
                formData.append('media', file)
            } else {
                formData.append('media', {
                    uri,
                    name: fileName,
                    type,
                } as any)
            }
        }

        const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })

        return response.data
    },

    getCategories: async () => {
        const response = await api.get('/categories')
        return response.data
    },

    getCategoryAttributes: async (categoryId: number) => {
        const response = await api.get(`/categories/${categoryId}/attributes`)
        return response.data
    }
}
