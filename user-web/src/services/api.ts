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
export const generateQrSession = () => api.post('/auth/qr/generate');
export const checkQrStatus = (sessionId: string) => api.get(`/auth/qr/status/${sessionId}`);

// Post APIs
export const getPublicPosts = (params?: any) => api.get('/posts/browse', { params });
export const getPostDetail = (slug: string) => api.get(`/posts/detail/${slug}`);
export const getMyPosts = (userId: number) => api.get(`/posts/my-posts?userId=${userId}`);

// Shop APIs
export const getPublicShop = (id: number | string) => api.get(`/shops/${id}`);
export const registerShop = (data: any) => api.post('/shops/register', data);
export const getMyShop = (userId: number) => api.get(`/shops/my-shop?userId=${userId}`);

// Report API
export const submitReport = (data: { postId: number; reportReason: string; reporterId?: number }) => 
  api.post('/reports', data);

// Category APIs
export const getCategories = () => api.get('/categories');
export const getCategoryAttributes = (categoryId: number) => api.get(`/categories/${categoryId}/attributes`);

// Profile APIs
export const getProfile = () => api.get('/profile');
export const updateProfile = (data: { 
  userDisplayName?: string; 
  userAvatarUrl?: string;
  userEmail?: string;
  userLocation?: string;
  userBio?: string;
}) => api.patch('/profile', data);

// Create Post
export const createPost = (data: any) => api.post("/posts", data);

export const uploadMedia = (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append("media", file));
    return api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
};

export default api;
