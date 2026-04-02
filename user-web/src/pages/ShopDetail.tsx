import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPublicShop } from '../services/api';
import { ShoppingBag, MapPin, Phone, Info, Loader2, MessageCircle, Map as MapIcon, ExternalLink, ShieldCheck, ZoomIn } from 'lucide-react';
import ImageModal from '../components/ImageModal';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const toMediaUrl = (url?: string | null) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
};

const ShopDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      try {
        if (id) {
          const response = await getPublicShop(id);
          setShop(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch shop:', error);
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

  const shopGalleryImages: string[] = Array.isArray(shop.shopGalleryImages)
    ? shop.shopGalleryImages
    : (shop.shopCoverUrl ? [shop.shopCoverUrl] : []);

  const heroImage = shopGalleryImages[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      <header className="mb-5">
        <div className="glass p-8 md:p-12 rounded-[3.5rem] relative overflow-hidden">
          {heroImage ? (
            <div className="absolute inset-0 -z-10">
              <img src={toMediaUrl(heroImage)} alt="Cover" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>
          ) : (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-[50px] -z-10" />
            </>
          )}

          <div className="z-10 relative grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">{shop.shopName}</h1>
                <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest w-fit mx-auto md:mx-0">
                  Đã xác minh
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-slate-400">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Địa chỉ</p>
                    <p className="text-sm font-medium text-slate-200 line-clamp-1">{shop.shopLocation || 'Chưa cập nhật'}</p>
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
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-8">
                <p className="text-sm text-slate-400 leading-relaxed italic">
                  "{shop.shopDescription || 'Nhà vườn chưa có mô tả chi tiết.'}"
                </p>
              </div>

              {shopGalleryImages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400">Ảnh nhà vườn</h3>
                    <span className="text-xs text-slate-400">{shopGalleryImages.length} ảnh</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {shopGalleryImages.map((imageUrl, index) => (
                      <div
                        key={`${imageUrl}-${index}`}
                        className="aspect-square rounded-2xl overflow-hidden border border-white/10 bg-surface cursor-pointer group/image relative"
                        onClick={() => setPreviewImageIndex(index)}
                      >
                        <img
                          src={toMediaUrl(imageUrl)}
                          alt={`Anh nha vuon ${index + 1}`}
                          className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                          <ZoomIn className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass p-5 rounded-3xl border-white/5 space-y-5 bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <MapIcon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Vị trí nhà vườn</h3>
                </div>

                <div className="relative aspect-4/3 rounded-2xl border border-white/5 overflow-hidden shadow-xl bg-slate-900">
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={shop.shopLat && shop.shopLng
                      ? `https://maps.google.com/maps?q=${shop.shopLat},${shop.shopLng}&t=&z=14&ie=UTF8&iwloc=&output=embed`
                      : `https://maps.google.com/maps?q=${encodeURIComponent(shop.shopLocation || 'Ha Noi')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                    allowFullScreen
                  />
                </div>

                <div className="space-y-4">
                  <a
                    href={shop.shopLat && shop.shopLng
                      ? `https://www.google.com/maps/search/?api=1&query=${shop.shopLat},${shop.shopLng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.shopLocation || 'Ha Noi')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-3 transition-all group shadow-lg shadow-emerald-900/20"
                  >
                    <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    Nhận chỉ đường
                  </a>
                  
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 italic px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                      <span>Vi tri xac minh qua Google Maps</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full">
        <section className="w-full">
          <div className="flex items-baseline gap-4 mb-8">
            <h2 className="text-3xl font-black tracking-tight uppercase">Sản phẩm của vườn</h2>
            <span className="text-slate-500 font-bold">{shop.posts?.length || 0} tin</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {shop.posts && shop.posts.length > 0 ? (
              shop.posts.map((post: any) => (
                <Link
                  key={post.postId}
                  to={`/posts/detail/${post.postSlug}`}
                  className="group glass rounded-4xl overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 border border-white/5 hover:border-emerald-500/30 block"
                >
                  <div className="aspect-square bg-slate-900 overflow-hidden relative">
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={toMediaUrl(post.images[0].imageUrl)}
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
                  <div className="p-5">
                    <div className="mb-2">
                       <h3 className="text-sm font-bold group-hover:text-emerald-400 transition-colors line-clamp-2 uppercase tracking-tight leading-tight">
                        {post.postTitle}
                      </h3>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-emerald-500 font-black text-xl">
                        {Number(post.postPrice).toLocaleString()} <span className="text-[10px] font-medium text-slate-500 ml-0.5">đ</span>
                      </p>
                      <div className="text-[10px] text-slate-500 font-bold px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                        {post.postLocation || 'VN'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-24 bg-surface rounded-[3rem] border border-dashed border-white/10 text-slate-500">
                Nhà vườn chưa có bài đăng nào.
              </div>
            )}
          </div>
        </section>
      </div>

      <ImageModal
        isOpen={previewImageIndex !== null}
        images={shopGalleryImages.map(toMediaUrl)}
        initialIndex={previewImageIndex || 0}
        onClose={() => setPreviewImageIndex(null)}
        alt={shop.shopName}
      />
    </div>
  );
};

export default ShopDetail;
