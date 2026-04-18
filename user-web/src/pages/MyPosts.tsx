import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getMyPosts,
  deleteUserPost,
  restoreUserPost,
  updateUserPost,
  togglePostVisibility,
  getPromotionPackages,
  buyPromotionPackage,
  getCategories,
  getCategoryAttributes,
  getOwnerDashboard,
  type PromotionPackageItem,
} from '../services/api';
import { Store, Plus, PackageOpen, Clock, CheckCircle2, XCircle, MapPin, ChevronRight, Edit, Trash2, Zap, Loader2, ShieldCheck, User, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrencyInput } from '../hooks/useCurrencyInput';
import { resolveImageUrl } from '../utils/resolveImageUrl';

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortPromotionPackages = (packages: PromotionPackageItem[]) => {
  return [...packages].sort((a, b) => {
    const durationDiff =
      toSafeNumber(a.promotionPackageDurationDays) -
      toSafeNumber(b.promotionPackageDurationDays);
    if (durationDiff !== 0) return durationDiff;
    return (
      toSafeNumber(a.promotionPackagePrice) -
      toSafeNumber(b.promotionPackagePrice)
    );
  });
};

const getDurationTierLabel = (durationDays: number): string => {
  if (durationDays <= 3) return 'Ngắn hạn';
  if (durationDays <= 14) return 'Trung hạn';
  return 'Dài hạn';
};

