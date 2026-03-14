import React, { useEffect, useState } from 'react';
import { getMyShop } from '../services/api';
import { Store, Plus, PackageOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyPosts: React.FC = () => {
  const { user } = useAuth();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      if (!user?.id) return;
      try {
        const response = await getMyShop(user.id);
        setShop(response.data);
      } catch (error) {
        console.error("Failed to fetch shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">Quản lý bán hàng</h1>
          <p className="text-slate-400">Danh sách tin đăng và tình trạng kinh doanh của bạn.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-900/40">
          <Plus className="w-5 h-5" /> Đăng tin mới
        </button>
      </div>

      {shop ? (
        <div className="space-y-8">
          {/* Shop Header */}
          <div className="glass p-8 rounded-4xl border-emerald-500/20 shadow-2xl shadow-emerald-500/5 flex flex-col md:flex-row gap-8 items-center bg-linear-to-br from-surface to-background">
             <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500">
               <Store className="w-12 h-12" />
             </div>
             <div className="flex-1 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                 <h2 className="text-3xl font-black">{shop.shopName}</h2>
                 <span className={shop.shopStatus === 'active' ? "bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase" : "bg-amber-500/20 text-amber-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase"}>
                   {shop.shopStatus === 'active' ? 'Đã xác minh' : 'Chờ duyệt'}
                 </span>
               </div>
               <p className="text-slate-400 max-w-xl">{shop.shopDescription || 'Chưa có mô tả nhà vườn.'}</p>
             </div>
             <div className="flex gap-4">
                <div className="text-center px-6">
                   <div className="text-2xl font-bold">0</div>
                   <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Lượt xem</div>
                </div>
                <div className="text-center px-6 border-l border-white/5">
                   <div className="text-2xl font-bold">0</div>
                   <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Tin rao</div>
                </div>
             </div>
          </div>

          {/* Posts List Placeholder */}
          <div className="text-center py-24 glass rounded-4xl border-dashed border-white/10">
            <PackageOpen className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-bold mb-2">Bạn chưa có tin đăng nào</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Hãy bắt đầu rao bán những mẫu cây cảnh tuyệt vời của bạn ngay bây giờ!</p>
            <button className="text-emerald-500 font-bold hover:underline">Hướng dẫn đăng tin</button>
          </div>
        </div>
      ) : (
        <div className="glass p-12 rounded-4xl text-center border-amber-500/20">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Bạn chưa có Nhà Vườn</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">Để có thể đăng tin kinh doanh và quản lý sản phẩm chuyên nghiệp, vui lòng đăng ký hồ sơ nhà vườn trước.</p>
          <button 
            onClick={() => window.location.href = '/register-shop'}
            className="bg-emerald-600/10 text-emerald-500 px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all underline decoration-emerald-500/30 underline-offset-8"
          >
            Đăng ký Nhà Vườn ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default MyPosts;
