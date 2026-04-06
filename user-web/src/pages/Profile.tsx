import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Camera, Loader2, CheckCircle2, AlertCircle, Save, Store, ExternalLink, Mail, UploadCloud, X, Shield, Plus, Trash2, Facebook, Instagram, Youtube } from 'lucide-react';
import { updateProfile, updateShop, getProfile, uploadImages, requestShopVerificationOTP, verifyShopEmailOTP, addShopPhoneOTP, deleteShopPhone } from '../services/api';
import clsx from 'clsx';
import AddressPicker from '../components/AddressPicker';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const Profile: React.FC = () => {
  const { user, shop, updateUser, refreshShop } = useAuth();

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

  const toMediaUrl = (url?: string | null) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left Column: Avatar & Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass p-8 rounded-[2.5rem] text-center relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -z-10" />

            <div className="relative inline-block mb-6">
              {shop ? (
                <div className="w-32 h-32 rounded-3xl border-4 border-white/10 overflow-hidden bg-surface transition-all shadow-2xl flex items-center justify-center">
                  <Store className="w-12 h-12 text-emerald-500" />
                </div>
              ) : (
                <>
                  <div
                    onClick={handleAvatarClick}
                    className="w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden bg-surface cursor-pointer group-hover:border-emerald-500/50 transition-all shadow-2xl"
                  >
                    {avatarUrl ? (
                      <img
                        src={toMediaUrl(avatarUrl)}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-500/10">
                        <User className="w-12 h-12 text-emerald-500" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>

            <h2 className="text-xl font-bold mb-1 line-clamp-1 uppercase tracking-tight">
              {shop ? shopName : (displayName || 'Nghệ nhân')}
            </h2>
            <p className="text-slate-400 text-sm mb-6">{shop ? (shopPhones[0] || 'Chưa cập nhật SĐT') : mobile}</p>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase tracking-widest font-bold">Thành viên từ</span>
                <span className="text-slate-300">{(user as any)?.userRegisteredAt ? new Date((user as any).userRegisteredAt).toLocaleDateString('vi-VN') : 'Mới'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 uppercase tracking-widest font-bold">Trạng thái</span>
                <span className="text-emerald-500 font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">Hoạt động</span>
              </div>
            </div>

            {(shop ? shopDescription : bio) && (
              <div className="mt-8 pt-8 border-t border-white/5 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Giới thiệu</span>
                <p className="text-xs text-slate-400 italic line-clamp-4 leading-relaxed">"{shop ? shopDescription : bio}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <div className="glass p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10" />

            <div className="mb-10">
              <h1 className="text-2xl font-black mb-2">{shop ? 'Hồ sơ Nhà Vườn' : 'Hồ sơ cá nhân'}</h1>
              <p className="text-slate-400 text-sm">
                {shop ? 'Quản lý thông tin vườn cây để tăng sự chuyên nghiệp' : 'Cập nhật thông tin chi tiết để tăng độ uy tín với khách hàng'}
              </p>
            </div>

            {message && (
              <div className={clsx(
                "mb-8 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              )}>
                {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-10">
              {/* Basic Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-0.5 flex-1 bg-white/5" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] whitespace-nowrap">Thông tin cơ bản</span>
                  <div className="h-0.5 flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      {shop ? 'Điện thoại chính' : 'Số điện thoại'}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input
                        disabled
                        type="text"
                        className="w-full bg-white/5 border border-white/5 pl-12 pr-4 py-3.5 rounded-2xl text-slate-500 cursor-not-allowed opacity-60 text-sm font-medium"
                        value={shop ? (shopPhones[0] || mobile) : mobile}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      {shop ? 'Tên Nhà Vườn' : 'Tên hiển thị'}
                    </label>
                    <div className="relative group">
                      {shop ? (
                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                      ) : (
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                      )}
                      <input
                        required
                        type="text"
                        className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                        placeholder={shop ? 'Nhập tên nhà vườn...' : 'Nhập họ và tên...'}
                        value={shop ? shopName : displayName}
                        onChange={(e) => shop ? setShopName(e.target.value) : setDisplayName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <AddressPicker
                    label={shop ? 'Vị trí nhà vườn' : 'Khu vực / Tỉnh thành'}
                    initialValue={shop ? shopLocation : location}
                    onAddressChange={(val) => shop ? setShopLocation(val) : setLocation(val)}
                    onLocationSelect={(lat, lng) => {
                      if (shop) {
                        setShopLat(lat);
                        setShopLng(lng);
                      }
                    }}
                  />
                  {shop && (shopLat || shopLocation) && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between transition-all">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                          {shopLat && shopLng ? 'Toạ độ chính xác' : 'Khu vực hiển thị'}
                        </span>
                        {shopLat && shopLng ? (
                          <span className="text-xs font-mono text-emerald-500">{Number(shopLat).toFixed(6)}, {Number(shopLng).toFixed(6)}</span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Dựa trên địa chỉ</span>
                        )}
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${shopLat && shopLng ? `${shopLat},${shopLng}` : encodeURIComponent(shopLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                        title="Xem trên Google Maps"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {shop && (
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Ảnh nhà vườn (tối đa 4 ảnh)
                  </label>

                  {shopGalleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {shopGalleryImages.map((imageUrl, index) => (
                        <div key={`${imageUrl}-${index}`} className="relative rounded-2xl overflow-hidden border border-white/10 bg-surface aspect-square">
                          <img
                            src={toMediaUrl(imageUrl)}
                            alt={`Ảnh nhà vườn ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeShopGalleryImage(index)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                            title="Xóa ảnh"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-500">
                      Chưa có ảnh nhà vườn. Tải ảnh để tăng độ tin cậy khi khách vào trang shop.
                    </div>
                  )}

                  <div className="relative border border-dashed border-white/10 rounded-2xl p-4 bg-surface hover:border-emerald-500/40 transition-all">
                    <input
                      ref={shopGalleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploadingGallery || shopGalleryImages.length >= 4}
                      onChange={handleShopGalleryUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <UploadCloud className="w-5 h-5 text-emerald-500" />
                      <span>{uploadingGallery ? 'Đang tải ảnh...' : (shopGalleryImages.length >= 4 ? 'Đã đạt giới hạn 4 ảnh' : 'Bấm để tải thêm ảnh nhà vườn')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Expansion Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-0.5 flex-1 bg-white/5" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] whitespace-nowrap">Liên hệ & Giới thiệu</span>
                  <div className="h-0.5 flex-1 bg-white/5" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email liên hệ</label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative group flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="email"
                        className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                        placeholder="email@example.com"
                        value={shop ? shopEmail : email}
                        onChange={(e) => shop ? setShopEmail(e.target.value) : setEmail(e.target.value)}
                      />
                    </div>
                    {shop && (
                      shopEmailVerified ? (
                        <div className="px-4 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm font-bold">Đã xác minh</span>
                        </div>
                      ) : (
                        <button type="button" onClick={() => handleRequestOTP('email', shopEmail)} disabled={otpLoading || !shopEmail} className="px-4 py-3.5 rounded-2xl bg-surface border border-white/10 hover:border-emerald-500 text-sm font-bold flex justify-center items-center gap-2 transition-all">
                          {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Xác thực ngay'}
                        </button>
                      )
                    )}
                  </div>
                  {shop && !shopEmailVerified && shopEmail && (
                    <p className="text-xs text-amber-500 italic mt-1 ml-1 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl inline-block">Email chưa xác thực. OTP sẽ được gửi về email mới.</p>
                  )}
                </div>

                {shop && (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Số điện thoại liên hệ ({shopPhones.length}/3)</label>
                    <div className="space-y-2">
                      {shopPhones.map((phone, idx) => (
                        <div key={phone + idx} className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            <input disabled type="text" className="w-full bg-white/5 border border-white/5 pl-12 pr-4 py-3.5 rounded-2xl text-slate-300 opacity-80 text-sm font-medium" value={phone} />
                          </div>
                          {shopPhones.length > 1 && (
                            <button type="button" onClick={() => handleDeletePhone(phone)} className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {shopPhones.length < 3 && (
                      <button type="button" onClick={() => setOtpModalType('phone')} className="flex w-fit items-center gap-2 px-4 py-2 mt-2 text-sm text-emerald-500 font-bold hover:bg-emerald-500/10 rounded-xl transition-all">
                        <Plus className="w-4 h-4" /> Thêm số điện thoại mới
                      </button>
                    )}
                  </div>
                )}

                {shop && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Kênh mạng xã hội (Tùy chọn)</label>

                    <div className="relative group">
                      <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 focus-within:text-[#1877F2]" />
                      <input type="url" placeholder="Link Facebook" className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl text-sm" value={shopFacebook} onChange={e => setShopFacebook(e.target.value)} />
                    </div>
                    <div className="relative group">
                      <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 focus-within:text-[#E4405F]" />
                      <input type="url" placeholder="Link Instagram" className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl text-sm" value={shopInstagram} onChange={e => setShopInstagram(e.target.value)} />
                    </div>
                    <div className="relative group">
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 focus-within:text-[#FF0000]" />
                      <input type="url" placeholder="Link Youtube" className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl text-sm" value={shopYoutube} onChange={e => setShopYoutube(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    {shop ? 'Mô tả Nhà Vườn' : 'Lời giới thiệu'}
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-surface border border-white/10 px-6 py-4 rounded-3xl focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium leading-relaxed resize-none"
                    placeholder={shop ? 'Giới thiệu về kinh nghiệm, các loại cây thế mạnh của vườn...' : 'Mô tả kỹ năng chăm sóc cây, kinh nghiệm làm vườn của bạn...'}
                    value={shop ? shopDescription : bio}
                    onChange={(e) => shop ? setShopDescription(e.target.value) : setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-12 bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-700 shadow-xl shadow-emerald-900/40 text-white"
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Lưu hồ sơ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      {otpModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#111] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm relative shadow-2xl slide-in-from-bottom-4">
            <button onClick={() => setOtpModalType(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-full p-1.5">
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-black">{otpModalType === 'email' ? 'Xác thực Email' : 'Thêm số điện thoại'}</h3>
              <p className="text-sm text-slate-400 mt-1">Mã xác thực 6 số bảo mật</p>
            </div>

            {otpModalType === 'phone' && (
              <div className="mb-5 bg-white/5 p-4 rounded-2xl border border-white/10">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2">Số điện thoại mới</label>
                <input type="text" className="w-full bg-black/40 border border-white/10 px-4 py-3 rounded-xl text-sm focus:border-emerald-500 outline-none transition-colors" placeholder="09xxxx..." value={newPhoneValue} onChange={e => setNewPhoneValue(e.target.value)} />
                <button type="button" onClick={() => handleRequestOTP('phone', newPhoneValue)} disabled={!newPhoneValue || otpLoading} className="mt-3 w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors flex justify-center items-center gap-2">
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gửi mã OTP'}
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyOTP}>
              <div className="mb-6">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2">Mã xác thực (OTP)</label>
                <input required type="text" className="w-full bg-black/40 border border-emerald-500/30 px-4 py-4 rounded-2xl text-center text-3xl font-mono tracking-[0.3em] focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700" placeholder="------" maxLength={6} value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))} />
              </div>

              <button type="submit" disabled={otpValue.length < 6 || otpLoading} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all active:scale-95 text-white shadow-xl shadow-emerald-900/20">
                {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác nhận ngay'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
