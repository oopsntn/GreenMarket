import React, { useState } from 'react';
import { registerShop } from '../services/api';
import { Store, CheckCircle, ArrowRight } from 'lucide-react';

const RegisterShop: React.FC = () => {
  const [formData, setFormData] = useState({
    userId: 1, // Placeholder for logged in user
    shopName: '',
    shopPhone: '',
    shopLocation: '',
    shopDescription: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="glass p-12 rounded-3xl text-center max-w-md">
          <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Gửi đăng ký thành công!</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Hồ sơ nhà vườn của bạn đã được gửi tới Admin. Chúng tôi sẽ thông báo cho bạn ngay khi shop được kích hoạt.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-emerald-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all"
          >
            Quay lại Chợ <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-12 text-center">
        <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Mở Nhà Vườn</h1>
        <p className="text-slate-400">Trở thành đối tác tin cậy và bắt đầu kinh doanh cây cảnh cùng GreenMarket.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Tên Nhà Vườn *</label>
          <input 
            required
            type="text"
            className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
            placeholder="Ví dụ: Vườn Bonsai Hữu Tình"
            value={formData.shopName}
            onChange={(e) => setFormData({...formData, shopName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Số Điện Thoại Shop</label>
            <input 
              type="tel"
              className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
              placeholder="09xx xxx xxx"
              value={formData.shopPhone}
              onChange={(e) => setFormData({...formData, shopPhone: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Địa chỉ / Khu vực</label>
            <input 
              type="text"
              className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
              placeholder="Hà Nội, Nam Định..."
              value={formData.shopLocation}
              onChange={(e) => setFormData({...formData, shopLocation: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Mô tả về Nhà Vườn</label>
          <textarea 
            rows={4}
            className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
            placeholder="Chia sẻ về kinh nghiệm, các loại cây thế mạnh của bạn..."
            value={formData.shopDescription}
            onChange={(e) => setFormData({...formData, shopDescription: e.target.value})}
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-500 disabled:bg-slate-700 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {loading ? "Đang gửi..." : "Gửi Đăng Ký"}
          </button>
          <p className="mt-4 text-center text-xs text-slate-500">
            * Bằng việc nhấn gửi, bạn đồng ý với Điều khoản và Chính sách của GreenMarket.
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterShop;
