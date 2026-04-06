import React, { useState } from 'react';
import { registerShop, uploadImages } from '../services/api';
import { Store, CheckCircle, ArrowRight, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import AddressPicker from '../components/AddressPicker';

const RegisterShop: React.FC = () => {
  const [formData, setFormData] = useState({
    shopName: '',
    shopPhone: '',
    shopLocation: '',
    shopDescription: '',
    shopLogoUrl: '',
    shopCoverUrl: '',
    shopLat: undefined as number | undefined,
    shopLng: undefined as number | undefined
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'shopLogoUrl' | 'shopCoverUrl') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const resp = await uploadImages([e.target.files[0]]);
      if (resp.data.urls && resp.data.urls.length > 0) {
        setFormData(prev => ({ ...prev, [field]: resp.data.urls[0] }));
      }
    } catch (err) {
      alert("Lỗi upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerShop(formData);
      setSubmitted(true);
    } catch (error) {
      console.error("Failed to register shop:", error);
      alert("Đăng ký không thành công. Bạn có thể đã đăng ký shop rồi!");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight uppercase">Mở Nhà Vườn</h1>
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
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Logo Nhà Vườn</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all bg-slate-50 group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e, 'shopLogoUrl')} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              {formData.shopLogoUrl ? (
                <img src={formData.shopLogoUrl.startsWith('http') ? formData.shopLogoUrl : `http://localhost:5000${formData.shopLogoUrl}`} alt="Logo" className="mx-auto h-24 w-24 object-cover rounded-3xl shadow-md border-2 border-white" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tải lên Logo</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ảnh bìa (Cover)</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500/50 transition-all bg-slate-50 group h-[148px] flex items-center justify-center">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => handleFileUpload(e, 'shopCoverUrl')} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={uploading}
              />
              {formData.shopCoverUrl ? (
                <img src={formData.shopCoverUrl.startsWith('http') ? formData.shopCoverUrl : `http://localhost:5000${formData.shopCoverUrl}`} alt="Cover" className="mx-auto h-full w-full object-cover rounded-xl shadow-md border-2 border-white" />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tải lên Ảnh bìa</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Số Điện Thoại Shop</label>
            <input
              type="tel"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-900 font-bold"
              placeholder="09xx xxx xxx"
              value={formData.shopPhone}
              onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
            />
          </div>
          <div className="space-y-4">
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
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang gửi hồ sơ...</>
            ) : uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải ảnh...</>
            ) : (
              <>Gửi Đăng Ký Nhà Vườn</>
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
