import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react';
import {
  getPromotionPackages,
  getPublicPromotionPackages,
  type PromotionPackageItem,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortPackages = (packages: PromotionPackageItem[]) =>
  [...packages].sort((a, b) => {
    const durationDiff =
      toSafeNumber(a.promotionPackageDurationDays) -
      toSafeNumber(b.promotionPackageDurationDays);
    if (durationDiff !== 0) return durationDiff;
    return toSafeNumber(a.promotionPackagePrice) - toSafeNumber(b.promotionPackagePrice);
  });

const Packages: React.FC = () => {
  const { isAuthenticated, shop } = useAuth();
  const isGardenOwner = shop?.shopStatus === 'active';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boostPackages, setBoostPackages] = useState<PromotionPackageItem[]>([]);
  const [audience, setAudience] = useState<'guest' | 'individual' | 'garden_owner'>(
    isGardenOwner ? 'garden_owner' : isAuthenticated ? 'individual' : 'guest',
  );

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      setError(null);

      try {
        const publicRes = await getPublicPromotionPackages();
        let selectedPackages = sortPackages((publicRes.data || []) as PromotionPackageItem[]);
        let detectedAudience: 'guest' | 'individual' | 'garden_owner' =
          isAuthenticated ? 'individual' : 'guest';

        if (isAuthenticated) {
          try {
            const eligibleRes = await getPromotionPackages();
            const payload = eligibleRes.data;
            detectedAudience = payload?.audience === 'garden_owner' ? 'garden_owner' : 'individual';
            if (payload?.audience === 'garden_owner' && Array.isArray(payload.packages)) {
              selectedPackages = sortPackages(payload.packages);
            }
          } catch {
            detectedAudience = isGardenOwner ? 'garden_owner' : 'individual';
          }
        }

        setAudience(detectedAudience);
        setBoostPackages(selectedPackages);
      } catch (err: any) {
        console.error('Failed to load package catalog:', err);
        setBoostPackages([]);
        setError('Khong tai duoc danh sach goi. Vui long thu lai.');
      } finally {
        setLoading(false);
      }
    };

    void loadPackages();
  }, [isAuthenticated, isGardenOwner]);

  const packageMetrics = useMemo(() => {
    return boostPackages.map((pkg) => {
      const durationDays = Math.max(1, toSafeNumber(pkg.promotionPackageDurationDays));
      const packagePrice = Math.max(0, toSafeNumber(pkg.promotionPackagePrice));
      const costPerDay = Math.round(packagePrice / durationDays);
      const maxPosts = toSafeNumber(pkg.promotionPackageMaxPosts);
      const displayQuota = toSafeNumber(pkg.promotionPackageDisplayQuota);

      return {
        ...pkg,
        durationDays,
        packagePrice,
        costPerDay,
        maxPosts,
        displayQuota,
      };
    });
  }, [boostPackages]);

  const recommendedPackage = useMemo(() => {
    return packageMetrics.reduce<(typeof packageMetrics)[number] | null>((best, current) => {
      if (!best) return current;
      if (current.costPerDay < best.costPerDay) return current;
      if (current.costPerDay === best.costPerDay && current.durationDays > best.durationDays) {
        return current;
      }
      return best;
    }, null);
  }, [packageMetrics]);

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-white border border-emerald-100 rounded-3xl p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">
            Trung tam goi dich vu
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Bang gia va quyen loi
          </h1>
          <p className="text-slate-500 mt-2">
            Xem tong quan cac goi nang cap tai khoan va goi day bai truoc khi ra quyet dinh.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Goi tai khoan
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Dung cho nhu cau nang cap quyen dang bai va van hanh ban hang.
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-lg font-black text-slate-900">Chu vuon vinh vien</h3>
                {isGardenOwner ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase font-black tracking-wider">
                    Dang su dung
                  </span>
                ) : null}
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Nang cap tai khoan len chu vuon, phu hop nguoi ban chuyen nghiep.
              </p>

              <ul className="space-y-2 text-sm text-slate-700 mb-5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Dang bai ngay, khong qua cho duyet.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Dang tin le tinh phi 20,000 VND/tin.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Gioi han toi da 20 bai/ngay.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  4 luot sua bai mien phi, sau do 5,000 VND/luot.
                </li>
              </ul>

              {isGardenOwner ? (
                <Link
                  to="/owner-dashboard"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Vao dashboard chu vuon <ArrowRight className="w-4 h-4" />
                </Link>
              ) : isAuthenticated ? (
                <Link
                  to="/register-shop"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Dang ky mo shop <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Dang nhap de nang cap <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-lg font-black text-slate-900">Ca nhan theo thang</h3>
                <span className="text-[10px] px-2 py-1 rounded-full bg-slate-200 text-slate-700 uppercase font-black tracking-wider">
                  Theo chu ky
                </span>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                Danh cho nguoi choi cay nho le nhung dang bai thuong xuyen.
              </p>

              <ul className="space-y-2 text-sm text-slate-700 mb-5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Dang bai ngay trong thoi gian goi con hieu luc.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Toi da 20 bai/ngay.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  4 luot sua bai mien phi, sau do 5,000 VND/luot.
                </li>
              </ul>

              {isAuthenticated ? (
                <Link
                  to="/my-posts"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Xem trong trung tam quan ly <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Dang nhap de bat dau <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </article>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Goi day bai (promotion)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mua de tang muc do uu tien hien thi bai dang da duyet.
              </p>
            </div>
            {audience === 'garden_owner' ? (
              <Link
                to="/my-posts"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
              >
                Mua goi cho bai dang <ArrowRight className="w-4 h-4" />
              </Link>
            ) : isAuthenticated ? (
              <Link
                to="/register-shop"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
              >
                Mo shop de mua goi day bai <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
              >
                Dang nhap de mo khoa goi phu hop <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="p-5 space-y-5">
            {loading ? (
              <div className="py-8 text-sm text-slate-500">Dang tai danh sach goi...</div>
            ) : error ? (
              <div className="py-8 text-sm text-rose-600">{error}</div>
            ) : packageMetrics.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">Chua co goi duoc cong bo.</div>
            ) : (
              <>
                {audience !== 'garden_owner' ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Goi day bai chi mo khoa mua cho tai khoan chu vuon da active.
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {packageMetrics.map((pkg) => {
                    const isRecommended =
                      recommendedPackage?.promotionPackageId === pkg.promotionPackageId;
                    return (
                      <article
                        key={pkg.promotionPackageId}
                        className={`rounded-2xl border p-4 ${
                          isRecommended
                            ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/30'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-black text-slate-900">
                            {pkg.promotionPackageTitle || `Goi ${pkg.durationDays} ngay`}
                          </h3>
                          {isRecommended ? (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase font-black tracking-wider">
                              De xuat
                            </span>
                          ) : null}
                        </div>

                        <p className="text-2xl font-black text-emerald-700 mb-2">
                          {formatVnd(pkg.packagePrice)}
                        </p>

                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Thoi han: {pkg.durationDays} ngay</p>
                          <p>Chi phi/ngay: {formatVnd(pkg.costPerDay)}</p>
                          <p>So bai ap dung: {pkg.maxPosts > 0 ? `${pkg.maxPosts} bai` : '-'}</p>
                          <p>
                            Quota hien thi:{' '}
                            {pkg.displayQuota > 0 ? `${pkg.displayQuota.toLocaleString('vi-VN')} luot` : '-'}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <article className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <Store className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-wider">Nang cap tai khoan</p>
            </div>
            <p className="text-sm text-slate-600">
              Goi tai khoan phu hop neu ban muon mo rong quyen dang bai va van hanh lau dai.
            </p>
          </article>
          <article className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <Sparkles className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-wider">Day bai theo muc tieu</p>
            </div>
            <p className="text-sm text-slate-600">
              Chon goi theo chi phi/ngay va thoi han de toi uu ngan sach.
            </p>
          </article>
          <article className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-emerald-700 mb-2">
              <Wallet className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-wider">Ra quyet dinh de dang</p>
            </div>
            <p className="text-sm text-slate-600">
              Tat ca goi duoc gom ve mot cho de user moi cung nhin thay ngay.
            </p>
          </article>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Lo trinh su dung de xuat
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                1) Xem goi tai khoan, 2) Mo shop/hoan tat profile, 3) Dang bai, 4) Mua goi day bai khi can tang tiep can.
              </p>
            </div>
          </div>
          <Link
            to={isAuthenticated ? '/my-posts' : '/login'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-bold"
          >
            Bat dau ngay <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default Packages;
