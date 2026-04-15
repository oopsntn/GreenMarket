import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import {
  buyShopVipPackage,
  buyPersonalPackage,
  getPostingPolicy,
  getPromotionPackages,
  getPublicPromotionPackages,
  getShopVipPackage,
  type PromotionPackageItem,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
};

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
  const [vipPackage, setVipPackage] = useState<PromotionPackageItem | null>(null);
  const [vipError, setVipError] = useState<string | null>(null);
  const [vipBuying, setVipBuying] = useState(false);
  const [personalBuying, setPersonalBuying] = useState(false);
  const [personalError, setPersonalError] = useState<string | null>(null);
  const [activePlanCode, setActivePlanCode] = useState<string>('STANDARD');
  const [audience, setAudience] = useState<'guest' | 'individual' | 'garden_owner'>(
    isGardenOwner ? 'garden_owner' : isAuthenticated ? 'individual' : 'guest',
  );

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      setError(null);
      setVipError(null);

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

          try {
            const policyRes = await getPostingPolicy();
            setActivePlanCode(policyRes.data?.policy?.planCode || 'STANDARD');
          } catch {
            console.error('Failed to load posting policy');
          }
        }

        setAudience(detectedAudience);
        setBoostPackages(selectedPackages);

        try {
          const vipRes = await getShopVipPackage();
          setVipPackage(vipRes.data || null);
        } catch (vipPackageError) {
          console.error('Failed to load Shop VIP package:', vipPackageError);
          setVipPackage(null);
          setVipError('Gói Nhà vườn VIP hiện chưa sẵn sàng.');
        }
      } catch (err: any) {
        console.error('Failed to load package catalog:', err);
        setBoostPackages([]);
        setVipPackage(null);
        setError('Không tải được danh sách gói. Vui lòng thử lại.');
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

  const vipMetrics = useMemo(() => {
    if (!vipPackage) return null;

    const durationDays = Math.max(1, toSafeNumber(vipPackage.promotionPackageDurationDays));
    const packagePrice = Math.max(0, toSafeNumber(vipPackage.promotionPackagePrice));
    const costPerDay = Math.round(packagePrice / durationDays);

    return {
      ...vipPackage,
      durationDays,
      packagePrice,
      costPerDay,
    };
  }, [vipPackage]);

  const isVipActive = Boolean(shop?.shopIsVipActive && shop?.shopStatus === 'active');
  const vipExpiresAtLabel = formatDate(shop?.shopVipExpiresAt ?? null);

  const handleBuyVipPackage = async () => {
    setVipBuying(true);
    setVipError(null);

    try {
      const res = await buyShopVipPackage();
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }
      setVipError('Không tạo được link thanh toán gói Nhà vườn VIP.');
    } catch (err: any) {
      console.error('Failed to buy Shop VIP package:', err);
      setVipError(err?.response?.data?.error || 'Không thể tạo thanh toán gói Nhà vườn VIP.');
    } finally {
      setVipBuying(false);
    }
  };

  const handleBuyPersonalPackage = async () => {
    if (!isAuthenticated) return;
    setPersonalBuying(true);
    setPersonalError(null);

    try {
      const res = await buyPersonalPackage();
      if (res.data?.paymentUrl) {
        window.location.href = res.data.paymentUrl;
        return;
      }
      setPersonalError('Không tạo được link thanh toán gói cá nhân.');
    } catch (err: any) {
      console.error('Failed to buy Personal package:', err);
      setPersonalError(err?.response?.data?.error || 'Không thể tạo thanh toán gói cá nhân.');
    } finally {
      setPersonalBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-white border border-emerald-100 rounded-3xl p-7 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">
            Trung tâm gói dịch vụ
          </p>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bảng giá và quyền lợi</h1>
          <p className="text-slate-500 mt-2">
            Xem tổng quan các gói nâng cấp tài khoản và gói đẩy bài trước khi ra quyết định.
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Gói tài khoản</h2>
            <p className="text-xs text-slate-500 mt-1">
              Dùng cho nhu cầu nâng cấp quyền đăng bài và vận hành bán háng
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-lg font-black text-slate-900">Chủ vườn vĩnh viễn</h3>
                {isGardenOwner ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase font-black tracking-wider">
                    Đang sử dụng
                  </span>
                ) : null}
              </div>

              <p className="text-2xl font-black text-emerald-700 mb-1">
                250.000 ₫
              </p>
              <p className="text-sm text-slate-600 mb-4">
                Nâng cấp tài khoản lên chủ vườn, phù hợp người bán chuyên nghiệp.
              </p>

              <ul className="space-y-2 text-sm text-slate-700 mb-5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Đăng bài ngay, không qua chờ duyệt.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Đăng tin lẻ tính phí 20,000 VND/tin.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  Giới hạn tối đa 20 bài/ngày.
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  4 lượt sửa bài miễn phí, sau đó 5,000 VND/lượt.
                </li>
              </ul>

              {isGardenOwner ? (
                <Link
                  to="/owner-dashboard"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Vào dashboard chủ vườn <ArrowRight className="w-4 h-4" />
                </Link>
              ) : isAuthenticated ? (
                <Link
                  to="/register-shop"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Đăng kí mở shop <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                >
                  Đăng nhập để nâng cấp <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </article>

            {!isGardenOwner && (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-black text-slate-900">Cá nhân</h3>
                  {activePlanCode === 'PERSONAL_MONTHLY' ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase font-black tracking-wider">
                      Đang sử dụng
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-200 text-slate-700 uppercase font-black tracking-wider">
                      Theo chu kỳ
                    </span>
                  )}
                </div>

                <p className="text-2xl font-black text-slate-700 mb-1">
                  30.000 ₫ <span className="text-sm font-normal text-slate-500">/ tháng</span>
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Dành cho người chơi cây nhỏ lẻ nhưng đăng bài thường xuyên.
                </p>

                <ul className="space-y-2 text-sm text-slate-700 mb-5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    Đăng bài ngay trong thời gian gói còn hiệu lực.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    Tối đa 20 bài/ngày.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    4 lượt sửa bài miễn phí, sau đó 5,000 VND/lượt.
                  </li>
                </ul>

                {activePlanCode === 'PERSONAL_MONTHLY' ? (
                  <Link
                    to="/my-posts"
                    className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                  >
                    Xem trong trung tâm quản lý <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : isAuthenticated ? (
                  <>
                    <button
                      onClick={handleBuyPersonalPackage}
                      disabled={personalBuying}
                      className="w-full mt-2 inline-flex justify-center items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {personalBuying ? "Đang xử lý..." : "Đăng ký gói"} <ArrowRight className="w-4 h-4" />
                    </button>
                    {personalError && (
                      <p className="mt-2 text-[11px] text-red-600 font-medium">*{personalError}</p>
                    )}
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                  >
                    Đăng nhập để bắt đầu <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </article>
            )}

            <article className="rounded-2xl border border-amber-300 bg-amber-50/60 p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-lg font-black text-slate-900 inline-flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-600" /> Nhà vườn VIP
                </h3>
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-200 text-amber-800 uppercase font-black tracking-wider">
                  3 tháng
                </span>
              </div>

              <p className="text-2xl font-black text-amber-700 mb-1">
                {vipMetrics ? formatVnd(vipMetrics.packagePrice) : '--'}
              </p>
              <p className="text-xs text-slate-600 mb-4">
                {vipMetrics
                  ? `${vipMetrics.durationDays} ngày gia hạn • ${formatVnd(vipMetrics.costPerDay)}/ngày`
                  : 'Đang cập nhật giá gói VIP'}
              </p>

              <ul className="space-y-2 text-sm text-slate-700 mb-4">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  Shop VIP được xếp đầu danh sách nhà vườn.
                </li>
                <li className="flex items-start gap-2">
                  <Crown className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  Hiển thị huy hiệu/nhãn VIP khác biệt trên danh sách shop.
                </li>
              </ul>

              {isVipActive && vipExpiresAtLabel ? (
                <div className="mb-4 rounded-lg border border-amber-300 bg-white/80 px-3 py-2 text-xs font-semibold text-amber-800">
                  VIP đang hoạt động đến {vipExpiresAtLabel}
                </div>
              ) : null}

              {vipError ? <p className="mb-3 text-xs text-rose-600">{vipError}</p> : null}

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-600"
                >
                  Đăng nhập để mua VIP <ArrowRight className="w-4 h-4" />
                </Link>
              ) : !isGardenOwner ? (
                <Link
                  to="/register-shop"
                  className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-600"
                >
                  Mở shop để mua VIP <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleBuyVipPackage}
                  disabled={vipBuying || !vipMetrics}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {vipBuying ? 'Đang tạo thanh toán...' : isVipActive ? 'Gia hạn VIP ngay' : 'Mua gói VIP'}
                </button>
              )}
            </article>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Gói đẩy bài (promotion)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Mua để tăng mức độ ưu tiên hiển thị bài đăng đã duyệt.
              </p>
            </div>
            {isAuthenticated ? (
              <Link
                to="/my-posts"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
              >
                Mua gói cho bài đăng <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-600"
              >
                Đăng nhập để mua gói phù hợp <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="p-5 space-y-5">
            {loading ? (
              <div className="py-8 text-sm text-slate-500">Đang tải danh sách gói...</div>
            ) : error ? (
              <div className="py-8 text-sm text-rose-600">{error}</div>
            ) : packageMetrics.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">Chưa có gói được công bố.</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageMetrics.map((pkg) => {
                    const isRecommended =
                      recommendedPackage?.promotionPackageId === pkg.promotionPackageId;
                    return (
                      <article
                        key={pkg.promotionPackageId}
                        className={`rounded-2xl border p-4 ${isRecommended
                          ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/30'
                          : 'border-slate-200 bg-slate-50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-black text-slate-900">
                            {pkg.promotionPackageTitle || `Gói ${pkg.durationDays} ngày`}
                          </h3>
                          {isRecommended ? (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase font-black tracking-wider">
                              Đề xuất
                            </span>
                          ) : null}
                        </div>

                        <p className="text-2xl font-black text-emerald-700 mb-2">
                          {formatVnd(pkg.packagePrice)}
                        </p>

                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Thời hạn: {pkg.durationDays} ngày</p>
                          <p>Chi phí/ngày: {formatVnd(pkg.costPerDay)}</p>
                          <p>Số bài áp dụng: {pkg.maxPosts > 0 ? `${pkg.maxPosts} bài` : '-'}</p>
                          <p>
                            Quota hiển thị:{' '}
                            {pkg.displayQuota > 0
                              ? `${pkg.displayQuota.toLocaleString('vi-VN')} luot`
                              : '-'}
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
      </div>
    </div>
  );
};

export default Packages;

