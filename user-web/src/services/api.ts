import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Post APIs
export const getPublicPosts = () => api.get('/posts/browse');
export const getPostDetail = (slug: string) => api.get(`/posts/detail/${slug}`);

// Shop APIs
export const registerShop = (data: any) => api.post('/shops/register', data);
export const getMyShop = (userId: number) => api.get(`/shops/my-shop?userId=${userId}`);

// Report API
export const submitReport = (data: { postId: number; reportReason: string; reporterId?: number }) => 
  api.post('/reports', data);

export default api;
