import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getFavoritePosts } from '../services/api';
import { PackageOpen, MapPin, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

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

  const toMediaUrl = (url?: string | null) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-full"></div>
        <div className="text-slate-500 font-medium">Đang tải dữ liệu...</div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Bài Đăng Đã Lưu</h1>
          <p className="text-slate-400">Danh sách các bài đăng bạn đã thả tim hoặc lưu lại.</p>
        </div>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            Sản phẩm yêu thích
            <span className="text-sm font-normal text-slate-500 bg-white/5 px-3 py-1 rounded-full">{posts.length} bài</span>
          </h2>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.postId}
                  to={`/posts/detail/${post.postSlug}`}
                  className="glass p-4 rounded-3xl border-white/5 hover:border-emerald-500/30 transition-all flex flex-col gap-4 group"
                >
                  <div className="w-full aspect-video bg-white/5 rounded-2xl overflow-hidden relative">
                    {toMediaUrl(post.coverImageUrl || post.images?.[0]?.imageUrl) ? (
                      <img
                        src={toMediaUrl(post.coverImageUrl || post.images?.[0]?.imageUrl)}
                        alt={post.postTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <PackageOpen className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                    <button 
                        className="absolute top-2 right-2 p-2 rounded-xl bg-black/40 backdrop-blur-md text-rose-500"
                        title="Đã lưu bài"
                    >
                        <Heart className="w-5 h-5 fill-rose-500" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold line-clamp-2 group-hover:text-emerald-400 transition-colors uppercase mb-2">
                        {post.postTitle}
                    </h3>

                    <div className="flex items-center gap-1.5 font-black text-lg text-emerald-500 mb-2">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.postPrice)}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {post.postLocation || 'Chưa cập nhật vị trí'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
             <div className="text-center py-24 glass rounded-4xl border-dashed border-white/10">
              <Heart className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-2">Chưa có bài viết nào được lưu</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Bạn có thể thả tim bài viết để dễ dàng tìm lại sau này.</p>
              <button
                onClick={(e) => { e.preventDefault(); navigate('/'); }}
                className="bg-emerald-600/10 text-emerald-500 px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all underline decoration-emerald-500/30 underline-offset-8"
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
