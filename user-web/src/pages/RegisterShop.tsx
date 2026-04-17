import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerShop, uploadImages, payShopRegistration, getPricingConfig, type PricingConfig, deletePendingShop } from '../services/api';
import { Store, CheckCircle, ArrowRight, UploadCloud, Image as ImageIcon, Loader2, Facebook, Instagram, Youtube, AlertCircle, X as CloseIcon } from 'lucide-react';
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
  const { shop, refreshShop } = useAuth();

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
  const [cancelling, setCancelling] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [customAlert, setCustomAlert] = useState<{ type: 'error' | 'success', message: string | string[] } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getPricingConfig()
      .then(res => setPricingConfig(res.data))
      .catch(err => console.error('Failed to load pricing config:', err));
  }, []);

  // Manage logo preview URL
  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // Manage gallery preview URLs
  useEffect(() => {
    const urls = galleryFiles.map(file => URL.createObjectURL(file));
    setGalleryPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [galleryFiles]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'shopLogoUrl' | 'shopGalleryImages') => {
    if (!e.target.files || e.target.files.length === 0) return;

    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
    const files = Array.from(e.target.files);
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);

    if (oversized.length > 0) {
      setCustomAlert({
        type: 'error',
        message: `Ảnh "${oversized[0].name}" vượt quá giới hạn 3MB. Vui lòng giảm dung lượng ảnh hoặc chọn ảnh khác.`
      });
      return;
    }

    // Clear error for this field when file selected
    setFieldErrors(prev => ({ ...prev, [field]: false }));

    if (field === 'shopGalleryImages') {
      setGalleryFiles(prev => [...prev, ...files]);
    } else {
      setLogoFile(e.target.files[0]);
    }
    // Reset the input value so the same file can be selected again if removed
    e.target.value = '';
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoFile(null);
  };

  const removeGalleryImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: string[] = [];
    const newFieldErrors: Record<string, boolean> = {};

    if (!formData.shopName.trim()) {
      errors.push("Tên nhà vườn không được để trống.");
      newFieldErrors.shopName = true;
    }
    if (!logoFile) {
      errors.push("Ảnh đại diện nhà vườn (Logo) là bắt buộc.");
      newFieldErrors.shopLogoUrl = true;
    }
    if (galleryFiles.length < 3) {
      errors.push("Vui lòng tải lên ít nhất 3 ảnh chi tiết về nhà vườn.");
      newFieldErrors.shopGalleryImages = true;
    }
    if (!formData.shopLocation.trim()) {
      errors.push("Vui lòng chọn địa chỉ nhà vườn.");
      newFieldErrors.shopLocation = true;
    }
    if (!formData.shopDescription.trim()) {
      errors.push("Mô tả về nhà vườn không được để trống.");
      newFieldErrors.shopDescription = true;
    }
    if (!formData.shopLat || !formData.shopLng) {
      errors.push("Không thể xác định vị trí bản đồ (Lat/Lng). Hãy ghim vị trí hoặc chọn địa chỉ.");
      newFieldErrors.shopLocation = true;
    }

    if (errors.length > 0) {
      setFieldErrors(newFieldErrors);
      setCustomAlert({ type: 'error', message: errors });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setFieldErrors({});
    setCustomAlert(null);
    setLoading(true);
    try {
      let finalLogoUrl = '';
      let finalGalleryImages: string[] = [];

      // Step 1: Upload Images first
      setUploading(true);
      try {
        if (logoFile) {
          const logoResp = await uploadImages([logoFile]);
          if (logoResp.data.urls?.[0]) {
            finalLogoUrl = logoResp.data.urls[0];
          }
        }

        if (galleryFiles.length > 0) {
          const galleryResp = await uploadImages(galleryFiles);
          if (galleryResp.data.urls?.length > 0) {
            finalGalleryImages = galleryResp.data.urls;
          }
        }
      } catch (uploadError: any) {
        console.error("Image upload failed:", uploadError);
        const serverError = uploadError.response?.data?.error || uploadError.message;
        setCustomAlert({
          type: 'error',
          message: serverError ? `Lỗi tải ảnh: ${serverError}` : "Không thể tải ảnh lên. Vui lòng kiểm tra lại kết nối mạng hoặc định dạng ảnh."
        });
        setLoading(false);
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }

      // Step 2: Register Shop with image URLs
      await registerShop({
        shopName: formData.shopName.trim(),
        shopLocation: formData.shopLocation.trim(),
        shopDescription: formData.shopDescription.trim(),
        shopLat: formData.shopLat,
        shopLng: formData.shopLng,
        shopLogoUrl: finalLogoUrl,
        shopGalleryImages: finalGalleryImages,
        shopFacebook: formData.shopFacebook.trim(),
        shopInstagram: formData.shopInstagram.trim(),
        shopYoutube: formData.shopYoutube.trim(),
      });

      // Step 3: Handle Payment
      const payRes = await payShopRegistration();
      if (payRes.data.paymentUrl) {
        window.location.href = payRes.data.paymentUrl;
      } else {
        setSubmitted(true);
      }
    } catch (error: any) {
      console.error("Failed to register shop:", error);
      const serverError = error.response?.data?.error || error.response?.data?.message;
      setCustomAlert({
        type: 'error',
        message: serverError || "Đăng ký không thành công. Bạn hãy thử đăng nhập lại hoặc kiểm tra lại thông tin!"
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleContinuePayment = async () => {
    setCustomAlert(null);
    setPaymentLoading(true);
    try {
      const payRes = await payShopRegistration();
      if (payRes.data.paymentUrl) {
        window.location.href = payRes.data.paymentUrl;
        return;
      }
      setCustomAlert({ type: 'error', message: "Không tạo được link thanh toán. Vui lòng thử lại." });
    } catch (error) {
      console.error("Failed to create shop payment:", error);
      setCustomAlert({ type: 'error', message: "Không tạo được link thanh toán. Vui lòng thử lại." });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!confirm("Bạn có chắc chắn muốn hủy yêu cầu đăng ký này và làm lại từ đầu không? Thông tin shop hiện tại sẽ bị xóa.")) return;

    setCancelling(true);
    try {
      await deletePendingShop();
      await refreshShop();
      setCustomAlert({ type: 'success', message: 'Đã hủy yêu cầu. Bạn có thể đăng ký lại ngay bây giờ.' });
    } catch (error) {
      console.error("Failed to cancel registration:", error);
      setCustomAlert({ type: 'error', message: 'Không thể hủy yêu cầu. Vui lòng thử lại sau.' });
    } finally {
      setCancelling(false);
    }
  };


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
            disabled={paymentLoading || cancelling}
            className="w-full bg-emerald-700 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 transition-all uppercase tracking-wider text-sm mb-4"
          >
            {paymentLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang tạo thanh toán...</>
            ) : (
              <>Tiếp tục thanh toán kích hoạt {pricingConfig?.ownerPolicy?.planTitle ? `- ${pricingConfig.ownerPolicy.planTitle}` : ''} - {formatVnd(pricingConfig?.shopRegistrationPrice || 250000)}</>
            )}
          </button>

          <button
            onClick={handleCancelRegistration}
            disabled={paymentLoading || cancelling}
            className="w-full bg-slate-100 py-4 rounded-2xl font-black text-slate-600 flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-600 disabled:bg-slate-50 disabled:text-slate-300 transition-all uppercase tracking-wider text-[11px]"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hủy yêu cầu và đăng ký lại'}
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

      {customAlert && (
        <div className={`mb-8 p-5 rounded-2xl border flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300 ${customAlert.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
          <div className={`mt-0.5 p-1.5 rounded-lg ${customAlert.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {customAlert.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h4 className="font-black uppercase tracking-widest text-[10px] mb-1 opacity-70">
              {customAlert.type === 'error' ? 'Lỗi' : 'Thành công'}
            </h4>
            <div className="text-sm font-bold leading-relaxed">
              {Array.isArray(customAlert.message) ? (
                <ul className="list-disc list-inside space-y-1">
                  {customAlert.message.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              ) : (
                customAlert.message
              )}
            </div>
          </div>
          <button onClick={() => setCustomAlert(null)} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
            <CloseIcon className="w-5 h-5 opacity-40 hover:opacity-100" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 md:p-12 rounded-4xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tên Nhà Vườn *</label>
          <input
            className={`w-full bg-slate-50 border p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 font-bold ${fieldErrors.shopName ? 'border-red-500 animate-shake' : 'border-slate-200'
              }`}
            placeholder="Ví dụ: Vườn Bonsai Hữu Tình"
            value={formData.shopName}
            onChange={(e) => {
              setFormData({ ...formData, shopName: e.target.value });
              if (fieldErrors.shopName) setFieldErrors(prev => ({ ...prev, shopName: false }));
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ảnh Đại Diện Nhà Vườn *</label>
            <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all bg-slate-50 group ${fieldErrors.shopLogoUrl ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
              }`}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'shopLogoUrl')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              {logoPreview ? (
                <div className="relative mx-auto h-24 w-24 group/preview">
                  <img src={logoPreview} alt="Avatar" className="h-full w-full object-cover rounded-3xl shadow-md border-2 border-white" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all z-20 hover:scale-110 active:scale-90"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tải Ảnh đại diện</span>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">Tối đa 3MB</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ảnh Nhà Vườn (Nhiều ảnh) *</label>
            <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all bg-slate-50 group min-h-[148px] flex items-center justify-center ${fieldErrors.shopGalleryImages ? 'border-red-500 bg-red-50/30' : 'border-slate-200'
              }`}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e, 'shopGalleryImages')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              {galleryPreviews.length > 0 ? (
                <div className="flex flex-wrap gap-3 justify-center relative z-20 p-2">
                  {galleryPreviews.map((url, idx) => (
                    <div key={idx} className="relative group/gal">
                      <img src={url} alt="Shop Gallery" className="h-16 w-16 object-cover rounded-lg shadow-sm border-2 border-white" />
                      <button
                        type="button"
                        onClick={(e) => removeGalleryImage(e, idx)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-rose-600 transition-all opacity-0 group-hover/gal:opacity-100 scale-75 group-hover/gal:scale-100"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
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
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tải lên ảnh mô tả</span>
                  <span className="text-[10px] text-slate-400 font-bold mt-1">Ít nhất 3 ảnh - Tối đa 3MB/ảnh</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 md:col-span-2">
            <div className="pt-2">
              <AddressPicker
                onAddressChange={(addr) => {
                  setFormData(prev => ({ ...prev, shopLocation: addr }));
                  if (fieldErrors.shopLocation) setFieldErrors(prev => ({ ...prev, shopLocation: false }));
                }}
                onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, shopLat: lat, shopLng: lng }))}
                onError={(msg) => setCustomAlert({ type: 'error', message: msg })}
                label="Địa chỉ nhà vườn *"
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
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mô tả về Nhà Vườn *</label>
          <textarea
            rows={4}
            className={`w-full bg-slate-50 border p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-900 font-medium ${fieldErrors.shopDescription ? 'border-red-500 animate-shake' : 'border-slate-200'
              }`}
            placeholder="Chia sẻ về kinh nghiệm, các loại cây thế mạnh của bạn..."
            value={formData.shopDescription}
            onChange={(e) => {
              setFormData({ ...formData, shopDescription: e.target.value });
              if (fieldErrors.shopDescription) setFieldErrors(prev => ({ ...prev, shopDescription: false }));
            }}
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
