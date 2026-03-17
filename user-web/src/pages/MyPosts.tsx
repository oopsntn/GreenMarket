import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyShop, getMyPosts } from '../services/api';
import { Store, Plus, PackageOpen, AlertCircle, Clock, CheckCircle2, XCircle, MapPin, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyPosts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shop, setShop] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      try {
        const [shopRes, postsRes] = await Promise.all([
          getMyShop(user.id).catch(() => ({ data: null })),
          getMyPosts(user.id)
        ]);
        setShop(shopRes.data);
        setPosts(postsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-amber-500/20"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case 'approved':
        return <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>;
      case 'rejected':
        return <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-rose-500/20"><XCircle className="w-3 h-3" /> Bị từ chối</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase border border-slate-500/20">{status}</span>;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-full"></div>
        <div className="text-slate-500 font-medium">Đang tải dữ liệu...</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Quản lý bài đăng</h1>
          <p className="text-slate-400">Xem lại tình trạng và quản lý các sản phẩm của bạn trên GreenMarket.</p>
        </div>
        <button 
          onClick={() => navigate('/create-post')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-900/40"
        >
          <Plus className="w-5 h-5" /> Đăng tin mới
        </button>
      </div>

      <div className="space-y-12">
        {/* Shop Header Section (Only if exists) */}
        {shop && (
          <div className="glass p-8 rounded-4xl border-emerald-500/20 shadow-2xl shadow-emerald-500/5 flex flex-col md:flex-row gap-8 items-center bg-linear-to-br from-surface to-background">
             <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500">
               <Store className="w-12 h-12" />
             </div>
             <div className="flex-1 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                 <h2 className="text-3xl font-black">{shop.shopName}</h2>
                 <span className={shop.shopStatus === 'active' ? "bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase" : "bg-amber-500/20 text-amber-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase"}>
                   {shop.shopStatus === 'active' ? 'Nhà vườn đã xác minh' : 'Đang chờ xác minh'}
                 </span>
               </div>
               <p className="text-slate-400 max-w-xl line-clamp-2">{shop.shopDescription || 'Chưa có mô tả nhà vườn.'}</p>
             </div>
             <div className="flex gap-8">
                <div className="text-center">
                   <div className="text-3xl font-black text-emerald-500">0</div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lượt xem</div>
                </div>
                <div className="text-center">
                   <div className="text-3xl font-black text-white">{posts.length}</div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tin rao</div>
                </div>
             </div>
          </div>
        )}

        {/* Posts List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            Danh sách bài đăng của bạn
            <span className="text-sm font-normal text-slate-500 bg-white/5 px-3 py-1 rounded-full">{posts.length} bài</span>
          </h2>
          
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post) => (
                <div key={post.postId} className="glass p-4 rounded-3xl border-white/5 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row items-center gap-6 group">
                  <div className="w-full sm:w-32 h-32 bg-white/5 rounded-2xl overflow-hidden shrink-0 relative">
                    {/* Just a placeholder icon since we don't fetch images here yet or keep it simple */}
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <PackageOpen className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold truncate group-hover:text-emerald-400 transition-colors uppercase">{post.postTitle}</h3>
                      <div className="flex justify-center sm:justify-start">
                        {getStatusBadge(post.postStatus)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1.5 font-bold text-lg text-emerald-500">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.postPrice)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {post.postLocation || 'Chưa cập nhật vị trí'}
                      </div>
                      <div className="text-slate-600">
                        Cập nhật: {new Date(post.postUpdatedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {post.postStatus === 'rejected' && post.postRejectedReason && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs text-left">
                        <strong>Lý do từ chối:</strong> {post.postRejectedReason}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => navigate(`/posts/detail/${post.postSlug}`)}
                    className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-emerald-500 transition-all group-hover:translate-x-1"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 glass rounded-4xl border-dashed border-white/10">
              <PackageOpen className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-2">Bạn chưa có tin đăng nào</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Hãy bắt đầu rao bán những mẫu cây cảnh tuyệt vời của bạn ngay bây giờ!</p>
              <button 
                onClick={() => navigate('/create-post')}
                className="bg-emerald-600/10 text-emerald-500 px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all underline decoration-emerald-500/30 underline-offset-8"
              >
                Tạo bài đăng đầu tiên
              </button>
            </div>
          )}
        </div>

        {/* Individual User w/o Shop Warning */}
        {!shop && (
          <div className="glass p-8 rounded-4xl border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold mb-2">Tối ưu hiệu quả bán hàng với Nhà Vườn</h2>
                <p className="text-slate-400 mb-4">Bạn đang đăng tin với tư cách cá nhân. Để xây dựng thương hiệu, tăng uy tín và tiếp cận nhiều khách hàng hơn, hãy đăng ký hồ sơ Nhà Vườn ngay.</p>
                <button 
                  onClick={() => navigate('/register-shop')}
                  className="text-amber-500 font-bold hover:underline"
                >
                  Đăng ký Nhà Vườn →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPosts;
