import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPromotionPackages, buyPromotionPackage } from '../services/api';
import { Zap, Clock, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const Packages: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const postId = searchParams.get('postId');

  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await getPromotionPackages();
        setPackages(res.data);
      } catch (err) {
        console.error('Failed to load packages', err);
        setError('Không thể tải danh sách gói. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleBuy = async (packageId: number) => {
    if (!postId) {
      alert('Vui lòng chọn bài viết cần quảng bá trước.');
      navigate('/my-posts');
      return;
    }

    setBuyingId(packageId);
    try {
      const res = await buyPromotionPackage(postId, packageId);
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      } else {
        alert('Không nhận được URL thanh toán từ hệ thống.');
      }
    } catch (err: any) {
      console.error('Failed to create payment', err);
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi tạo giao dịch thanh toán.');
    } finally {
      setBuyingId(null);
    }
  };

  const getPlanType = (days: number) => {
    if (days <= 3) {
      return {
        label: 'Goi Ngay',
        subtitle: 'Thu nghiem nhanh cho bai moi',
      };
    }
    if (days <= 14) {
      return {
        label: 'Goi Tuan',
        subtitle: 'Phu hop chu ky can nhac cua nguoi mua',
      };
    }
    return {
      label: 'Goi Thang',
      subtitle: 'Duy tri hien dien on dinh, ben vung',
    };
  };

  const displayPackages = useMemo(() => {
    const sorted = [...packages].sort(
      (a, b) => Number(a.promotionPackageDurationDays || 0) - Number(b.promotionPackageDurationDays || 0)
    );

    const pickClosest = (target: number, filter: (days: number) => boolean) => {
      const filtered = sorted.filter((pkg) => filter(Number(pkg.promotionPackageDurationDays || 0)));
      if (filtered.length === 0) return null;

      return filtered.reduce((best, current) => {
        const bestDiff = Math.abs(Number(best.promotionPackageDurationDays || 0) - target);
        const currentDiff = Math.abs(Number(current.promotionPackageDurationDays || 0) - target);
        return currentDiff < bestDiff ? current : best;
      });
    };

    return [
      pickClosest(1, (days) => days <= 3),
      pickClosest(7, (days) => days > 3 && days <= 14),
      pickClosest(30, (days) => days > 14),
    ].filter(Boolean);
  }, [packages]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-medium">Dang tai cac goi uu dai...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
          Uu tien <span className="text-emerald-500">Hien thi</span> Bai dang
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
          Tat ca goi deu cung mot co che uu tien hien thi. Khac nhau o thoi han: ngay, tuan, thang.
        </p>
      </div>

      {!postId && (
        <div className="mb-12 glass p-6 rounded-3xl border-amber-500/20 bg-amber-500/5 flex items-center gap-4 max-w-2xl mx-auto">
          <AlertCircle className="w-8 h-8 text-amber-500 shrink-0" />
          <div>
            <p className="text-amber-500 font-bold mb-1">Ban chua chon bai viet</p>
            <p className="text-slate-400 text-sm">
              Vui long quay lai{' '}
              <button onClick={() => navigate('/my-posts')} className="text-emerald-400 underline decoration-emerald-500/30">
                Quan ly bai dang
              </button>{' '}
              va nhan "Quang ba" de chon bai viet can day uu tien.
            </p>
          </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-20 glass rounded-4xl border-rose-500/20 text-rose-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayPackages.map((pkg: any) => {
            const plan = getPlanType(Number(pkg.promotionPackageDurationDays || 0));

            return (
              <div key={pkg.promotionPackageId} className="glass p-8 rounded-4xl border-white/5 hover:border-emerald-500/30 transition-all duration-500 group relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Zap className="w-6 h-6 fill-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">{plan.label}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Uu tien hien thi
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-4">{plan.subtitle}</p>

                <div className="mb-8">
                  <div className="text-4xl font-black text-white mb-2">
                    {Number(pkg.promotionPackagePrice).toLocaleString()}
                    <span className="text-lg text-slate-500 ml-1 font-medium">VND</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <Clock className="w-4 h-4" /> Thoi han: {pkg.promotionPackageDurationDays} ngay
                  </div>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Bai dang duoc uu tien hien thi trong <strong>{pkg.promotionPackageDurationDays} ngay</strong></span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Co che cong bang: tat ca goi deu cung cach sap xep uu tien</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-slate-300">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Do hieu qua qua luot xem va luot bam lay SDT/Zalo tren bai dang</span>
                  </li>
                </ul>

                <button
                  disabled={buyingId !== null || !postId}
                  onClick={() => handleBuy(pkg.promotionPackageId)}
                  className={`w-full py-4 rounded-2x border font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${!postId
                      ? 'border-white/5 bg-white/5 text-slate-600 cursor-not-allowed'
                      : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 active:scale-95'
                    }`}
                >
                  {buyingId === pkg.promotionPackageId ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Mua ngay <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-20 text-center">
        <p className="text-slate-500 text-sm font-medium mb-4">Moi giao dich thanh toan deu duoc thuc hien an toan qua</p>
        <div className="flex justify-center items-center gap-8 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-default">
          <img src="https://sandbox.vnpayment.vn/paymentv2/Images/brands/logo-vnpay.png" alt="VNPay" className="h-8 object-contain" />
          <div className="h-6 w-px bg-white/10"></div>
          <span className="text-white font-black italic text-xl tracking-tighter">GreenMarket Pay</span>
        </div>
      </div>
    </div>
  );
};

export default Packages;
