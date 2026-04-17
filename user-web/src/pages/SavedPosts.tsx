import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getFavoritePosts } from '../services/api';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { PackageOpen, MapPin, Loader2, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SavedPosts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id) return;
      try {
        const postsRes = await getFavoritePosts();
        setPosts(postsRes.data?.posts || []);
      } catch (error) {
        console.error("Failed to fetch favorite posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [user?.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-slate-900 uppercase">Bài Đăng Đã Lưu</h1>
          <p className="text-slate-500 font-medium">Danh sách các bài đăng bạn đã đánh dấu hoặc lưu lại để theo dõi.</p>
        </div>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-slate-900 tracking-tight uppercase">
            Sản phẩm yêu thích
            <span className="text-sm font-bold text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">{posts.length} bài</span>
          </h2>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.postId}
                  to={`/posts/detail/${post.postSlug}`}
                  className="bg-white p-4 rounded-4xl border border-slate-200 hover:border-emerald-500/30 transition-all flex flex-col gap-4 group shadow-sm hover:shadow-2xl"
                >
                  <div className="w-full aspect-square md:aspect-video bg-slate-50 rounded-3xl overflow-hidden relative border border-slate-100">
                    {resolveImageUrl(post.coverImageUrl || post.images?.[0]?.imageUrl) ? (
                      <img
                        src={resolveImageUrl(post.coverImageUrl || post.images?.[0]?.imageUrl)}
                        alt={post.postTitle}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <PackageOpen className="w-12 h-12 group-hover:translate-y-[-4px] transition-transform" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/90 backdrop-blur-md text-emerald-600 shadow-xl border border-white/50">
                      <Bookmark className="w-5 h-5 fill-emerald-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 px-2 pb-2">
                    <h3 className="text-lg font-black text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors uppercase tracking-tight mb-3 leading-tight">
                      {post.postTitle}
                    </h3>

                    <div className="flex items-center gap-2 font-black text-2xl text-emerald-600 mb-4">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.postPrice)}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {post.postLocation || 'Chưa cập nhật vị trí'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white border border-slate-200 rounded-4xl shadow-sm border-dashed">
              <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                <Bookmark className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black mb-2 text-slate-900 tracking-tight uppercase">Chưa có bài viết nào được lưu</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">Bạn có thể đánh dấu bài viết để dễ dàng tìm lại sau này và nhận thông báo khi có thay đổi.</p>
              <button
                onClick={(e) => { e.preventDefault(); navigate('/home'); }}
                className="bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200/50 active:scale-95"
              >
                Khám phá thị trường
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPosts;
