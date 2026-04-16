import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Camera, Loader2, CheckCircle2, AlertCircle, Save, Store, ExternalLink, Mail, UploadCloud, X, Shield, Plus, Trash2, Facebook, Instagram, Youtube, Pencil, Settings, Heart, Wallet, LayoutDashboard } from 'lucide-react';
import { updateProfile, updateShop, getProfile, uploadImages, requestShopVerificationOTP, verifyShopEmailOTP, addShopPhoneOTP, deleteShopPhone } from '../services/api';
import clsx from 'clsx';
import AddressPicker from '../components/AddressPicker';
import { resolveImageUrl } from '../utils/resolveImageUrl';

const Profile: React.FC = () => {
  const { user, shop, updateUser, refreshShop } = useAuth();
  const isGardenOwner = shop?.shopStatus === 'active';

  // User Fields
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  const [shopName, setShopName] = useState('');
  const [shopPhones, setShopPhones] = useState<string[]>([]);
  const [shopEmail, setShopEmail] = useState('');
  const [shopEmailVerified, setShopEmailVerified] = useState(false);
  const [shopLocation, setShopLocation] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopLat, setShopLat] = useState<number | undefined>();
  const [shopLng, setShopLng] = useState<number | undefined>();
  const [shopGalleryImages, setShopGalleryImages] = useState<string[]>([]);

  const [shopFacebook, setShopFacebook] = useState('');
  const [shopInstagram, setShopInstagram] = useState('');
  const [shopYoutube, setShopYoutube] = useState('');

  const [otpModalType, setOtpModalType] = useState<'email' | 'phone' | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [newPhoneValue, setNewPhoneValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shopGalleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getProfile();
        const data = res.data;
        setDisplayName(data.userDisplayName || '');
        setAvatarUrl(data.userAvatarUrl || '');
        setMobile(data.userMobile || '');
        setEmail(data.userEmail || '');
        setLocation(data.userLocation || '');
        setBio(data.userBio || '');

        if (shop) {
          setShopName(shop.shopName || '');
          setShopPhones(shop.shopPhone ? shop.shopPhone.split('|') : []);
          setShopEmail(shop.shopEmail || '');
          setShopEmailVerified(shop.shopEmailVerified || false);
          setShopLocation(shop.shopLocation || '');
          setShopDescription(shop.shopDescription || '');
          setShopLat(shop.shopLat);
          setShopLng(shop.shopLng);
          setShopFacebook(shop.shopFacebook || '');
          setShopInstagram(shop.shopInstagram || '');
          setShopYoutube(shop.shopYoutube || '');
          setShopGalleryImages(Array.isArray((shop as any).shopGalleryImages) ? (shop as any).shopGalleryImages : []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setMessage({ type: 'error', text: 'Không thể tải thông tin.' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shop]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const res = await uploadImages([file]);
      const newAvatarUrl = res.data.urls[0];
      setAvatarUrl(newAvatarUrl);
      setMessage({ type: 'success', text: 'Đã tải ảnh lên. Nhấn Lưu để hoàn tất.' });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setMessage({ type: 'error', text: 'Không thể tải ảnh lên.' });
    } finally {
      setSaving(false);
    }
  };

  const handleShopGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploadingGallery(true);
    try {
      const res = await uploadImages(files);
      const uploadedUrls: string[] = Array.isArray(res.data?.urls) ? res.data.urls : [];
      if (uploadedUrls.length > 0) {
        setShopGalleryImages((prev) => [...prev, ...uploadedUrls].slice(0, 4));
        setMessage({ type: 'success', text: 'Da tai anh nha vuon. Nhan Luu de cap nhat.' });
      }
    } catch (error) {
      console.error("Failed to upload shop gallery:", error);
      setMessage({ type: 'error', text: 'Khong the tai anh nha vuon.' });
    } finally {
      setUploadingGallery(false);
      if (shopGalleryInputRef.current) {
        shopGalleryInputRef.current.value = '';
      }
    }
  };

  const removeShopGalleryImage = (index: number) => {
    setShopGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (shop) {
        // Update Shop Profile
        await updateShop(shop.shopId, {
          shopName,
          shopEmail,
          shopLocation,
          shopDescription,
          shopGalleryImages,
          shopLat,
          shopLng,
          shopFacebook,
          shopInstagram,
          shopYoutube
        });

        // Also update regular profile parts that might be shared (like avatar/email)
        await updateProfile({
          userEmail: email,
          userDisplayName: shopName // Keep display name in sync with shop name for shop owners
        });

        await refreshShop();
      } else {
        // Update Personal Profile
        const updateData = {
          userDisplayName: displayName,
          userAvatarUrl: avatarUrl,
          userEmail: email,
          userLocation: location,
          userBio: bio
        };
        await updateProfile(updateData);
        updateUser(updateData);
      }

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update:", error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestOTP = async (type: 'email' | 'phone', target: string) => {
    if (!target) return;
    setOtpLoading(true);
    try {
      await requestShopVerificationOTP({ target, type });
      setMessage({ type: 'success', text: `Đã gửi OTP đến ${target}` });
      setOtpModalType(type);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Không thể gửi OTP' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValue) return;
    setOtpLoading(true);
    try {
      if (otpModalType === 'email') {
        await verifyShopEmailOTP({ email: shopEmail, otp: otpValue });
        setMessage({ type: 'success', text: 'Xác thực Email thành công' });
        setShopEmailVerified(true);
      } else if (otpModalType === 'phone') {
        const res = await addShopPhoneOTP({ phone: newPhoneValue, otp: otpValue });
        setShopPhones(res.data.shopPhone.split('|'));
        setMessage({ type: 'success', text: 'Thêm số điện thoại thành công' });
      }
      setOtpModalType(null);
      setOtpValue('');
      setNewPhoneValue('');
      await refreshShop();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Xác thực thất bại' });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDeletePhone = async (phone: string) => {
    if (confirm(`Bạn có chắc muốn xóa số điện thoại ${phone}?`)) {
      setSaving(true);
      try {
        const res = await deleteShopPhone({ phone });
        setShopPhones(res.data.shopPhone.split('|'));
        setMessage({ type: 'success', text: 'Đã xóa số điện thoại' });
        await refreshShop();
      } catch (error: any) {
        setMessage({ type: 'error', text: error.response?.data?.error || 'Không thể xóa số điện thoại' });
      } finally {
        setSaving(false);
      }
    }
  };

  const renderView = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {message && (
        <div className={clsx(
          "mb-8 p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-2",
          message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm" : "bg-red-50 text-red-600 border border-red-100/50 shadow-sm"
        )}>
          <div className={clsx(
            "p-2 rounded-xl",
            message.type === 'success' ? "bg-emerald-500/10" : "bg-red-500/10"
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          </div>
          <span className="text-sm font-black uppercase tracking-tight leading-none">{message.text}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 group">
            <span className="bg-emerald-500 w-1.5 h-6 inline-block mr-3 rounded-full align-middle group-hover:scale-y-125 transition-transform" />
            {isGardenOwner ? 'Thông tin Nhà Vườn' : 'Hồ sơ cá nhân'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 uppercase tracking-widest font-bold">Trạng thái: <span className="text-emerald-600">Đã xác minh</span></p>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-200/50 active:scale-95"
        >
          <Pencil className="w-4 h-4" /> Chỉnh sửa hồ sơ
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Basic Info Block */}
        <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Thông tin cơ bản</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Họ & Tên</span>
              <p className="text-base font-black text-slate-900">{isGardenOwner ? shopName : displayName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</span>
              <p className="text-base font-black text-slate-900 flex items-center gap-2">
                {isGardenOwner ? shopEmail : email}
                {isGardenOwner && shopEmailVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa chỉ</span>
              <p className="text-base font-black text-slate-900 leading-tight">{shop ? shopLocation : location}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</span>
              <p className="text-base font-black text-slate-900">
                {isGardenOwner ? (shopPhones.join(', ') || 'Chưa cập nhật') : (mobile || 'Chưa cập nhật')}
              </p>
            </div>
          </div>
        </div>

        {/* Gallery Preview */}
        {isGardenOwner && (
          <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <Camera className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Ảnh nhà vườn</h3>
            </div>
            {shopGalleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {shopGalleryImages.map((url, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                    <img src={resolveImageUrl(url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Chưa có ảnh mô tả vườn</p>
              </div>
            )}
          </div>
        )}

        {/* Social Links */}
        {isGardenOwner && (shopFacebook || shopInstagram || shopYoutube) && (
          <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <ExternalLink className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Mạng xã hội</h3>
            </div>
            <div className="flex flex-wrap gap-4">
              {shopFacebook && (
                <a href={shopFacebook} target="_blank" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1877F2]/5 text-[#1877F2] border border-[#1877F2]/10 font-bold text-xs uppercase tracking-wider hover:bg-[#1877F2] hover:text-white transition-all">
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
              )}
              {shopInstagram && (
                <a href={shopInstagram} target="_blank" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E4405F]/5 text-[#E4405F] border border-[#E4405F]/10 font-bold text-xs uppercase tracking-wider hover:bg-[#E4405F] hover:text-white transition-all">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              )}
              {shopYoutube && (
                <a href={shopYoutube} target="_blank" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF0000]/5 text-[#FF0000] border border-[#FF0000]/10 font-bold text-xs uppercase tracking-wider hover:bg-[#FF0000] hover:text-white transition-all">
                  <Youtube className="w-4 h-4" /> Youtube
                </a>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Settings className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                Liên kết tiện ích
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/packages"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-900">Gói dịch vụ</p>
              </div>
              <p className="text-xs text-slate-500">Xem bảng giá và quyền lợi các gói.</p>
            </Link>

            <Link
              to="/saved-posts"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-900">Bài đã lưu</p>
              </div>
              <p className="text-xs text-slate-500">Mở lại nhanh các bài bạn đã đánh dấu.</p>
            </Link>

            <Link
              to="/personal-dashboard"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-900">Dashboard cá nhân</p>
              </div>
              <p className="text-xs text-slate-500">Xem quá trình thanh toán và gói ưu tiên.</p>
            </Link>

            <Link
              to="/my-posts"
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-900">Trung tâm quản lý</p>
              </div>
              <p className="text-xs text-slate-500">Quản lý bài đăng và giao dịch cá nhân.</p>
            </Link>

            {isGardenOwner ? (
              <Link
                to="/owner-dashboard"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-900">Dashboard chủ vườn</p>
                </div>
                <p className="text-xs text-slate-500">Theo dõi KPI và hiệu quả đẩy bài.</p>
              </Link>
            ) : (
              <Link
                to="/register-shop"
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:bg-emerald-50 hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-900">Lên shop</p>
                </div>
                <p className="text-xs text-slate-500">Đăng ký nhà vườn để mở thêm quyền bán hàng.</p>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative animate-in slide-in-from-bottom-4 duration-500 custom-scrollbar">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 rounded-2xl">
              <Settings className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{isGardenOwner ? 'Chỉnh sửa hồ sơ vườn' : 'Chỉnh sửa cá nhân'}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Cập nhật thông tin để hiển thị trên hệ thống</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(false)}
            className="p-3 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all border border-slate-100 shadow-sm"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 sm:p-12">
          {message && (
            <div className={clsx(
              "mb-8 p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-2",
              message.type === 'success' ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm" : "bg-red-50 text-red-600 border border-red-100/50 shadow-sm"
            )}>
              <div className={clsx(
                "p-2 rounded-xl",
                message.type === 'success' ? "bg-emerald-500/10" : "bg-red-500/10"
              )}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              </div>
              <span className="text-sm font-black uppercase tracking-tight leading-none">{message.text}</span>
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-12">
            {/* Basic Section */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {shop ? 'Điện thoại chính' : 'Số điện thoại'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      disabled
                      type="text"
                      className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-slate-400 cursor-not-allowed opacity-60 text-sm font-bold"
                      value={shop ? (shopPhones[0] || mobile) : mobile}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {shop ? 'Tên Nhà Vườn' : 'Tên hiển thị'}
                  </label>
                  <div className="relative group">
                    {shop ? (
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    ) : (
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    )}
                    <input
                      required
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm font-bold"
                      placeholder={shop ? 'Ví dụ: Nhà Vườn Bonsai An Nhiên' : 'Họ và tên của bạn...'}
                      value={shop ? shopName : displayName}
                      onChange={(e) => shop ? setShopName(e.target.value) : setDisplayName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <AddressPicker
                  label={shop ? 'Vị trí nhà vườn' : 'Khu vực hoạt động'}
                  initialValue={shop ? shopLocation : location}
                  onAddressChange={(val) => shop ? setShopLocation(val) : setLocation(val)}
                  onLocationSelect={(lat, lng) => {
                    if (shop) {
                      setShopLat(lat);
                      setShopLng(lng);
                    }
                  }}
                />
              </div>
            </div>

            {isGardenOwner && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Thư viện ảnh nhà vườn ({shopGalleryImages.length}/4)
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {shopGalleryImages.map((imageUrl, index) => (
                    <div key={`${imageUrl}-${index}`} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square group">
                      <img
                        src={resolveImageUrl(imageUrl)}
                        alt={`Anh vuon ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeShopGalleryImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-rose-600 shadow-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 border border-slate-100 active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {shopGalleryImages.length < 4 && (
                    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500/50 transition-all cursor-pointer group">
                      <input
                        ref={shopGalleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingGallery}
                        onChange={handleShopGalleryUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {uploadingGallery ? (
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-slate-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all" />
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Thêm ảnh</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Expansion Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Liên hệ & Mạng xã hội</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-6">
                {shop && (
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại liên hệ ({shopPhones.length}/3)</label>
                    <div className="space-y-4">
                      {shopPhones.map((phone, idx) => (
                        <div key={phone + idx} className="flex items-center gap-3 animate-in fade-in duration-300">
                          <div className="relative flex-1">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                            <input disabled type="text" className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-2xl text-slate-500 opacity-80 text-sm font-bold" value={phone} />
                          </div>
                          {shopPhones.length > 1 && (
                            <button type="button" onClick={() => handleDeletePhone(phone)} className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {shopPhones.length < 3 && (
                      <button type="button" onClick={() => setOtpModalType('phone')} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-emerald-600 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:border-emerald-200 rounded-2xl transition-all active:scale-95 shadow-sm">
                        <Plus className="w-4 h-4" /> Thêm số điện thoại mới
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl focus:border-emerald-500 outline-none transition-all text-sm font-bold"
                      placeholder="Địa chỉ Email..."
                      value={shop ? shopEmail : email}
                      onChange={(e) => shop ? setShopEmail(e.target.value) : setEmail(e.target.value)}
                    />
                  </div>
                  {shop && (
                    shopEmailVerified ? (
                      <div className="px-6 py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest">
                        <CheckCircle2 className="w-4 h-4" /> Email đã thông qua
                      </div>
                    ) : (
                      <button type="button" onClick={() => handleRequestOTP('email', shopEmail)} disabled={otpLoading || !shopEmail} className="px-6 py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200">
                        {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác thực ngay'}
                      </button>
                    )
                  )}
                </div>
              </div>

              {shop && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="url" placeholder="Facebook URL" className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-slate-900 text-xs font-bold focus:border-[#1877F2] outline-none transition-all" value={shopFacebook} onChange={e => setShopFacebook(e.target.value)} />
                  </div>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="url" placeholder="Instagram URL" className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-slate-900 text-xs font-bold focus:border-[#E4405F] outline-none transition-all" value={shopInstagram} onChange={e => setShopInstagram(e.target.value)} />
                  </div>
                  <div className="relative">
                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="url" placeholder="Youtube URL" className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-slate-900 text-xs font-bold focus:border-[#FF0000] outline-none transition-all" value={shopYoutube} onChange={e => setShopYoutube(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lời giới thiệu / Tiểu sử</label>
                <textarea
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 px-6 py-5 rounded-3xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-800 text-sm font-medium leading-relaxed resize-none"
                  placeholder="Mô tả ngắn gọn về kinh nghiệm, vườn cây hoặc phong cách nghệ thuật của bạn..."
                  value={shop ? shopDescription : bio}
                  onChange={(e) => shop ? setShopDescription(e.target.value) : setBio(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-8 flex flex-col-reverse sm:flex-row items-center justify-end gap-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-12 bg-emerald-700 hover:bg-emerald-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white transition-all active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 shadow-2xl shadow-emerald-200/50 flex items-center justify-center gap-3"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Cập nhật hồ sơ</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

        {/* Left Column: Avatar & Summary */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 blur-3xl -z-10" />

            <div className="relative inline-block mb-8">
              {shop ? (
                <div className="w-40 h-40 rounded-[2.5rem] border-8 border-slate-50 overflow-hidden bg-white transition-all shadow-2xl flex items-center justify-center relative">
                  {shopGalleryImages[0] ? (
                    <img
                      src={resolveImageUrl(shopGalleryImages[0])}
                      alt="Shop"
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    <Store className="w-16 h-16 text-emerald-600" />
                  )}
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2.5rem]" />
                </div>
              ) : (
                <div className="relative group/avatar">
                  <div
                    onClick={handleAvatarClick}
                    className="w-40 h-40 rounded-full border-8 border-slate-50 overflow-hidden bg-emerald-50 cursor-pointer transition-all shadow-2xl relative"
                  >
                    {avatarUrl ? (
                      <img
                        src={resolveImageUrl(avatarUrl)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-emerald-200" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px]">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              <div className="absolute -bottom-2 -right-2 bg-white p-2.5 rounded-2xl shadow-xl border border-slate-100">
                <div className="bg-emerald-500 p-1.5 rounded-lg">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">
                {shop ? shopName : (displayName || 'Nghệ nhân')}
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Thành viên chính thức
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gia nhập</span>
                <p className="text-xs font-black text-slate-700 italic">
                  {(user as any)?.userRegisteredAt ? new Date((user as any).userRegisteredAt).toLocaleDateString('vi-VN') : 'Dân cư mới'}
                </p>
              </div>
            </div>

            {(shop ? shopDescription : bio) && (
              <div className="mt-8 pt-8 border-t border-slate-100 text-left relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Giới thiệu</div>
                <p className="text-xs text-slate-500 italic leading-relaxed text-center px-2">
                  "{shop ? shopDescription : bio}"
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: View Section */}
        <main className="lg:col-span-8">
          <div className="bg-white/50 backdrop-blur-sm p-2 rounded-[3.5rem]">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Modals Layers */}
      {isEditModalOpen && renderEditModal()}

      {/* OTP Modal (Existing) */}
      {otpModalType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 p-10 rounded-[3rem] w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button onClick={() => setOtpModalType(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors bg-slate-50 rounded-full p-2 border border-slate-100">
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                {otpModalType === 'email' ? 'Xác thực Email' : 'Thêm số điện thoại'}
              </h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Nhập mã xác thực 6 chữ số đã được gửi đến thiết bị của bạn.</p>
            </div>

            {otpModalType === 'phone' && (
              <div className="mb-8 p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Số điện thoại mới</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input type="text" className="w-full bg-white border border-slate-200 pl-12 pr-4 py-4 rounded-2xl text-sm font-bold focus:border-emerald-500 outline-none transition-all text-slate-900" placeholder="09xxxx..." value={newPhoneValue} onChange={e => setNewPhoneValue(e.target.value)} />
                </div>
                <button
                  type="button"
                  onClick={() => handleRequestOTP('phone', newPhoneValue)}
                  disabled={!newPhoneValue || otpLoading}
                  className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 transition-all flex justify-center items-center gap-3 active:scale-95 shadow-sm"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi mã OTP'}
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyOTP}>
              <div className="mb-8">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block mb-3 ml-2">Mã OTP bảo mật</label>
                <input required type="text" className="w-full bg-slate-50 border-2 border-slate-100 px-4 py-6 rounded-3xl text-center text-4xl font-black tracking-[0.2em] focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-200 text-slate-900" placeholder="000000" maxLength={6} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} />
              </div>

              <button type="submit" disabled={otpValue.length < 6 || otpLoading} className="w-full py-5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] text-white transition-all active:scale-95 shadow-2xl shadow-emerald-200/50 flex justify-center items-center gap-3">
                {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận mã'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
