import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyFavoriteHostContents,
  toggleFavoriteHostContent,
  type HostFavoriteContent,
} from "../services/api";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  Loader2,
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

const getCoverImage = (item: HostFavoriteContent) => {
  if (!Array.isArray(item.hostContentMediaUrls) || item.hostContentMediaUrls.length === 0) {
    return null;
  }
  const first = item.hostContentMediaUrls[0];
  return typeof first === "string" ? resolveImageUrl(first) : null;
};

const NewsBookmarks: React.FC = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => {
            const coverImage = getCoverImage(item);
            const trackingUrl = `${API_BASE}/host/tracking/${item.hostContentId}`;
            const isUpdating = updatingId === item.hostContentId;

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
                      No image
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wide">
                      Saved
                    </span>
                    <button
                      onClick={() => handleRemoveBookmark(item.hostContentId)}
                      disabled={isUpdating}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                      title="Bỏ bookmark"
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className="w-4 h-4 fill-rose-500" />
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
                      <span>Đã lưu: {formatDate(item.favoriteCreatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Đã đăng: {formatDate(item.hostContentCreatedAt)}</span>
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

export default NewsBookmarks;
