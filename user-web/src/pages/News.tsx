import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  checkHostContentSaved,
  getHostPublicContents,
  type HostPublicContent,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  ArrowRight,
  Search,
} from "lucide-react";
import { resolveImageUrl } from "../utils/resolveImageUrl";

const PAGE_LIMIT = 9;

const formatDate = (isoDate: string | null) => {
  if (!isoDate) return "N/A";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
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
  const { isAuthenticated, user } = useAuth();

  const [items, setItems] = useState<HostPublicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [savedMap, setSavedMap] = useState<Record<number, boolean>>({});

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
        <div className="flex flex-col gap-8">
          {items.map((item) => {
            const coverImage = getCoverImage(item);
            return (
              <article
                key={item.hostContentId}
                className="group bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all duration-500"
              >
                <div className="flex flex-col md:flex-row h-full">
                  {/* Image Section */}
                  <div className="md:w-64 w-full h-48 md:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={item.hostContentTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-semibold bg-slate-50 text-xs">
                        Không có ảnh
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(item.hostContentCreatedAt)}
                      </div>

                      <Link to={`/news/detail/${item.hostContentId}`} className="block group/title">
                        <div className="flex items-center gap-2 mb-2">
                          {item.hostContentCategory && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider">
                              {item.hostContentCategory}
                            </span>
                          )}
                          <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight group-hover/title:text-emerald-700 transition-colors line-clamp-1">
                            {item.hostContentTitle}
                          </h2>
                        </div>
                      </Link>

                      <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">
                        {item.hostContentDescription || "Không có mô tả chi tiết."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-4">
                        {user?.id === item.authorId && (
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-slate-300" />
                              {item.hostContentViewCount || 0} lượt xem
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/news/detail/${item.hostContentId}`}
                        className="inline-flex items-center gap-2 h-8 px-4 rounded-xl bg-slate-100 text-slate-900 font-black uppercase text-[9px] tracking-widest hover:bg-emerald-700 hover:text-white transition-all shadow-sm"
                      >
                        Đọc tiếp
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
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
