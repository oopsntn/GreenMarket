import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock3,
  Eye,
  FileText,
  Phone,
  ShieldAlert,
  Sparkles,
  Wallet,
  Users,
  UserPlus,
  MessageSquare,
  Search
} from 'lucide-react';
import {
  getOwnerDashboard,
  getPromotionPackages,
  type OwnerDashboardResponse,
  type PromotionPackageItem,
} from '../services/api';

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('vi-VN');
};

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPaymentBadgeClass = (status: string | null) => {
  switch (status) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'failed':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
};

const OwnerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OwnerDashboardResponse | null>(null);
  const [error, setError] = useState<{ code?: string; message: string } | null>(
    null,
  );
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packages, setPackages] = useState<PromotionPackageItem[]>([]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getOwnerDashboard();
      setData(res.data);
    } catch (err: any) {
      const responseData = err?.response?.data;
      setError({
        code: responseData?.code,
        message:
          responseData?.error ||
          'Không tải được bảng điều khiển. Vui lòng thử lại',
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    setPackagesLoading(true);
    try {
      const res = await getPromotionPackages();
      const payload = res.data;

      if (payload?.audience !== 'garden_owner') {
        setPackages([]);
        return;
      }

      const sorted = [...(payload.packages || [])].sort((a, b) => {
        const durationDiff =
          toSafeNumber(a.promotionPackageDurationDays) -
          toSafeNumber(b.promotionPackageDurationDays);
        if (durationDiff !== 0) return durationDiff;
        return (
          toSafeNumber(a.promotionPackagePrice) -
          toSafeNumber(b.promotionPackagePrice)
        );
      });

      setPackages(sorted);
    } catch {
      setPackages([]);
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
    void loadPackages();
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];
    const summary = data.summary;
    const postContactRate = Number(
      summary.postContactRate ?? summary.contactRate ?? 0,
    );
    const totalBoostPackageSpend = Number(
      summary.totalBoostPackageSpend ?? summary.totalPromotionSpend ?? 0,
    );
    const successfulBoostPurchases = Number(
      summary.successfulBoostPurchases ?? summary.successfulPayments ?? 0,
    );
    const boostedPostsActive = Number(
      summary.boostedPostsActive ?? summary.activePromotions ?? 0,
    );

    return [
      {
        icon: <FileText className="w-5 h-5 text-emerald-600" />,
        label: 'Tổng tin đăng',
        value: summary.totalPosts.toLocaleString('vi-VN'),
      },
      {
        icon: <Eye className="w-5 h-5 text-sky-600" />,
        label: 'Lượt xem bài đăng',
        value: summary.totalViews.toLocaleString('vi-VN'),
      },
      {
        icon: <Phone className="w-5 h-5 text-violet-600" />,
        label: 'Lượt mở liên hệ bài',
        value: summary.totalContacts.toLocaleString('vi-VN'),
      },
      {
        icon: <Eye className="w-5 h-5 text-cyan-600" />,
        label: 'Lượt xem trang nhà vườn',
        value: summary.totalShopViews.toLocaleString('vi-VN'),
      },
      {
        icon: <Phone className="w-5 h-5 text-indigo-600" />,
        label: 'Lượt bấm SĐT/Zalo shop',
        value: summary.totalShopContactClicks.toLocaleString('vi-VN'),
      },
      {
        icon: <Activity className="w-5 h-5 text-orange-600" />,
        label: 'Tỷ lệ mở liên hệ bài',
        value: `${postContactRate.toFixed(2)}%`,
      },
      {
        icon: <Wallet className="w-5 h-5 text-emerald-700" />,
        label: 'Tổng tiền mua gói đẩy bài',
        value: formatVnd(totalBoostPackageSpend),
      },
      {
        icon: <Sparkles className="w-5 h-5 text-indigo-600" />,
        label: 'Giao dịch mua gói thành công',
        value: successfulBoostPurchases.toLocaleString('vi-VN'),
      },
      {
        icon: <BarChart3 className="w-5 h-5 text-emerald-700" />,
        label: 'Bài đang được đẩy',
        value: boostedPostsActive.toLocaleString('vi-VN'),
      },
      {
        icon: <UserPlus className="w-5 h-5 text-emerald-600" />,
        label: 'Bài CTV chờ duyệt',
        value: (summary.pendingCollaboratorPosts ?? 0).toLocaleString('vi-VN'),
      },
    ];
  }, [data]);

  const packageMetrics = useMemo(() => {
    return packages.map((pkg) => {
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
  }, [packages]);

  const recommendedPackage = useMemo(() => {
    return packageMetrics.reduce<(typeof packageMetrics)[number] | null>(
      (best, current) => {
        if (!best) return current;
        if (current.costPerDay < best.costPerDay) return current;
        if (
          current.costPerDay === best.costPerDay &&
          current.durationDays > best.durationDays
        ) {
          return current;
        }
        return best;
      },
      null,
    );
  }, [packageMetrics]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-11 h-11 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">
            Đang tải bảng điều khiển...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    const isPermissionError =
      error?.code === 'SHOP_NOT_ACTIVE' || error?.code === 'SHOP_NOT_FOUND';

    return (
      <div className="min-h-screen bg-background py-14 px-4">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">
            Không thể truy cập bảng điều khiển
          </h1>
          <p className="text-slate-600 mb-7">
            {error?.message || 'Đã có lỗi xảy ra khi tải dữ liệu bảng điều khiển.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isPermissionError ? (
              <Link
                to="/register-shop"
                className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm"
              >
                Mở/Nâng cấp nhà vườn
              </Link>
            ) : (
              <button
                onClick={() => void loadDashboard()}
                className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm"
              >
                Thử tải lại
              </button>
            )}
            <Link
              to="/my-posts"
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50"
            >
              Về trang quản lý
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const summary = data.summary;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-white border border-emerald-100 rounded-3xl p-7 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">
                Bảng điều khiển của tôi
              </p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {data.shop.shopName || 'Nhà vườn'}
              </h1>
              <p className="text-slate-500 mt-2">
                Theo dõi hiệu quả đăng tin và lịch sử mua gói đẩy bài để tăng tiếp cận.
              </p>
            </div>
            <Link
              to="/my-posts"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm self-start md:self-auto"
            >
              Quản lý bài đăng <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="bg-white border border-emerald-100 rounded-3xl p-7 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Hợp tác & Đội ngũ</h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Mở rộng sức mạnh quảng bá cho vườn của bạn.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/owner-dashboard/team"
              className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <Users className="w-6 h-6 text-emerald-600" />
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-black text-slate-900 mb-1">Quản lý đội ngũ</h3>
              <p className="text-xs text-slate-500 font-medium">Danh sách CTV đã được bạn uỷ quyền đăng bài.</p>
            </Link>

            <Link
              to="/collaborator/directory"
              className="group p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/30 transition-all shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <Search className="w-6 h-6 text-emerald-600" />
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-black text-slate-900 mb-1">Danh sách CTV</h3>
              <p className="text-xs text-slate-500 font-medium">Tìm kiếm và mời thêm những cộng tác viên phù hợp.</p>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {cards.map((card) => (
            <article
              key={card.label}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">{card.icon}</div>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900 break-words">
                {card.value}
              </p>
            </article>
          ))}
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Gói hiện có
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                So sánh nhanh giá, thời hạn và quota để chọn gói phù hợp.
              </p>
            </div>
            <Link
              to="/packages"
              className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-600"
            >
              Xem bảng giá chi tiết <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="p-5 space-y-5">
            {packagesLoading ? (
              <div className="py-8 text-sm text-slate-500">
                Đang tải danh sách gói...
              </div>
            ) : packageMetrics.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">
                Chưa có gói nào phù hợp với tài khoản hiện tại.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {packageMetrics.map((pkg) => {
                    const isRecommended =
                      recommendedPackage?.promotionPackageId ===
                      pkg.promotionPackageId;
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
                          {isRecommended && (
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 uppercase font-black tracking-wider">
                              Đề xuất
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-black text-emerald-700 mb-2">
                          {formatVnd(pkg.packagePrice)}
                        </p>
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>Thời hạn: {pkg.durationDays} ngày</p>
                          <p>Chi phí/ngày: {formatVnd(pkg.costPerDay)}</p>
                          <p>
                            Số bài: {pkg.maxPosts > 0 ? `${pkg.maxPosts} bài` : '-'}
                          </p>
                          <p>
                            Lượt hiển thị: {pkg.displayQuota > 0 ? `${pkg.displayQuota.toLocaleString('vi-VN')} lượt` : '-'}
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

        <section className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <article className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Top bài đăng theo lượt xem
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              {data.topPosts.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Chưa có bài đăng thuộc nhà vườn này.
                </div>
              ) : (
                data.topPosts.map((post) => (
                  <div key={post.postId} className="p-5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {post.isPromoted && (
                        <span className="text-[10px] px-2 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">
                          Đang được đẩy
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-slate-900 leading-tight mb-2">
                      {post.postTitle}
                    </h3>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                      <span>Lượt xem: {post.postViewCount.toLocaleString('vi-VN')}</span>
                      <span>Lượt liên hệ: {post.postContactCount.toLocaleString('vi-VN')}</span>
                      <span>Cập nhật: {formatDateTime(post.postUpdatedAt)}</span>
                    </div>
                    <Link
                      to={`/posts/detail/${post.postSlug}`}
                      className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-emerald-700 hover:text-emerald-600"
                    >
                      Xem chi tiết <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Lịch sử mua gói gần đây
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-auto">
              {data.recentPayments.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  Chưa có giao dịch mua gói nào
                </div>
              ) : (
                data.recentPayments.map((payment) => (
                  <div key={payment.paymentTxnId} className="p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-black text-slate-900">
                        {payment.packageTitle || `Gói #${payment.packageId ?? '-'}`}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${getPaymentBadgeClass(payment.paymentTxnStatus)}`}
                      >
                        {payment.paymentTxnStatus || 'pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-1">
                      {payment.postTitle || 'Khong gan bai dang'}
                    </p>
                    <p className="text-sm font-black text-emerald-700">
                      {formatVnd(payment.paymentTxnAmount)}
                    </p>
                    <div className="text-[11px] text-slate-500 mt-2 space-y-1">
                      <p>Mã giao dịch: {payment.paymentTxnProviderTxnId || '-'}</p>
                      <p>Thời gian: {formatDateTime(payment.paymentTxnCreatedAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
};

export default OwnerDashboard;

