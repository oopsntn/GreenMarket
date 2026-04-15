import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerShop, updateShop, uploadImages, payShopRegistration, getPricingConfig, type PricingConfig } from '../services/api';
import { Store, CheckCircle, ArrowRight, UploadCloud, Image as ImageIcon, Loader2, Facebook, Instagram, Youtube } from 'lucide-react';
import AddressPicker from '../components/AddressPicker';
import { useAuth } from '../context/AuthContext';

const formatVnd = (value: number | null | undefined) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const RegisterShop: React.FC = () => {
  const navigate = useNavigate();
  const { shop } = useAuth();

  useEffect(() => {
    if (shop?.shopStatus === 'active') {
      navigate('/home');
    }
  }, [shop, navigate]);

  const [formData, setFormData] = useState({
    shopName: '',
    shopLocation: '',
    shopDescription: '',
    shopLogoUrl: '',
    shopGalleryImages: [] as string[],
    shopLat: undefined as number | undefined,
    shopLng: undefined as number | undefined,
    shopFacebook: '',
    shopInstagram: '',
    shopYoutube: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);

  useEffect(() => {
    getPricingConfig()
      .then(res => setPricingConfig(res.data))
      .catch(err => console.error('Failed to load pricing config:', err));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'shopLogoUrl' | 'shopGalleryImages') => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    if (field === 'shopGalleryImages') {
      const files = Array.from(e.target.files);
      setGalleryFiles(prev => [...prev, ...files]);
    } else {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const registerRes = await registerShop({
        shopName: formData.shopName,
        shopLocation: formData.shopLocation,
        shopDescription: formData.shopDescription,
        shopLat: formData.shopLat,
        shopLng: formData.shopLng,
        shopFacebook: formData.shopFacebook,
        shopInstagram: formData.shopInstagram,
        shopYoutube: formData.shopYoutube,
      });

      const createdShopId = Number(registerRes.data?.shopId);
      const hasImagesToUpload = Boolean(logoFile) || galleryFiles.length > 0;

      if (hasImagesToUpload) {
        if (!Number.isFinite(createdShopId) || createdShopId <= 0) {
          alert("Shop đã tạo nhưng chưa lấy được mã shop để lưu ảnh. Bạn có thể cập nhật ảnh sau trong trang quản lý shop.");
        } else {
          setUploading(true);
          try {
            let finalLogoUrl: string | undefined;
            let finalGalleryImages: string[] = [];

            if (logoFile) {
              const logoResp = await uploadImages([logoFile]);
              if (logoResp.data.urls && logoResp.data.urls.length > 0) {
                finalLogoUrl = logoResp.data.urls[0];
              }
            }

            if (galleryFiles.length > 0) {
              const galleryResp = await uploadImages(galleryFiles);
              if (galleryResp.data.urls && galleryResp.data.urls.length > 0) {
                finalGalleryImages = galleryResp.data.urls;
              }
            }

            if (finalLogoUrl || finalGalleryImages.length > 0) {
              await updateShop(createdShopId, {
                shopLogoUrl: finalLogoUrl,
                shopGalleryImages: finalGalleryImages.length > 0 ? finalGalleryImages : undefined
              });
            }
          } catch (uploadSyncError) {
            console.error("Shop created but image upload/update failed:", uploadSyncError);
            alert("Shop đã tạo thành công nhưng lưu ảnh chưa hoàn tất. Bạn có thể cập nhật ảnh sau trong trang quản lý shop.");
          } finally {
            setUploading(false);
          }
        }
      }

      const payRes = await payShopRegistration();
      if (payRes.data.paymentUrl) {
        window.location.href = payRes.data.paymentUrl;
      } else {
        setSubmitted(true);
      }
    } catch (error) {
      console.error("Failed to register shop:", error);
      alert("Đăng ký không thành công. Bạn có thể đã đăng ký shop rồi hoặc có lỗi xảy ra!");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleContinuePayment = async () => {
    setPaymentLoading(true);
    try {
      const payRes = await payShopRegistration();
      if (payRes.data.paymentUrl) {
        window.location.href = payRes.data.paymentUrl;
        return;
      }
      alert("Không tạo được link thanh toán. Vui lòng thử lại.");
    } catch (error) {
      console.error("Failed to create shop payment:", error);
      alert("Không tạo được link thanh toán. Vui lòng thử lại.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const logoPreview = logoFile ? URL.createObjectURL(logoFile) : null;
  const galleryPreviews = galleryFiles.map(f => URL.createObjectURL(f));

  if (shop && shop.shopStatus !== 'active') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-background">
        <div className="bg-white p-10 rounded-4xl border border-slate-200 text-center max-w-md shadow-xl">
          <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
            <Store className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-black mb-3 text-slate-900 uppercase tracking-tight">Shop đang chờ kích hoạt</h2>
          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Bạn đã tạo hồ sơ shop. Hoàn tất thanh toán để kích hoạt nhà vườn và bắt đầu sử dụng.
          </p>
          <button
            onClick={handleContinuePayment}
            disabled={paymentLoading}
            className="w-full bg-emerald-700 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all uppercase tracking-wider text-sm"
          >
            {paymentLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang tạo thanh toán...</>
            ) : (
              <>Tiếp tục thanh toán kích hoạt {pricingConfig?.ownerPolicy?.planTitle ? `- ${pricingConfig.ownerPolicy.planTitle}` : ''} - {formatVnd(pricingConfig?.shopRegistrationPrice || 250000)}</>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-background">
        <div className="bg-white p-12 rounded-4xl border border-slate-200 text-center max-w-md shadow-2xl shadow-emerald-500/10 transition-all">
          <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black mb-4 text-slate-900 tracking-tight uppercase">Đăng ký thành công!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">
            Hồ sơ nhà vườn của bạn đã được gửi tới Admin. Chúng tôi sẽ thông báo cho bạn ngay khi shop được kích hoạt.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-emerald-700 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200/50 active:scale-95 uppercase tracking-widest text-sm"
          >
            Quay lại Chợ <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 bg-background">
      <div className="mb-12 text-center">
        <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm transition-transform hover:rotate-3">
          <Store className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight uppercase">
          {pricingConfig?.ownerPolicy?.planTitle || 'Mở Nhà Vườn'}
        </h1>
        <p className="text-slate-500 font-medium max-w-lg mx-auto">Trở thành đối tác tin cậy và bắt đầu kinh doanh cây cảnh chuyên nghiệp cùng cộng đồng GreenMarket.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-4xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
        
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tên Nhà Vườn *</label>
          <input
            required
            type="text"
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 font-bold"
            placeholder="Ví dụ: Vườn Bonsai Hữu Tình"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ảnh Đại Diện Nhà Vườn</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all bg-slate-50 group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e, 'shopLogoUrl')} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              {logoPreview ? (
                <img src={logoPreview} alt="Avatar" className="mx-auto h-24 w-24 object-cover rounded-3xl shadow-md border-2 border-white" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tải lên Ảnh đại diện</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ảnh Nhà Vườn (Nhiều ảnh)</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all bg-slate-50 group min-h-[148px] flex items-center justify-center">
              <input 
                type="file" 
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e, 'shopGalleryImages')} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              {galleryPreviews.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {galleryPreviews.map((url, idx) => (
                    <img key={idx} src={url} alt="Shop Gallery" className="h-16 w-16 object-cover rounded-lg shadow-sm border-2 border-white" />
                  ))}
                  <div className="h-16 w-16 flex items-center justify-center bg-white rounded-lg border border-slate-200">
                    <UploadCloud className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tải lên một hoặc nhiều ảnh</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 md:col-span-2">
            <div className="pt-2">
              <AddressPicker
                onAddressChange={(addr) => setFormData(prev => ({ ...prev, shopLocation: addr }))}
                onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, shopLat: lat, shopLng: lng }))}
                label="Địa chỉ nhà vườn"
              />
              {formData.shopLat && formData.shopLng && (
                <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-emerald-700 tracking-widest block mb-1">Vị trí đã xác định</span>
                    <span className="text-xs font-mono text-emerald-600 font-bold">{Number(formData.shopLat).toFixed(6)}, {Number(formData.shopLng).toFixed(6)}</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Facebook className="w-3 h-3 text-[#1877F2]" /> Facebook
            </label>
            <input
              type="url"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-[#1877F2] focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm font-bold"
              placeholder="https://facebook.com/..."
              value={formData.shopFacebook}
              onChange={(e) => setFormData({ ...formData, shopFacebook: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Instagram className="w-3 h-3 text-[#E4405F]" /> Instagram
            </label>
            <input
              type="url"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-[#E4405F] focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm font-bold"
              placeholder="https://instagram.com/..."
              value={formData.shopInstagram}
              onChange={(e) => setFormData({ ...formData, shopInstagram: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Youtube className="w-3 h-3 text-[#FF0000]" /> Youtube
            </label>
            <input
              type="url"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-[#FF0000] focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm font-bold"
              placeholder="https://youtube.com/..."
              value={formData.shopYoutube}
              onChange={(e) => setFormData({ ...formData, shopYoutube: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mô tả về Nhà Vườn</label>
          <textarea
            rows={4}
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-900 font-medium"
            placeholder="Chia sẻ về kinh nghiệm, các loại cây thế mạnh của bạn..."
            value={formData.shopDescription}
            onChange={(e) => setFormData({ ...formData, shopDescription: e.target.value })}
          />
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-emerald-700 py-5 rounded-2xl font-black text-white text-sm uppercase tracking-widest hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-200/50"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải ảnh...</>
            ) : loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi hồ sơ...</>
            ) : (
              <>Đăng ký {pricingConfig?.ownerPolicy?.planTitle || 'Nhà Vườn'} - {formatVnd(pricingConfig?.shopRegistrationPrice || 250000)}</>
            )}
          </button>
          <p className="mt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            * Bằng việc nhấn gửi, bạn đồng ý với Điều khoản và Chính sách của GreenMarket.
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterShop;
