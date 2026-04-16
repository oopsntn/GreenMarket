import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  checkHostContentSaved,
  getHostPublicContents,
  toggleFavoriteHostContent,
  type HostPublicContent,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Loader2,
  MousePointerClick,
  Search,
  Eye,
} from "lucide-react";
import { resolveImageUrl } from "../utils/resolveImageUrl";

const PAGE_LIMIT = 9;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatDate = (isoDate: string | null) => {
  if (!isoDate) return "N/A";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
};

const getCoverImage = (item: HostPublicContent) => {
  if (!Array.isArray(item.hostContentMediaUrls) || item.hostContentMediaUrls.length === 0) {
    return null;
  }
  const first = item.hostContentMediaUrls[0];
  return typeof first === "string" ? resolveImageUrl(first) : null;
};

const News: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [items, setItems] = useState<HostPublicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [savedMap, setSavedMap] = useState<Record<number, boolean>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await getHostPublicContents({
          targetType: "post",
          search: debouncedSearch || undefined,
          page,
          limit: PAGE_LIMIT,
        });

        const list = response.data?.data || [];
        const meta = response.data?.meta;
        setItems(list);
        setTotalPages(Math.max(meta?.totalPages || 1, 1));
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (!isAuthenticated || items.length === 0) {
      setSavedMap({});
      return;
    }

    let cancelled = false;

    const fetchSavedStates = async () => {
      const checks = await Promise.all(
        items.map(async (item) => {
          try {
            const response = await checkHostContentSaved(item.hostContentId);
            return [item.hostContentId, !!response.data?.isSaved] as const;
          } catch {
            return [item.hostContentId, false] as const;
          }
        }),
      );

      if (cancelled) return;

      const next: Record<number, boolean> = {};
      for (const [contentId, isSaved] of checks) {
        next[contentId] = isSaved;
      }
      setSavedMap(next);
    };

    fetchSavedStates();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, items]);

  const handleToggleSave = async (contentId: number) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/news" } } });
      return;
    }

    if (savingId === contentId) return;

    setSavingId(contentId);
    try {
      const response = await toggleFavoriteHostContent(contentId);
      setSavedMap((prev) => ({
        ...prev,
        [contentId]: !!response.data?.isSaved,
      }));
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">
          News
        </h1>
        <p className="text-slate-500 font-medium">
          Tổng hợp bài viết mới.
        </p>
      </header>

      <div className="mb-8">
        <div className="relative max-w-3xl">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => {
              setPage(1);
              setSearchInput(event.target.value);
            }}
            placeholder="Tìm kiếm bài viết..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Đang tải danh sách bài viết...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-20 text-center">
          <p className="text-slate-700 font-bold text-lg mb-2">Không có bài viết phù hợp</p>
          <p className="text-slate-500">Thử đổi từ khóa tìm kiếm hoặc quay lại sau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => {
            const isSaved = !!savedMap[item.hostContentId];
            const coverImage = getCoverImage(item);
            const trackingUrl = `${API_BASE}/host/tracking/${item.hostContentId}`;

            return (
              <article
                key={item.hostContentId}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
              >
                <div className="h-52 bg-slate-100 border-b border-slate-200 overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={item.hostContentTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-semibold">
                      Không có ảnh
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wide">
                      Host Post
                    </span>
                    <button
                      onClick={() => handleToggleSave(item.hostContentId)}
                      disabled={savingId === item.hostContentId}
                      className={`p-2 rounded-xl border transition-all ${isSaved
                          ? "text-rose-500 border-rose-200 bg-rose-50"
                          : "text-slate-400 border-slate-200 hover:text-rose-500 hover:border-rose-200"
                        }`}
                      title={isSaved ? "Bỏ bookmark" : "Lưu bookmark"}
                    >
                      {savingId === item.hostContentId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500" : ""}`} />
                      )}
                    </button>
                  </div>

                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight line-clamp-2 mb-3">
                    {item.hostContentTitle}
                  </h2>

                  <p className="text-sm text-slate-600 line-clamp-3 min-h-[60px]">
                    {item.hostContentDescription || "Không có mô tả"}
                  </p>

                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{formatDate(item.hostContentCreatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {item.hostContentViewCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MousePointerClick className="w-3.5 h-3.5" />
                        {item.hostContentClickCount || 0}
                      </span>
                    </div>
                  </div>

                  <a
                    href={trackingUrl}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-black uppercase tracking-wide hover:bg-emerald-600 transition-colors"
                  >
                    Xem bài viết
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="p-3 rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:text-emerald-700 hover:border-emerald-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="p-3 rounded-xl border border-slate-200 bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:text-emerald-700 hover:border-emerald-300 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default News;
