import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Camera, Loader2, CheckCircle2, AlertCircle, Save, Store, ExternalLink, Mail, UploadCloud, X } from 'lucide-react';
import { updateProfile, updateShop, getProfile, uploadImages } from '../services/api';
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
  const [shopPhone, setShopPhone] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopLat, setShopLat] = useState<number | undefined>();
  const [shopLng, setShopLng] = useState<number | undefined>();
  const [shopGalleryImages, setShopGalleryImages] = useState<string[]>([]);

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
          setShopPhone(shop.shopPhone || '');
          setShopLocation(shop.shopLocation || '');
          setShopDescription(shop.shopDescription || '');
          setShopLat(shop.shopLat);
          setShopLng(shop.shopLng);
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
          shopPhone,
          shopLocation,
          shopDescription,
          shopGalleryImages,
          shopLat,
          shopLng
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
            <p className="text-slate-400 text-sm mb-6">{shop ? shopPhone : mobile}</p>

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
                      {shop ? 'Điện thoại vườn' : 'Số điện thoại'}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      {shop ? (
                        <input
                          required
                          type="text"
                          className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                          placeholder="Số điện thoại liên hệ vườn..."
                          value={shopPhone}
                          onChange={(e) => setShopPhone(e.target.value)}
                        />
                      ) : (
                        <input
                          disabled
                          type="text"
                          className="w-full bg-white/5 border border-white/5 pl-12 pr-4 py-3.5 rounded-2xl text-slate-500 cursor-not-allowed opacity-60 text-sm font-medium"
                          value={mobile}
                        />
                      )}
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
                    Anh nha vuon (toi da 4 anh)
                  </label>

                  {shopGalleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {shopGalleryImages.map((imageUrl, index) => (
                        <div key={`${imageUrl}-${index}`} className="relative rounded-2xl overflow-hidden border border-white/10 bg-surface aspect-square">
                          <img
                            src={toMediaUrl(imageUrl)}
                            alt={`Anh nha vuon ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeShopGalleryImage(index)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                            title="Xoa anh"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-500">
                      Chua co anh nha vuon. Tai anh de tang do tin cay khi khach vao trang shop.
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
                      <span>{uploadingGallery ? 'Dang tai anh...' : (shopGalleryImages.length >= 4 ? 'Da dat gioi han 4 anh' : 'Bam de tai them anh nha vuon')}</span>
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
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="email"
                className="w-full bg-surface border border-white/10 pl-12 pr-4 py-3.5 rounded-2xl focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600 text-sm font-medium"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

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
        </div >
      </div >
    </div >
  );
};

export default Profile;