const MyPosts: React.FC = () => {
  const { user, shop } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'shop'>(shop?.shopStatus === 'active' ? 'shop' : 'personal');
  const [shopSubTab, setShopSubTab] = useState<'all' | 'owner' | 'collaborator'>('all');
  const [shopStats, setShopStats] = useState<{ totalShopViews: number } | null>(null);

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editPriceInput = useCurrencyInput("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editContactPhone, setEditContactPhone] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [editCategoryAttributes, setEditCategoryAttributes] = useState<any[]>([]);
  const [editAttributes, setEditAttributes] = useState<Record<number, string>>({});
  const [boostingPost, setBoostingPost] = useState<any | null>(null);
  const [boostPackages, setBoostPackages] = useState<PromotionPackageItem[]>([]);
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostBuyingId, setBoostBuyingId] = useState<number | null>(null);

  const refreshPosts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const postsRes = await getMyPosts();
      setPosts(postsRes.data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    // Default to shop tab if user has an ACTIVE shop
    setActiveTab(shop?.shopStatus === 'active' ? 'shop' : 'personal');
  }, [shop?.shopStatus]);

  useEffect(() => {
    void refreshPosts();
  }, [refreshPosts]);

  useEffect(() => {
    const fetchShopStats = async () => {
      if (!shop || shop.shopStatus !== 'active') {
        setShopStats(null);
        return;
      }

      try {
        const response = await getOwnerDashboard();
        const summary = response.data?.summary;
        setShopStats({
          totalShopViews: Number(summary?.totalShopViews || 0),
        });
      } catch (error) {
        console.error('Failed to load shop stats for MyPosts:', error);
        setShopStats(null);
      }
    };

    void fetchShopStats();
  }, [shop?.shopId, shop?.shopStatus]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res.data || []);
      } catch (error) {
        console.error('Failed to fetch categories for edit modal:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleDelete = async (postId: number) => {
    if (!user?.id) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này không?')) {
      try {
        await deleteUserPost(postId);
        alert('Đã xóa bài đăng thành công.');
        await refreshPosts();
      } catch (error) {
        console.error('Failed to delete post', error);
        alert('Có lỗi xảy ra khi xóa bài đăng.');
      }
    }
  };

  const handleRestore = async (postId: number) => {
    if (!user?.id) return;

    try {
      await restoreUserPost(postId);
      alert('Đã khôi phục bài đăng thành công.');
      await refreshPosts();
    } catch (error: any) {
      console.error('Failed to restore post', error);
      alert(
        error?.response?.data?.error ||
        'Không thể khôi phục bài đăng này. Có thể đã quá thời gian cho phép.',
      );
    }
  };

  const handleToggleVisibility = async (postId: number) => {
    if (!user?.id) return;
    try {
      const res = await togglePostVisibility(postId);
      alert(res.data.message);
      // Update local state
      setPosts(posts.map(p => p.postId === postId ? { ...p, postPublished: res.data.post.postPublished } : p));
    } catch (error) {
      console.error('Failed to toggle post visibility', error);
      alert('Có lỗi xảy ra khi thay đổi trạng thái hiển thị.');
    }
  };

  const loadCategoryAttributes = async (categoryId: string) => {
    if (!categoryId) {
      setEditCategoryAttributes([]);
      setEditAttributes({});
      return;
    }
    try {
      const res = await getCategoryAttributes(Number(categoryId));
      setEditCategoryAttributes(res.data || []);
    } catch (error) {
      console.error('Failed to fetch category attributes for edit modal:', error);
      setEditCategoryAttributes([]);
    }
  };

  const handleEditCategoryChange = async (categoryId: string) => {
    setEditCategoryId(categoryId);
    setEditAttributes({});
    await loadCategoryAttributes(categoryId);
  };

  const handleEditAttributeChange = (attrId: number, value: string) => {
    setEditAttributes(prev => ({
      ...prev,
      [attrId]: value
    }));
  };

  const getSellerAvatar = (post: any) => {
    if (post?.postShopId) {
      return resolveImageUrl(
        post?.shop?.shopPreviewImageUrl
        || post?.shop?.shopGalleryImages?.[0]
        || post?.shop?.shopLogoUrl
        || shop?.shopPreviewImageUrl
        || shop?.shopGalleryImages?.[0]
        || shop?.shopLogoUrl
        || ''
      );
    }
    return resolveImageUrl(post?.author?.userAvatarUrl || user?.userAvatarUrl || '');
  };

  const getSellerName = (post: any) => {
    if (post?.postShopId) {
      return post?.shop?.shopName || shop?.shopName || 'Nha vuon';
    }
    return post?.author?.userDisplayName || post?.author?.userMobile || user?.userDisplayName || user?.userMobile || 'Nguoi ban';
  };

  const getPrefilledAttributes = (post: any): Record<number, string> => {
    if (!Array.isArray(post?.attributes)) return {};

    return post.attributes.reduce((acc: Record<number, string>, item: any) => {
      const rawId = item?.attributeId ?? item?.id;
      const rawValue = item?.value ?? item?.attributeValue;
      const attributeId = Number(rawId);

      if (!Number.isNaN(attributeId) && rawValue !== undefined && rawValue !== null) {
        acc[attributeId] = String(rawValue);
      }

      return acc;
    }, {});
  };

  const openEditModal = async (post: any) => {
    setEditingPost(post);
    setEditTitle(post.postTitle);
    editPriceInput.setRawValue(post.postPrice ?? "");
    setEditCategoryId(post.categoryId ? String(post.categoryId) : "");
    setEditLocation(post.postLocation || "");
    setEditContactPhone(post.postContactPhone || "");
    setEditAttributes(getPrefilledAttributes(post));
    await loadCategoryAttributes(post.categoryId ? String(post.categoryId) : "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !user?.id) return;

    try {
      const formattedAttributes = Object.entries(editAttributes)
        .filter(([, value]) => String(value).trim() !== "")
        .map(([attributeId, value]) => ({
          attributeId: Number(attributeId),
          value
        }));

      const updateRes = await updateUserPost(editingPost.postId, {
        categoryId: editCategoryId ? Number(editCategoryId) : undefined,
        postTitle: editTitle,
        postPrice: editPriceInput.rawValue,
        postLocation: editLocation,
        postContactPhone: editContactPhone,
        attributes: formattedAttributes,
      });
      const autoApprove = Boolean(updateRes?.data?.postingPolicy?.autoApprove);
      const chargedAmount = Number(updateRes?.data?.billing?.chargedAmount || 0);
      const feeSuffix = chargedAmount > 0
        ? ` Phí sửa: ${chargedAmount.toLocaleString('vi-VN')}đ.`
        : '';
      if (autoApprove || shop?.shopStatus === 'active') {
        alert('Đã cập nhật bài đăng thành công! Bài viết được hiển thị ngay.');
      } else {
        alert('Đã cập nhật bài đăng thành công! Bài viết sẽ được chuyển về trạng thái chờ duyệt.');
      }
      if (feeSuffix) {
        alert(feeSuffix.trim());
      }
      setEditingPost(null);
      // Refresh list to get updated status
      const postsRes = await getMyPosts();
      setPosts(postsRes.data);
    } catch (error: any) {
      console.error('Failed to update post', error);
      alert(error?.response?.data?.error || 'Có lỗi xảy ra khi cập nhật bài đăng.');
    }
  };

  const openBoostModal = async (post: any) => {
    setBoostingPost(post);
    setBoostLoading(true);
    try {
      const res = await getPromotionPackages();
      const payload = res.data;

      const packageList = sortPromotionPackages(payload?.packages || []);
      if (packageList.length === 0) {
        alert('Hiện không có gói phù hợp với tài khoản của bạn.');
        setBoostingPost(null);
        setBoostPackages([]);
        return;
      }

      setBoostPackages(packageList);
    } catch (error) {
      console.error('Failed to load boost packages:', error);
      alert('Không thể tải gói ưu tiên hiển thị. Vui lòng thử lại.');
      setBoostingPost(null);
    } finally {
      setBoostLoading(false);
    }
  };

  const handleBuyBoost = async (packageId: number) => {
    if (!boostingPost?.postId) return;
    setBoostBuyingId(packageId);
    try {
      const res = await buyPromotionPackage(boostingPost.postId, packageId);
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        alert('Không nhận được URL thanh toán từ hệ thống.');
      }
    } catch (err: any) {
      console.error('Failed to create boost payment', err);
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi tạo giao dịch thanh toán.');
    } finally {
      setBoostBuyingId(null);
    }
  };

  const boostPackagesWithMetrics = boostPackages.map((pkg) => {
    const durationDays = Math.max(1, toSafeNumber(pkg.promotionPackageDurationDays));
    const packagePrice = Math.max(0, toSafeNumber(pkg.promotionPackagePrice));
    const costPerDay = Math.round(packagePrice / durationDays);
    const maxPosts = toSafeNumber(pkg.promotionPackageMaxPosts);
    const displayQuota = toSafeNumber(pkg.promotionPackageDisplayQuota);

    return {
      ...pkg,
      durationDays,
      packagePrice,
      costPerDay,
      maxPosts,
      displayQuota,
    };
  });

  const recommendedPackage = boostPackagesWithMetrics.reduce<
    (typeof boostPackagesWithMetrics)[number] | null
  >((best, current) => {
    if (!best) return current;
    if (current.costPerDay < best.costPerDay) return current;
    if (
      current.costPerDay === best.costPerDay &&
      current.durationDays > best.durationDays
    ) {
      return current;
    }
    return best;
  }, null);

  const getStatusBadge = (status: string) => {
    if (status === 'hidden') {
      return <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-slate-200 shadow-sm"><Trash2 className="w-3 h-3" /> Trong thùng rác</span>;
    }

    if (status === 'expired') {
      return <span className="bg-orange-50 text-orange-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-orange-100 shadow-sm"><Clock className="w-3 h-3" /> Hết hạn</span>;
    }

    switch (status) {
      case 'pending':
        return <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-amber-100 shadow-sm"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case 'pending_owner':
        return <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-blue-100 shadow-sm"><ShieldCheck className="w-3 h-3" /> Chờ chủ vườn duyệt</span>;
      case 'approved':
        return <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-emerald-100 shadow-sm"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>;
      case 'rejected':
        return <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-rose-100 shadow-sm"><XCircle className="w-3 h-3" /> Bị từ chối</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase border border-slate-200 shadow-sm">{status}</span>;
    }
  };

  const scopedPosts = posts.filter(post => {
    // If user doesn't have an active shop, only show personal posts
    if (shop?.shopStatus !== 'active') {
      return post.postShopId === null;
    }
    // If shop is active, filter based on active tab
    if (activeTab === 'shop') {
      const isShopPost = post.postShopId !== null;
      if (!isShopPost) return false;

      // Apply Sub-tab filtering
      if (shopSubTab === 'owner') return post.postAuthorId === user?.id;
      if (shopSubTab === 'collaborator') return post.postAuthorId !== user?.id;
      return true; // 'all'
    }
    return post.postShopId === null;
  });

  const filteredPosts = scopedPosts.filter((post) => post.postStatus !== 'hidden');
  const trashedPosts = scopedPosts.filter((post) => post.postStatus === 'hidden');

  const shopPosts = shop
    ? posts.filter((post) => post.postShopId === shop.shopId)
    : [];
  const fallbackShopViews = shopPosts.reduce(
    (sum, post) => sum + Number(post.postViewCount || 0),
    0,
  );
  const displayShopViews = shopStats?.totalShopViews ?? fallbackShopViews;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900">Trung tâm quản lý</h1>
          <p className="text-slate-500 font-medium">Theo dõi và tối ưu hiệu quả bài đăng của bạn trên GreenMarket.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/packages')}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all hover:bg-slate-50 active:scale-95 shadow-sm"
          >
            <Zap className="w-5 h-5 text-emerald-600" /> Xem gói dịch vụ
          </button>
          <button
            onClick={() => navigate('/create-post')}
            className="bg-emerald-700 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-200/50"
          >
            <Plus className="w-5 h-5" /> Đăng tin mới
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {activeTab === 'shop' && shop?.shopStatus === 'active' && (
          <>
            {shop ? (
              <div className="bg-white p-8 rounded-4xl border border-emerald-100 shadow-2xl shadow-emerald-500/5 flex flex-col md:flex-row gap-8 items-center bg-linear-to-br from-white to-slate-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl -mr-32 -mt-32"></div>
                {(shop.shopPreviewImageUrl || shop.shopGalleryImages?.[0] || shop.shopLogoUrl) ? (
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border border-emerald-100 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                    <img
                      src={resolveImageUrl(shop.shopPreviewImageUrl || shop.shopGalleryImages?.[0] || shop.shopLogoUrl || '')}
                      alt={shop.shopName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100 shadow-sm">
                    <Store className="w-12 h-12" />
                  </div>
                )}
                <Link
                  to={`/shop/${shop.shopId}`}
                  className="flex-1 text-center md:text-left group/shopLink cursor-pointer"
                >
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-3xl font-black text-slate-900 group-hover/shopLink:text-emerald-700 transition-colors uppercase tracking-tight">{shop.shopName}</h2>
                    <span className={shop.shopStatus === 'active' ? "bg-emerald-50 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-100 shadow-sm transition-all" : "bg-amber-50 text-amber-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase border border-amber-100 shadow-sm"}>
                      {shop.shopStatus === 'active' ? 'Nhà vườn đã xác minh' : 'Đang chờ xác minh'}
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium max-w-xl line-clamp-2 transition-colors group-hover/shopLink:text-slate-700">{shop.shopDescription || 'Chưa có mô tả nhà vườn.'}</p>
                </Link>
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-600">{displayShopViews.toLocaleString('vi-VN')}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lượt xem</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-slate-900">{filteredPosts.length}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tin rao</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/50 p-12 rounded-4xl border border-amber-100 text-center shadow-xl shadow-amber-500/5">
                <Store className="w-16 h-16 text-amber-400 mx-auto mb-6 opacity-40" />
                <h2 className="text-2xl font-black mb-4 uppercase text-amber-900 tracking-tight">Chưa có Nhà Vườn</h2>
                <p className="text-amber-700/70 mb-8 max-w-md mx-auto font-medium">Bạn chưa đăng ký hồ sơ Nhà Vườn. Hãy đăng ký ngay để xây dựng thương hiệu cây cảnh chuyên nghiệp!</p>
                <button
                  onClick={() => navigate('/register-shop')}
                  className="bg-amber-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm hover:bg-amber-500 transition-all shadow-xl shadow-amber-200/50"
                >
                  Mở Nhà Vườn Ngay
                </button>
              </div>
            )}
          </>
        )}

        {/* Posts List */}
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 text-slate-900 tracking-tight uppercase">
              {activeTab === 'shop' ? 'Sản phẩm tại vườn' : 'Danh sách tin cá nhân'}
              <span className="text-sm font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full shadow-sm">{filteredPosts.length} bài</span>
            </h2>

            {activeTab === 'shop' && (
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                <button
                  onClick={() => setShopSubTab('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${shopSubTab === 'all'
                    ? 'bg-white text-emerald-700 shadow-md ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setShopSubTab('owner')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${shopSubTab === 'owner'
                    ? 'bg-white text-emerald-700 shadow-md ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Vườn đăng
                </button>
                <button
                  onClick={() => setShopSubTab('collaborator')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${shopSubTab === 'collaborator'
                    ? 'bg-white text-emerald-700 shadow-md ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  CTV đăng
                </button>
              </div>
            )}
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredPosts.map((post) => (
                <div key={post.postId} className="bg-white p-4 rounded-3xl border border-slate-200 hover:border-emerald-500/30 transition-all shadow-sm hover:shadow-xl flex flex-col sm:flex-row items-center gap-6 group">
                  <div className="w-full sm:w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden shrink-0 relative border border-slate-100">
                    {resolveImageUrl(post.coverImageUrl || post.images?.[0]?.imageUrl) ? (
                      <img
                        src={resolveImageUrl(post.coverImageUrl || post.images?.[0]?.imageUrl)}
                        alt={post.postTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <PackageOpen className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      {getSellerAvatar(post) ? (
                        <img
                          src={getSellerAvatar(post)}
                          alt={getSellerName(post)}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <span className="text-xs text-slate-500 font-bold truncate">{getSellerName(post)}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <h3 className="text-base font-black text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors uppercase tracking-tight leading-tight">{post.postTitle}</h3>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                        {getStatusBadge(post.postStatus)}
                        {!post.postPublished && post.postStatus === 'approved' && (
                          <span className="bg-slate-50 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-slate-200 shadow-sm">
                            <EyeOff className="w-3 h-3" /> Đã ẩn
                          </span>
                        )}
                        {post.activePromotion && (
                          <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-indigo-100 shadow-sm animate-pulse-slow">
                            <Zap className="w-3 h-3 fill-indigo-600" /> Đang đẩy tin
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-black text-xl text-emerald-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.postPrice)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {post.postLocation || 'Chưa cập nhật vị trí'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {new Date(post.postUpdatedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {post.postStatus === 'rejected' && post.postRejectedReason && (activeTab === 'shop' || activeTab === 'personal') && (
                      <div className="mt-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs text-left font-medium">
                        <strong>Lý do từ chối:</strong> {post.postRejectedReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {post.postStatus === 'approved' && (
                      <button
                        title={post.postPublished ? "Ẩn bài đăng" : "Hiện bài đăng"}
                        onClick={() => handleToggleVisibility(post.postId)}
                        className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 border ${post.postPublished
                          ? "bg-slate-50 border-slate-100 text-slate-400 hover:text-white hover:bg-slate-600"
                          : "bg-emerald-50 border-emerald-100 text-emerald-600 hover:text-white hover:bg-emerald-600 shadow-md animate-pulse-slow"
                          }`}
                      >
                        {post.postPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    )}
                    <button
                      title="Xem chi tiết"
                      onClick={() => navigate(`/posts/detail/${post.postSlug}`)}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      title="Chỉnh sửa"
                      onClick={() => openEditModal(post)}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-white hover:bg-amber-500 transition-all hover:scale-105 active:scale-95"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      title="Xóa bài"
                      onClick={() => handleDelete(post.postId)}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500 transition-all hover:scale-105 active:scale-95"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {post.postStatus === 'approved' && (
                      (shop && shop.shopStatus === 'active' && post.postShopId === shop.shopId) ||
                      (post.postShopId === null)
                    ) && (
                        <button
                          title={post.activePromotion ? "Bài đăng đang được quảng bá" : "Quảng bá bài viết"}
                          disabled={!!post.activePromotion}
                          onClick={() => openBoostModal(post)}
                          className={`p-3 rounded-xl transition-all shadow-sm ${post.activePromotion
                            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:text-white hover:bg-emerald-600 hover:scale-110 active:scale-95"
                            }`}
                        >
                          <Zap className={`w-5 h-5 ${post.activePromotion ? "fill-slate-400" : "fill-emerald-600 group-hover:fill-white"}`} />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white border border-slate-200 rounded-4xl shadow-sm border-dashed">
              <PackageOpen className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-2 text-slate-900 tracking-tight uppercase">Không tìm thấy bài viết nào</h3>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900 tracking-tight uppercase">
            Thùng rác bài đăng
            <span className="text-sm font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full shadow-sm">{trashedPosts.length} bài</span>
          </h2>

          {trashedPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {trashedPosts.map((post) => (
                <div key={`trash-${post.postId}`} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        {post.postTitle}
                      </h3>
                      {getStatusBadge(post.postStatus)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-500 font-medium">
                      <div>
                        <div className="text-slate-900 font-bold">
                          Đã xóa lúc: {post.postDeletedAt ? new Date(post.postDeletedAt).toLocaleString('vi-VN') : 'Chưa rõ'}
                        </div>
                        <div>
                          Khôi phục đến: {post.lifecycle?.restoreUntil ? new Date(post.lifecycle.restoreUntil).toLocaleString('vi-VN') : 'Không khả dụng'}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-900 font-bold">
                          {post.postLocation || 'Chưa cập nhật vị trí'}
                        </div>
                        <div>
                          {post.lifecycle?.canRestore
                            ? 'Bài vẫn còn trong thời gian khôi phục.'
                            : 'Đã hết thời gian khôi phục theo cấu hình hệ thống.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      title="Xem chi tiết"
                      onClick={() => navigate(`/posts/detail/${post.postSlug}`)}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-white hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      title="Khôi phục bài đăng"
                      onClick={() => handleRestore(post.postId)}
                      disabled={!post.lifecycle?.canRestore}
                      className="px-4 py-3 rounded-xl font-bold border transition-all flex items-center gap-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Khôi phục
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-4xl shadow-sm border-dashed">
              <Trash2 className="w-14 h-14 text-slate-200 mx-auto mb-5" />
              <h3 className="text-lg font-bold mb-2 text-slate-900 tracking-tight uppercase">Thùng rác đang trống</h3>
              <p className="text-slate-500 max-w-md mx-auto font-medium">
                Những bài bạn tự xóa sẽ nằm ở đây trong khoảng thời gian khôi phục mà admin cấu hình.
              </p>
            </div>
          )}
        </div>
      </div>

      {boostingPost && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm shadow-2xl flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-6xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 flex items-center justify-between mb-6 gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Chọn gói ưu tiên hiển thị</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  <p className="text-slate-500 text-sm font-bold">Bài đăng: <span className="text-emerald-700">{boostingPost.postTitle}</span></p>
                  {boostingPost.activePromotion && (
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100 shadow-sm animate-pulse-slow">
                      <Zap className="w-3.5 h-3.5 fill-indigo-600" />
                      <span className="text-[11px] font-black uppercase tracking-wider">Đang chạy gói: {boostingPost.activePromotion.packageName}</span>
                      <span className="text-[10px] opacity-70 font-bold border-l border-indigo-200 pl-2 ml-1">Hết hạn: {new Date(boostingPost.activePromotion.endAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
                <Link
                  to="/packages"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-600 uppercase tracking-wider"
                >
                  Xem bảng giá đầy đủ <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <button
                onClick={() => setBoostingPost(null)}
                className="px-4 py-2 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200"
              >
                Đóng
              </button>
            </div>

            {boostLoading ? (
              <div className="min-h-[220px] flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
                <p className="font-bold uppercase tracking-widest text-xs">Đang tải gói ưu tiên...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 font-bold text-slate-700">
                  {boostPackagesWithMetrics.map((pkg) => {
                    const isRecommended =
                      recommendedPackage?.promotionPackageId === pkg.promotionPackageId;
                    const packageTitle = (pkg.promotionPackageTitle || `Goi ${pkg.durationDays} ngay`).trim();
                    return (
                      <div
                        key={pkg.promotionPackageId}
                        className={`bg-slate-50 p-5 rounded-2xl border transition-all flex flex-col shadow-sm hover:shadow-lg ${isRecommended
                          ? 'border-emerald-500 ring-2 ring-emerald-100'
                          : 'border-slate-200 hover:border-emerald-500/30'
                          }`}
                      >
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-black uppercase tracking-tight text-emerald-700">
                              {packageTitle}
                            </h3>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider">
                              {getDurationTierLabel(pkg.durationDays)}
                              {toSafeNumber(pkg.slotCapacity) > 0 && ` (${pkg.currentUsage}/${pkg.slotCapacity})`}
                            </span>
                          </div>
                          {isRecommended ? (
                            <p className="text-[11px] text-emerald-700 mt-1 uppercase tracking-wider">
                              Gói đề xuất theo chi phí/ngày
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 mt-1">
                              {pkg.promotionPackageDescription || 'Ưu tiên hiển thị cho bài đăng đã duyệt'}
                            </p>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="text-2xl font-black text-slate-900">
                            {formatVnd(pkg.packagePrice)}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Thời hạn: {pkg.durationDays} ngày · {formatVnd(pkg.costPerDay)}/ngày
                          </div>
                        </div>

                        <ul className="space-y-2 mb-5 flex-1">
                          <li className="flex items-start gap-2 text-xs text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Ưu tiên hiển thị trong {pkg.durationDays} ngày</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Tối đa {pkg.maxPosts > 0 ? pkg.maxPosts : '-'} bài áp dụng</span>
                          </li>
                          <li className="flex items-start gap-2 text-xs text-slate-500">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Quota hiển thị {pkg.displayQuota > 0 ? pkg.displayQuota.toLocaleString('vi-VN') : '-'} lượt
                            </span>
                          </li>
                        </ul>

                        <button
                          disabled={boostBuyingId !== null || (toSafeNumber(pkg.slotCapacity) > 0 && (pkg.currentUsage || 0) >= toSafeNumber(pkg.slotCapacity))}
                          onClick={() => handleBuyBoost(pkg.promotionPackageId)}
                          className="w-full py-3 rounded-xl border font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all bg-emerald-700 border-emerald-600 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-200/50 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none"
                        >
                          {boostBuyingId === pkg.promotionPackageId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (toSafeNumber(pkg.slotCapacity) > 0 && (pkg.currentUsage || 0) >= toSafeNumber(pkg.slotCapacity)) ? (
                            'Vị trí đã đầy'
                          ) : (
                            'Mua gói này'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm shadow-2xl flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl relative overflow-x-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 tracking-tight text-slate-900 uppercase">
              <Store className="w-6 h-6 text-emerald-700" /> Sửa bài đăng
            </h2>

            <form onSubmit={handleEditSubmit} className="relative z-10 space-y-5">
              <div>
                <label className="block text-slate-500 text-xs font-black uppercase tracking-wider mb-2">Danh mục</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-sm transition-all"
                  value={editCategoryId}
                  onChange={(e) => handleEditCategoryChange(e.target.value)}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryTitle}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-black uppercase tracking-wider mb-2">Tiêu đề bài viết</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-sm transition-all"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 text-xs font-black uppercase tracking-wider mb-2">Giá bán (VND)</label>
                  <input
                    required
                    type="text"
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white focus:shadow-sm outline-none transition-all text-slate-900 font-black text-lg"
                    ref={editPriceInput.inputRef}
                    value={editPriceInput.displayValue}
                    onChange={editPriceInput.handleChange}
                    inputMode="numeric"
                  />
                </div>
                {!shop && (
                  <div>
                    <label className="block text-slate-500 text-xs font-black uppercase tracking-wider mb-2">Khu vực</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-sm transition-all"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Ví dụ: Thạch Thất, Hà Nội"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 text-xs font-black uppercase tracking-wider mb-2">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-sm transition-all"
                  value={editContactPhone}
                  onChange={(e) => setEditContactPhone(e.target.value)}
                  placeholder="Nhập SĐT để người mua liên hệ"
                />
              </div>



              {editCategoryAttributes.length > 0 && (
                <div className="space-y-4">
                  <label className="block text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-100 pb-2">Thuộc tính chi tiết</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {editCategoryAttributes.map((attr) => (
                      <div key={attr.attributeId} className="space-y-2">
                        <label className="text-xs text-slate-500 font-bold">
                          {attr.attributeTitle} {attr.required && '*'}
                        </label>
                        {attr.attributeDataType === 'enum' && attr.attributeOptions ? (
                          <select
                            required={attr.required}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                            value={editAttributes[attr.attributeId] || ''}
                            onChange={(e) => handleEditAttributeChange(attr.attributeId, e.target.value)}
                          >
                            <option value="">Chọn {attr.attributeTitle}</option>
                            {attr.attributeOptions.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            required={attr.required}
                            type={attr.attributeDataType === 'number' ? 'number' : 'text'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                            value={editAttributes[attr.attributeId] || ''}
                            onChange={(e) => handleEditAttributeChange(attr.attributeId, e.target.value)}
                            placeholder={`Nhập ${attr.attributeTitle}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all border border-slate-200"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-xl shadow-emerald-200/50"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyPosts;

