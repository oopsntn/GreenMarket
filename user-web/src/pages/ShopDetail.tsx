import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicShop } from '../services/api';
import { ShoppingBag, MapPin, Phone, Info, Loader2, Store, MessageCircle, Map as MapIcon, ExternalLink, ShieldCheck } from 'lucide-react';

const ShopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        if (id) {
          const response = await getPublicShop(id);
          setShop(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch shop:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-500">Không tìm thấy nhà vườn này.</h2>
        <Link to="/" className="mt-4 inline-block text-emerald-500 hover:underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Shop Hero Section */}
      <header className="mb-16">
        <div className="glass p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -z-10" />

          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Shop Avatar/Icon */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-2xl">
              <Store className="w-16 h-16 md:w-20 md:h-20 text-emerald-500" />
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">{shop.shopName}</h1>
                <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                  Nhà Vườn Uy Tín
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 text-slate-400">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Địa chỉ</p>
                    <p className="text-sm font-medium text-slate-200">{shop.shopLocation || 'Chưa cập nhật'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Điện thoại</p>
                      <p className="text-sm font-medium text-slate-200">{shop.shopPhone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  {shop.shopPhone && (
                    <a
                      href={`https://zalo.me/${shop.shopPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
                    >
                      <MessageCircle className="w-4 h-4" /> Zalo
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Info className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trạng thái</p>
                    <p className="text-sm font-medium text-emerald-500 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 inline-block">
                      Đang hoạt động
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-sm text-slate-400 leading-relaxed italic">
                  "{shop.shopDescription || 'Nhà vườn chưa có mô tả chi tiết.'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Left Section: Posts */}
        <section className="flex-1 order-2 lg:order-1 w-full">
          <div className="flex items-baseline gap-4 mb-10">
            <h2 className="text-3xl font-black tracking-tight uppercase">Cây cảnh rao bán</h2>
            <span className="text-slate-500 font-bold">{shop.posts?.length || 0} tin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {shop.posts && shop.posts.length > 0 ? (
              shop.posts.map((post: any) => (
                <Link
                  key={post.postId}
                  to={`/detail/${post.postSlug}`}
                  className="group glass rounded-4xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 border border-white/5 hover:border-emerald-500/30 block"
                >
                  <div className="aspect-square bg-slate-900 overflow-hidden relative">
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={post.images[0].imageUrl.startsWith('http') ? post.images[0].imageUrl : `http://localhost:5000${post.images[0].imageUrl}`}
                        alt={post.postTitle}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-800">
                        <ShoppingBag className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Chi tiết
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold mb-1 group-hover:text-emerald-400 transition-colors line-clamp-2 uppercase tracking-tight">
                      {post.postTitle}
                    </h3>
                    <div className="flex justify-between items-end">
                      <p className="text-emerald-500 font-black text-lg">
                        {Number(post.postPrice).toLocaleString()} <span className="text-[10px] font-medium text-slate-500 ml-1">đ</span>
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-surface rounded-3xl border border-dashed border-white/10 text-slate-500">
                Nhà vườn chưa có bài đăng nào.
              </div>
            )}
          </div>
        </section>

        {/* Right Section: Map Sidebar */}
        <aside className="w-full lg:w-[350px] xl:w-[400px] shrink-0 sticky top-24 order-1 lg:order-2">
          <div className="glass p-6 rounded-4xl border-white/5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <MapIcon className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase">Bản đồ vườn</h2>
            </div>

            <div className="relative aspect-square rounded-3xl border border-white/5 overflow-hidden shadow-2xl bg-slate-900">
              <iframe
                title="Google Maps"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={shop.shopLat && shop.shopLng
                  ? `https://maps.google.com/maps?q=${shop.shopLat},${shop.shopLng}&t=&z=14&ie=UTF8&iwloc=&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(shop.shopLocation || 'Hà Nội')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Địa chỉ</p>
                <p className="text-sm font-bold text-slate-200">{shop.shopLocation || 'Chưa cập nhật'}</p>
              </div>

              <a
                href={shop.shopLat && shop.shopLng
                  ? `https://www.google.com/maps/search/?api=1&query=${shop.shopLat},${shop.shopLng}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.shopLocation || 'Hà Nội')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-3 transition-all group shadow-xl shadow-emerald-900/40"
              >
                <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Nhận chỉ đường
              </a>

              <div className="flex items-center gap-3 text-[10px] text-slate-500 italic bg-white/5 p-3 rounded-xl border border-white/5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                <span>Vị trí ước tính qua Google Maps.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ShopDetail;
