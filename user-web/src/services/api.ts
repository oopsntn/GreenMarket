import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Interceptor for Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const requestOtp = (mobile: string) => api.post('/auth/user/request-otp', { mobile });
export const verifyOtp = (mobile: string, otp: string) => api.post('/auth/user/verify-otp', { mobile, otp });

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
