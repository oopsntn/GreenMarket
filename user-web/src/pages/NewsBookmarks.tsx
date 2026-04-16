import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMyFavoriteHostContents,
  toggleFavoriteHostContent,
  type HostFavoriteContent,
} from "../services/api";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  ArrowRight,
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

const getCoverImage = (item: HostFavoriteContent) => {
  if (!Array.isArray(item.hostContentMediaUrls) || item.hostContentMediaUrls.length === 0) {
    return null;
  }
  const first = item.hostContentMediaUrls[0];
  return typeof first === "string" ? resolveImageUrl(first) : null;
};

const NewsBookmarks: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<HostFavoriteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await getMyFavoriteHostContents({
        page,
        limit: PAGE_LIMIT,
      });
      const list = response.data?.data || [];
      const meta = response.data?.meta;

      setItems(list);
      setTotalPages(Math.max(meta?.totalPages || 1, 1));
    } catch (error) {
      console.error("Failed to fetch host bookmarks:", error);
      setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [page]);

  const handleRemoveBookmark = async (contentId: number) => {
    if (updatingId === contentId) return;

    setUpdatingId(contentId);
    try {
      await toggleFavoriteHostContent(contentId);

      // If current page becomes empty after removal, move to previous page when possible.
      if (items.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchBookmarks();
      }
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">
          News Bookmarks
        </h1>
        <p className="text-slate-500 font-medium">
          Danh sách bài viết Host bạn đã lưu để đọc lại nhanh.
        </p>
      </header>

      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
          <p className="text-slate-500 font-semibold">Đang tải bookmarks...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-20 text-center">
          <p className="text-slate-700 font-bold text-lg mb-2">Bạn chưa lưu bài viết nào</p>
          <p className="text-slate-500 mb-6">
            Vào trang News để bookmark các bài viết từ Host.
          </p>
          <Link
            to="/news"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm hover:bg-emerald-600"
          >
            Đi tới News
          </Link>
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
                        No image
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="text-[9px] font-black text-rose-600 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg border border-rose-100">
                        Đã lưu
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        <CalendarDays className="w-3 h-3" />
                        Đã đăng: {formatDate(item.hostContentCreatedAt)}
                      </div>

                      <Link to={`/news/detail/${item.hostContentId}`} className="block group/title">
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight mb-2 group-hover/title:text-emerald-700 transition-colors line-clamp-1">
                          {item.hostContentTitle}
                        </h2>
                      </Link>

                      <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">
                        {item.hostContentDescription || "Không có mô tả chi tiết."}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-6">
                        {user?.id === item.authorId && (
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-slate-300" />
                              {item.hostContentViewCount || 0}
                            </span>
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/news/detail/${item.hostContentId}`}
                        className="inline-flex items-center gap-2 h-8 px-4 rounded-xl bg-slate-100 text-slate-900 font-black uppercase text-[9px] tracking-widest hover:bg-emerald-700 hover:text-white transition-all shadow-sm"
                      >
                        Đọc tiếp
                        <ArrowRight className="w-3.5 h-3.5" />
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

export default NewsBookmarks;
