import { api } from '../../../config/api'
export const postService = {
    getMyPosts: async (userId: number) => {
        try {
            const response = await api.get('/posts/my-posts', { params: { userId } })
            return response.data
        } catch (error) {
            console.error('Error fetching my posts:', error)
        }
    },

    createPost: async (postData: any) => {
        try {
            const response = await api.post('/posts', postData)
            return response.data
        } catch (error) {
            console.error('Error creating post:', error)
        }
    },

    updatePost: async (postId: number, data: any) => {
        try {
            const response = await api.patch(`/posts/${postId}`, data)
            return response.data
        } catch (error) {
            console.error('Error updating post:', error)
        }
    },

    // Upload ảnh (Dùng FormData cho Mobile)
    uploadMedia: async (imageUris: string[]) => {
        const formData = new FormData();
        imageUris.forEach((uri, index) => {
            const fileName = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(fileName || '');
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('media', {
                uri,
                name: fileName,
                type,
            } as any);
        });

        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    //lay du lieu category va attribute
    getCategories: async () => {
        try {
            const response = await api.get('/categories')
            return response.data
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    },
    getCategoryAttributes: async (categoryId: number) => {
        try {
            const response = await api.get(`/categories/${categoryId}/attributes`)
            return response.data
        } catch (error) {
            console.error('Error fetching category attributes:', error)
        }
    }
}