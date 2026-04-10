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
export const recordContactClick = (postId: number | string) => api.post(`/posts/${postId}/contact-click`);
export const getMyPosts = () => api.get('/posts/my-posts');
export const getPostingPolicy = () => api.get('/posts/posting-policy');
export const activatePersonalMonthlyPlanMock = (durationDays = 30) =>
  api.post('/posts/personal-plan/mock-activate', { durationDays });
export const updateUserPost = (postId: number, data: any) => api.patch(`/posts/${postId}`, data);
export const deleteUserPost = (postId: number) => api.delete(`/posts/${postId}`);

// Shop APIs
export const getAllShops = (params?: any) => api.get('/shops/browse', { params });
export const getPublicShop = (id: number | string) => api.get(`/shops/${id}`);
export const recordShopContactClick = (shopId: number | string) => api.post(`/shops/${shopId}/contact-click`);
export const registerShop = (data: {
  shopName: string;
  shopPhone: string;
  shopLocation: string;
  shopDescription?: string;
  shopLogoUrl?: string;
  shopCoverUrl?: string;
  shopGalleryImages?: string[];
  shopLat?: number;
  shopLng?: number;
}) => api.post('/shops/register', data);

export const getMyShop = () => api.get('/shops/my-shop');

export interface OwnerDashboardSummary {
  totalPosts: number;
  approvedPosts: number;
  pendingPosts: number;
  rejectedPosts: number;
  totalViews: number;
  totalContacts: number;
  totalShopViews: number;
  totalShopContactClicks: number;
  contactRate: number;
  postContactRate?: number;
  totalPromotionSpend: number;
  totalBoostPackageSpend?: number;
  successfulPayments: number;
  successfulBoostPurchases?: number;
  activePromotions: number;
  boostedPostsActive?: number;
}

export interface OwnerDashboardTopPost {
  postId: number;
  postTitle: string;
  postSlug: string;
  postStatus: string;
  postViewCount: number;
  postContactCount: number;
  isPromoted: boolean;
  postUpdatedAt: string | null;
}

export interface OwnerDashboardRecentPayment {
  paymentTxnId: number;
  paymentTxnProviderTxnId: string | null;
  paymentTxnStatus: string | null;
  paymentTxnAmount: number;
  paymentTxnCreatedAt: string | null;
  postId: number | null;
  postTitle: string | null;
  packageId: number | null;
  packageTitle: string | null;
}

export interface OwnerDashboardResponse {
  shop: {
    shopId: number;
    shopName: string | null;
    shopStatus: string | null;
  };
  summary: OwnerDashboardSummary;
  topPosts: OwnerDashboardTopPost[];
  recentPayments: OwnerDashboardRecentPayment[];
}

export const getOwnerDashboard = () => api.get<OwnerDashboardResponse>('/shops/dashboard');

export const updateShop = (shopId: number, data: {
  shopName?: string;
  shopEmail?: string;
  shopLocation?: string;
  shopDescription?: string;
  shopLogoUrl?: string;
  shopCoverUrl?: string;
  shopGalleryImages?: string[];
  shopLat?: number;
  shopLng?: number;
  shopFacebook?: string;
  shopInstagram?: string;
  shopYoutube?: string;
}) => api.patch(`/shops/${shopId}`, data);

export const requestShopVerificationOTP = (data: { target: string; type: 'email' | 'phone' }) => api.post('/shops/verify/request', data);
export const verifyShopEmailOTP = (data: { email: string; otp: string }) => api.post('/shops/verify/email', data);
export const addShopPhoneOTP = (data: { phone: string; otp: string }) => api.post('/shops/phones', data);
export const deleteShopPhone = (data: { phone: string }) => api.delete('/shops/phones', { data });

// Report API
export const submitReport = (data: { postId: number; reportReason: string; reporterId?: number }) =>
  api.post('/reports', data);

// --- Metadata (Categories & Attributes) ---
export const getCategories = () => api.get('/categories');
export const getCategoryAttributes = (categoryId: number) => api.get(`/categories/${categoryId}/attributes`);

// --- Promotions & Payments ---
export interface PromotionPackageItem {
  promotionPackageId: number;
  promotionPackageTitle: string | null;
  promotionPackageDurationDays: number | null;
  promotionPackagePrice: string | number | null;
  promotionPackageMaxPosts?: number | null;
  promotionPackageDisplayQuota?: number | null;
  promotionPackageDescription?: string | null;
  slotCode?: string | null;
  slotTitle?: string | null;
}

export interface EligiblePromotionPackagesResponse {
  audience: 'garden_owner' | 'individual';
  reason?: string;
  packages: PromotionPackageItem[];
}

export const getPromotionPackages = () =>
  api.get<EligiblePromotionPackagesResponse>('/promotions/packages/eligible');
export const getPublicPromotionPackages = () => api.get('/promotions/packages');
export const getPromotionPackageDetail = (id: number | string) => api.get(`/promotions/packages/${id}`);
export const buyPromotionPackage = (postId: number | string, packageId: number | string) => 
  api.post('/payment/buy-package', { postId, packageId });

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

export const uploadImages = (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append("media", file));
  return api.post("/upload/images", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const checkIsSaved = (postId: number | string) => api.get(`/posts/${postId}/favorite`);
export const toggleFavoritePost = (postId: number | string) => api.post(`/posts/${postId}/favorite`);
export const getFavoritePosts = () => api.get('/profile/favorites');

export default api;
