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
export const togglePostVisibility = (postId: number | string) => api.patch(`/posts/${postId}/toggle-visibility`);
export const deleteUserPost = (postId: number) => api.delete(`/posts/${postId}`);
export const restoreUserPost = (postId: number) => api.post(`/posts/${postId}/restore`);

// Shop APIs
export const getAllShops = (params?: any) => api.get('/shops/browse', { params });
export const getPublicShop = (id: number | string) => api.get(`/shops/${id}`);
export const recordShopContactClick = (shopId: number | string) => api.post(`/shops/${shopId}/contact-click`);
export const registerShop = (data: {
  shopName: string;
  shopPhone?: string;
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
  pendingCollaboratorPosts?: number;
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

export const deletePendingShop = () => api.delete('/shops/pending');


export const requestShopVerificationOTP = (data: { target: string; type: 'email' | 'phone' }) => api.post('/shops/verify/request', data);
export const verifyShopEmailOTP = (data: { email: string; otp: string }) => api.post('/shops/verify/email', data);
export const addShopPhoneOTP = (data: { phone: string; otp: string }) => api.post('/shops/phones', data);
export const deleteShopPhone = (data: { phone: string }) => api.delete('/shops/phones', { data });

// Report API
export const submitReport = (data: {
  postId: number;
  reportReason: string;
  reportReasonCode?: string;
  reportNote?: string;
  evidenceUrls?: string[];
}) => api.post('/reports', data);

// Notification API
export const getMyNotifications = () => api.get('/notifications');
export const markNotificationAsRead = (id: number) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.patch('/notifications/read-all');

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
  slotCapacity?: number;
  currentUsage?: number;
  slotRules?: string;
  recommended?: boolean;
}

export interface EligiblePromotionPackagesResponse {
  audience: 'garden_owner' | 'individual';
  reason?: string;
  packages: PromotionPackageItem[];
}

export const getPromotionPackages = () =>
  api.get<EligiblePromotionPackagesResponse>('/promotions/packages/eligible');
export const getPublicPromotionPackages = () => api.get('/promotions/packages');
export const getShopVipPackage = () => api.get<PromotionPackageItem>('/promotions/packages/shop-vip');
export const getPromotionPackageDetail = (id: number | string) => api.get(`/promotions/packages/${id}`);
export const buyPromotionPackage = (postId: number | string, packageId: number | string) =>
  api.post('/payment/buy-package', { postId, packageId });
export const payShopRegistration = () => api.post<{ paymentUrl: string }>('/payment/register-shop');
export const buyShopVipPackage = () => api.post<{ paymentUrl: string }>('/payment/buy-shop-vip');
export interface PricingConfig {
  shopRegistrationPrice: number;
  personalMonthlyPrice: number;
  ownerPolicy: {
    planTitle: string;
    autoApprove: boolean;
    dailyPostLimit: number | null;
    postFeeAmount: number;
    freeEditQuota: number;
    editFeeAmount: number;
    features?: string[];
  };
  personalPolicy: {
    planTitle: string;
    autoApprove: boolean;
    dailyPostLimit: number | null;
    postFeeAmount: number;
    freeEditQuota: number;
    editFeeAmount: number;
    features?: string[];
  };
  shopVipPolicy: {
    planTitle: string;
    features?: string[];
  };
}

export const getPricingConfig = () => api.get<PricingConfig>('/pricing-config');
export interface PublicSystemSettings {
  general: {
    platformName: string;
    supportEmail: string;
  };
  postLifecycle: {
    postRateLimitPerHour: number;
    postExpiryDays: number;
    restoreWindowDays: number;
    allowAutoExpire: boolean;
  };
  media: {
    maxImagesPerPost: number;
    maxFileSizeMb: number;
    enableImageCompression: boolean;
  };
}

export const getPublicSystemSettings = () => api.get<PublicSystemSettings>('/settings/public');
export const buyPersonalPackage = () => api.post<{ paymentUrl: string }>('/payment/buy-personal');
export const getPaymentHistory = () => api.get('/payment/history');

// Profile APIs
export const getProfile = () => api.get('/profile');
export const updateProfile = (data: {
  userDisplayName?: string;
  userAvatarUrl?: string;
  userLocation?: string;
  userBio?: string;
}) => api.patch('/profile', data);

export const requestUserEmailOTP = (data: { email: string }) => api.post('/profile/email/request-otp', data);
export const verifyUserEmailOTP = (data: { email: string; otp: string }) => api.post('/profile/email/verify', data);
export const removeUserEmailOTP = (data: { otp: string }) => api.post('/profile/email/remove', data);

// Create Post
export const createPost = (data: any) => api.post("/posts", data);

const HARD_MAX_IMAGE_SIZE_MB = 3;
const HARD_ENABLE_IMAGE_COMPRESSION = true;

const loadImageElement = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Không thể đọc ảnh ${file.name}`));
    };

    image.src = objectUrl;
  });

const canvasToFile = (
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
  fileName: string,
) =>
  new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(`Không thể nén ảnh ${fileName}`));
        return;
      }

      resolve(new File([blob], fileName, { type: blob.type || type }));
    }, type, quality);
  });

const compressImageFile = async (file: File, maxFileSizeMb: number) => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  if (['image/gif', 'image/avif', 'image/heic', 'image/heif'].includes(file.type)) {
    return file;
  }

  const image = await loadImageElement(file);
  const maxDimension = 2000;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  const preferredType =
    file.type === 'image/png' && file.size <= maxFileSizeMb * 1024 * 1024
      ? 'image/png'
      : 'image/jpeg';

  let quality = 0.86;
  let compressed = await canvasToFile(
    canvas,
    preferredType,
    preferredType === 'image/jpeg' ? quality : 0.92,
    file.name.replace(/\.\w+$/, preferredType === 'image/jpeg' ? '.jpg' : '.png'),
  );

  const targetBytes = maxFileSizeMb * 1024 * 1024;
  while (
    preferredType === 'image/jpeg' &&
    compressed.size > targetBytes &&
    quality > 0.45
  ) {
    quality -= 0.08;
    compressed = await canvasToFile(canvas, preferredType, quality, compressed.name);
  }

  return compressed.size <= file.size ? compressed : file;
};

const prepareUploadFiles = async (files: File[]) => {
  if (!HARD_ENABLE_IMAGE_COMPRESSION) {
    return files;
  }

  return Promise.all(
    files.map((file) => compressImageFile(file, HARD_MAX_IMAGE_SIZE_MB).catch(() => file)),
  );
};

export const uploadMedia = async (files: File[]) => {
  const preparedFiles = await prepareUploadFiles(files);
  const formData = new FormData();
  preparedFiles.forEach(file => formData.append("media", file));
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const uploadImages = async (files: File[]) => {
  const preparedFiles = await prepareUploadFiles(files);
  const formData = new FormData();
  preparedFiles.forEach(file => formData.append("media", file));
  return api.post("/upload/images", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
};

export const checkIsSaved = (postId: number | string) => api.get(`/posts/${postId}/favorite`);
export const toggleFavoritePost = (postId: number | string) => api.post(`/posts/${postId}/favorite`);
export const getFavoritePosts = () => api.get('/profile/favorites');

// Host content public APIs
export interface HostPublicContent {
  hostContentId: number;
  hostContentTitle: string;
  hostContentDescription: string | null;
  hostContentBody: string | null;
  hostContentMediaUrls: string[] | null;
  hostContentCategory: string | null;
  hostContentViewCount: number | null;
  hostContentCreatedAt: string | null;
  authorId: number | null;
  authorName: string | null;
  authorAvatar: string | null;
  target?: {
    postTitle?: string;
    postSlug?: string;
    shopId?: number;
    shopName?: string;
    shopLogoUrl?: string;
  } | null;
}

export interface HostPublicContentsResponse {
  data: HostPublicContent[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface HostFavoriteContent {
  favoriteCreatedAt: string | null;
  hostContentId: number;
  hostContentTitle: string;
  hostContentDescription: string | null;
  hostContentMediaUrls: string[] | null;
  hostContentCategory: string | null;
  hostContentViewCount: number | null;
  hostContentCreatedAt: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  authorId: number | null;
}

export interface HostFavoriteContentsResponse {
  data: HostFavoriteContent[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const getHostPublicContents = (params?: {
  search?: string;
  category?: "News" | "Tips" | "Events";
  page?: number;
  limit?: number;
}) => api.get<HostPublicContentsResponse>('/host/public/contents', { params });

export const toggleFavoriteHostContent = (contentId: number | string) =>
  api.post<{ message: string; isSaved: boolean }>(`/host/favorites/${contentId}`);

export const checkHostContentSaved = (contentId: number | string) =>
  api.get<{ isSaved: boolean }>(`/host/favorites/${contentId}/check`);

export const getMyFavoriteHostContents = (params?: {
  page?: number;
  limit?: number;
}) => api.get<HostFavoriteContentsResponse>('/host/favorites', { params });

export const getHostPublicContentDetail = (id: number | string) =>
  api.get<HostPublicContent>(`/host/public/contents/${id}`);

// --- Collaborator (CTV) API ---
export interface CollaboratorProfile {
  userId: number;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  location?: string | null;
  availabilityStatus?: string | null;
  availabilityNote?: string | null;
  mobile?: string | null;
  email?: string | null;
  relationshipStatus?: 'pending' | 'active' | 'rejected' | null;
  joinedAt?: string;
}

export interface CollaboratorFullProfile extends CollaboratorProfile {
  stats: {
    totalGardens: number;
    totalPosts: number;
  };
  portfolioPhotos: string[];
}

export interface CollaboratorInvitation {
  invitationId: number;
  status: string;
  createdAt: string;
  shopId: number;
  shopName: string;
  shopLogoUrl: string | null;
  shopOwnerName: string;
}

export interface CollaboratorsListResponse {
  data: CollaboratorProfile[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// 1. Owner Discovery & Management
export const getPublicCollaborators = (params?: {
  page?: number;
  limit?: number;
}) => api.get<CollaboratorsListResponse>('/collaborator/public-list', { params });

export const getPublicCollaboratorDetail = (id: number | string) =>
  api.get<CollaboratorFullProfile>(`/collaborator/public/${id}`);

export const getShopCollaborators = () => 
  api.get<CollaboratorProfile[]>('/shops/collaborators/all');

export const inviteCollaborator = (userIdentifier: string) => 
  api.post('/shops/collaborators/invite', { userIdentifier });

export const removeCollaborator = (id: number) => 
  api.delete(`/shops/collaborators/${id}`);

// 2. CTV Invitations
export const getMyCollaboratorInvitations = () => 
  api.get<CollaboratorInvitation[]>('/collaborator/invitations');

export const respondToCollaboratorInvitation = (id: number, action: 'accept' | 'reject') => 
  api.post(`/collaborator/invitations/${id}/respond`, { action });

// 3. Delegated Post Management
export const getPendingCollaboratorPosts = () => 
  api.get<any[]>('/shops/collaborators/posts/pending');

export const approveCollaboratorPost = (id: number) => 
  api.post(`/shops/collaborators/posts/${id}/approve`);

export const rejectCollaboratorPost = (id: number, reason: string) => 
  api.post(`/shops/collaborators/posts/${id}/reject`, { reason });

export default api;
