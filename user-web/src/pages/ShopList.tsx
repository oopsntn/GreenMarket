import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllShops } from '../services/api';
import { Store, MapPin, Phone, Loader2, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const ShopList: React.FC = () => {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true);
      try {
        const res = await getAllShops({ page, limit: 12 });
        setShops(res.data?.data || []);
        setTotalPages(res.data?.meta?.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch shops:', error);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [page]);

  const toMediaUrl = (url?: string | null) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải danh sách nhà vườn...</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-background">
      {/* <div className="mb-14 text-center">
        <div className="bg-emerald-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm transition-transform hover:rotate-3">
          <Store className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-4xl md:text-xl font-extrabold tracking-tight mb-4 text-slate-900 uppercase">Danh sách nhà vườn</h1>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">Khám phá và kết nối với các nhà vườn uy tín, chuyên cung cấp cây cảnh nghệ thuật trên toàn quốc.</p>
      </div> */}

      {shops.length === 0 ? (
        <div className="text-center py-24 bg-white border border-slate-200 rounded-4xl shadow-sm border-dashed">
          <Store className="w-16 h-16 text-slate-200 mx-auto mb-6" />
          <h3 className="text-xl font-black mb-2 text-slate-900 tracking-tight uppercase">Chưa có nhà vườn nào</h3>
          <p className="text-slate-500 max-w-xs mx-auto font-medium">Hiện tại chưa có nhà vườn nào hoạt động trên hệ thống của chúng tôi.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {shops.map((shop) => (
              <Link
                key={shop.shopId}
                to={`/shop/${shop.shopId}`}
                className="group bg-white p-8 rounded-4xl border border-slate-200 hover:border-emerald-500/30 transition-all duration-300 block shadow-sm hover:shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                    {(shop.shopPreviewImageUrl || shop.shopGalleryImages?.[0] || shop.shopLogoUrl) ? (
                      <img
                        src={toMediaUrl(shop.shopPreviewImageUrl || shop.shopGalleryImages?.[0] || shop.shopLogoUrl)}
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-10 h-10 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors uppercase tracking-tight leading-tight mb-2">
                      {shop.shopName}
                    </h2>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] uppercase font-black tracking-widest border border-emerald-100 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" /> Xác minh
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-emerald-100">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span className="font-medium line-clamp-1">{shop.shopLocation || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span className="font-bold">{shop.shopPhone || 'Chưa cập nhật SDT'}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed font-normal italic">
                  {shop.shopDescription || 'Nhà vườn chưa cập nhật đầy đủ mô tả chi tiết sản phẩm.'}
                </p>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-16 font-black uppercase text-xs tracking-widest">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="px-6 py-2 bg-white text-emerald-700 rounded-xl shadow-sm border border-slate-100">
                  Trang {page} <span className="text-slate-300 font-medium">/</span> {totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShopList;
