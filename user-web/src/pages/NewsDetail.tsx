import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getHostPublicContentDetail,
  toggleFavoriteHostContent,
  checkHostContentSaved,
  type HostPublicContent,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  ChevronLeft,
  Bookmark,
  Loader2,
  Eye,
  MousePointerClick,
  Share2,
  User,
  ShoppingBag,
  Store,
  ArrowRight,
} from "lucide-react";
import { resolveImageUrl } from "../utils/resolveImageUrl";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [content, setContent] = useState<HostPublicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getHostPublicContentDetail(id);
        setContent(response.data);

        if (isAuthenticated) {
          const savedCheck = await checkHostContentSaved(id);
          setIsSaved(!!savedCheck.data?.isSaved);
        }
      } catch (err: any) {
        console.error("Failed to fetch news detail:", err);
        setError("Không thể tải nội dung bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, isAuthenticated]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/news/detail/${id}` } } });
      return;
    }

    if (!id || saving) return;

    setSaving(true);
    try {
      const response = await toggleFavoriteHostContent(id);
      setIsSaved(!!response.data?.isSaved);
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (isoDate: string | null) => {
    if (!isoDate) return "N/A";
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(parsed);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-medium">Đang chuẩn bị nội dung bài viết...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-10">
          <p className="text-rose-600 font-bold text-lg mb-4">{error || "Bài viết không tồn tại"}</p>
          <button
            onClick={() => navigate("/news")}
            className="inline-flex items-center gap-2 text-emerald-700 font-bold hover:underline"
          >
            <ChevronLeft className="w-5 h-5" />
            Quay lại danh sách tin tức
          </button>
        </div>
      </div>
    );
  }

  const coverImage = content.hostContentMediaUrls?.[0] ? resolveImageUrl(content.hostContentMediaUrls[0]) : null;
  const trackingUrl = `${API_BASE}/host/tracking/${content.hostContentId}`;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Article Header & Cover */}
      <div className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate("/news")}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-700 font-medium transition-colors mb-6 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Tin tức & Khuyến mãi
          </button>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight mb-6">
            {content.hostContentTitle}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center overflow-hidden">
                {content.authorAvatar ? (
                  <img src={resolveImageUrl(content.authorAvatar)} alt={content.authorName || "Author"} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-emerald-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 tracking-tight">
                  {content.authorName || "Chuyên gia Host"}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(content.hostContentCreatedAt)}
                  </span>
                  {user?.id === content.authorId && (
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {content.hostContentViewCount || 0} lượt xem
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all font-bold text-sm ${isSaved
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-600"
                  }`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bookmark className={`w-4 h-4 ${isSaved ? "fill-emerald-600" : ""}`} />
                )}
                {isSaved ? "Đã lưu" : "Lưu bài viết"}
              </button>
              <button
                onClick={handleShare}
                className={`flex items-center gap-2 p-2.5 rounded-2xl border transition-all font-bold text-sm ${copied
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-600"
                  }`}
              >
                {copied ? <span className="px-1 text-xs">Đã copy!</span> : <Share2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <article className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-10 shadow-sm">
            {coverImage && (
              <div className="aspect-video w-full rounded-3xl overflow-hidden mb-8 shadow-inner bg-slate-100">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="prose prose-slate max-w-none">
              <p className="text-lg text-slate-700 font-medium leading-relaxed mb-6 italic border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-50/30">
                {content.hostContentDescription}
              </p>

              <div className="text-slate-800 leading-8 whitespace-pre-wrap font-medium">
                {content.hostContentBody || "Nội dung bài viết đang được cập nhật..."}
              </div>
            </div>

            {/* Image Gallery if more than one image */}
            {content.hostContentMediaUrls && content.hostContentMediaUrls.length > 1 && (
              <div className="mt-12 grid grid-cols-2 gap-4">
                {content.hostContentMediaUrls.slice(1).map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100">
                    <img src={resolveImageUrl(url)} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            )}

            {user?.id === content.authorId && (
              <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <MousePointerClick className="w-4 h-4" />
                  <span>{content.hostContentClickCount || 0} lượt tương tác sản phẩm</span>
                </div>
              </div>
            )}
          </article>

          {/* Sidebar / Target Recommendation */}
          <aside className="lg:col-span-4 space-y-6">
            {content.target ? (
              <div className="sticky top-24">
                <div className="bg-emerald-900 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />

                  <div className="relative z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider mb-4">
                      {content.hostContentTargetType === "post" ? <ShoppingBag className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                      Gợi ý từ bài viết
                    </span>

                    <h3 className="text-xl font-black uppercase leading-tight tracking-tight mb-6">
                      {content.hostContentTargetType === "post" ? content.target.postTitle : content.target.shopName}
                    </h3>

                    {content.hostContentTargetType === "shop" && content.target.shopLogoUrl && (
                      <div className="w-20 h-20 rounded-2xl bg-white p-1 mb-6">
                        <img src={resolveImageUrl(content.target.shopLogoUrl)} alt="Shop" className="w-full h-full object-contain rounded-xl" />
                      </div>
                    )}

                    <a
                      href={trackingUrl}
                      className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white text-emerald-900 font-black uppercase text-sm tracking-wide hover:bg-emerald-50 transition-colors group/btn"
                    >
                      {content.hostContentTargetType === "post" ? "Xem sản phẩm" : "Ghé thăm shop"}
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>

                <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h4 className="text-slate-900 font-black uppercase tracking-tight text-xs mb-4">Về GreenMarket</h4>
                  <p className="text-slate-500 text-xs leading-5">
                    GreenMarket là sàn thương mại điện tử chuyên về cây cảnh, giúp kết nối người yêu thiên nhiên với những nhà vườn uy tín nhất.
                  </p>
                  <Link to="/home" className="text-emerald-700 text-xs font-bold mt-4 inline-block hover:underline">
                    Trang chủ hệ thống
                  </Link>
                </div>
              </div>
            ) : (
              <></>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
