import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllShops } from '../services/api';
import { Store, MapPin, Phone, Loader2, ShieldCheck } from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Danh sách nhà vườn</h1>
        <p className="text-slate-400">Khám phá các nhà vườn đang hoạt động trên GreenMarket.</p>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20 glass rounded-4xl border border-dashed border-white/10 text-slate-500">
          Chưa có nhà vườn nào đang hoạt động.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <Link
                key={shop.shopId}
                to={`/shop/${shop.shopId}`}
                className="group glass p-6 rounded-4xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 block"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                    {shop.shopLogoUrl ? (
                      <img
                        src={shop.shopLogoUrl.startsWith('http') ? shop.shopLogoUrl : `http://localhost:5000${shop.shopLogoUrl}`}
                        alt={shop.shopName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-7 h-7 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {shop.shopName}
                    </h2>
                    <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 flex items-center gap-1 mt-1">
                      <ShieldCheck className="w-3 h-3" /> Đang hoạt động
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-300 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="line-clamp-1">{shop.shopLocation || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{shop.shopPhone || 'Chưa cập nhật SDT'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {shop.shopDescription || 'Nhà vườn chưa cập nhật mô tả.'}
                </p>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-3 rounded-xl bg-surface border border-white/10 text-white font-bold hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Trang truoc
              </button>
              <span className="text-slate-400 font-medium bg-white/5 px-4 py-3 rounded-xl">Trang {page} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-6 py-3 rounded-xl bg-surface border border-white/10 text-white font-bold hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Trang sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ShopList;
