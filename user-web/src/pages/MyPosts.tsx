import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyPosts, deleteUserPost, updateUserPost } from '../services/api';
import { Store, Plus, PackageOpen, Clock, CheckCircle2, XCircle, MapPin, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MyPosts: React.FC = () => {
  const { user, shop } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'shop'>(shop ? 'shop' : 'personal');

  // Edit Modal State
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    // Default to shop tab if user has a shop
    setActiveTab(shop ? 'shop' : 'personal');
  }, [shop]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user?.id) return;
      try {
        const postsRes = await getMyPosts(user.id);
        setPosts(postsRes.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [user?.id]);

  const handleDelete = async (postId: number) => {
    if (!user?.id) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa bài đăng này không?')) {
      try {
        await deleteUserPost(postId, user.id);
        alert('Đã xóa bài đăng thành công.');
        setPosts(posts.filter(p => p.postId !== postId));
      } catch (error) {
        console.error('Failed to delete post', error);
        alert('Có lỗi xảy ra khi xóa bài đăng.');
      }
    }
  };

  const openEditModal = (post: any) => {
    setEditingPost(post);
    setEditTitle(post.postTitle);
    setEditPrice(post.postPrice);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !user?.id) return;

    try {
      await updateUserPost(editingPost.postId, {
        userId: user.id,
        postTitle: editTitle,
        postPrice: editPrice
      });
      alert('Đã cập nhật bài đăng thành công! Bài viết sẽ được chuyển về trạng thái chờ duyệt.');
      setEditingPost(null);
      // Refresh list to get updated status
      const postsRes = await getMyPosts(user.id);
      setPosts(postsRes.data);
    } catch (error) {
      console.error('Failed to update post', error);
      alert('Có lỗi xảy ra khi cập nhật bài đăng.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-amber-500/20"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
      case 'approved':
        return <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Đã duyệt</span>;
      case 'rejected':
        return <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-rose-500/20"><XCircle className="w-3 h-3" /> Bị từ chối</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase border border-slate-500/20">{status}</span>;
    }
  };

  const filteredPosts = posts.filter(post => {
    // If shop owner, show ALL posts in the 'shop' view (since old ones are retroactively assigned)
    if (shop) return true;

    // Otherwise follow tab logic
    if (activeTab === 'shop') return post.postShopId !== null;
    return post.postShopId === null;
  });

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
          <h1 className="text-4xl font-black tracking-tight mb-2">Trung tâm quản lý</h1>
          <p className="text-slate-400">Theo dõi và tối ưu hiệu quả bài đăng của bạn trên GreenMarket.</p>
        </div>
        <button
          onClick={() => navigate('/create-post')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-900/40"
        >
          <Plus className="w-5 h-5" /> Đăng tin mới
        </button>
      </div>

      {/* Tabs Control: Only show if user does NOT have a shop */}
      {!shop && (
        <div className="flex gap-2 p-1.5 bg-surface/50 rounded-2xl border border-white/5 mb-12 w-fit">
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'personal' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            🏠 Tin Cá Nhân
          </button>
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'shop' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
          >
            🪴 Mở Nhà Vườn
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
          </button>
        </div>
      )}

      <div className="space-y-12">
        {activeTab === 'shop' && (
          <>
            {shop ? (
              <div className="glass p-8 rounded-4xl border-emerald-500/20 shadow-2xl shadow-emerald-500/5 flex flex-col md:flex-row gap-8 items-center bg-linear-to-br from-surface to-background relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl -mr-32 -mt-32"></div>
                <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 shrink-0">
                  <Store className="w-12 h-12" />
                </div>
                <Link 
                  to={`/shop/${shop.shopId}`}
                  className="flex-1 text-center md:text-left group/shopLink cursor-pointer"
                >
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h2 className="text-3xl font-black group-hover/shopLink:text-emerald-400 transition-colors">{shop.shopName}</h2>
                    <span className={shop.shopStatus === 'active' ? "bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase transition-all group-hover/shopLink:bg-emerald-500/30" : "bg-amber-500/20 text-amber-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase"}>
                      {shop.shopStatus === 'active' ? 'Nhà vườn đã xác minh' : 'Đang chờ xác minh'}
                    </span>
                  </div>
                  <p className="text-slate-400 max-w-xl line-clamp-2 group-hover/shopLink:text-slate-300 transition-colors">{shop.shopDescription || 'Chưa có mô tả nhà vườn.'}</p>
                </Link>
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-3xl font-black text-emerald-500">0</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Lượt xem</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-white">{filteredPosts.length}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tin rao</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass p-12 rounded-4xl border-amber-500/20 bg-amber-500/5 text-center">
                <Store className="w-16 h-16 text-amber-500/30 mx-auto mb-6" />
                <h2 className="text-2xl font-black mb-4 uppercase">Chưa có Nhà Vườn</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">Bạn chưa đăng ký hồ sơ Nhà Vườn. Hãy đăng ký ngay để xây dựng thương hiệu cây cảnh chuyên nghiệp!</p>
                <button
                  onClick={() => navigate('/register-shop')}
                  className="bg-amber-500 text-black px-10 py-4 rounded-2xl font-black uppercase text-sm hover:bg-amber-400 transition-all shadow-xl shadow-amber-950/20"
                >
                  🚀 Mở Nhà Vườn Ngay
                </button>
              </div>
            )}
          </>
        )}

        {/* Posts List */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            {activeTab === 'shop' ? 'Sản phẩm tại vườn' : 'Danh sách tin cá nhân'}
            <span className="text-sm font-normal text-slate-500 bg-white/5 px-3 py-1 rounded-full">{filteredPosts.length} bài</span>
          </h2>

          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredPosts.map((post) => (
                <div key={post.postId} className="glass p-4 rounded-3xl border-white/5 hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row items-center gap-6 group">
                  <div className="w-full sm:w-32 h-32 bg-white/5 rounded-2xl overflow-hidden shrink-0 relative">
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <PackageOpen className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <h3 className="text-base font-bold line-clamp-2 group-hover:text-emerald-400 transition-colors uppercase">{post.postTitle}</h3>
                      <div className="flex justify-center sm:justify-start">
                        {getStatusBadge(post.postStatus)}
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 font-black text-lg text-emerald-500">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(post.postPrice)}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {post.postLocation || 'Chưa cập nhật vị trí'}
                      </div>
                      <div className="text-[10px] text-slate-600 font-medium">
                        🕒 {new Date(post.postUpdatedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    {post.postStatus === 'rejected' && post.postRejectedReason && (activeTab === 'shop' || activeTab === 'personal') && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-400 text-xs text-left">
                        <strong>Lý do từ chối:</strong> {post.postRejectedReason}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      title="Xem chi tiết"
                      onClick={() => navigate(`/posts/detail/${post.postSlug}`)}
                      className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-blue-500 transition-all group-hover:translate-x-1"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      title="Chỉnh sửa"
                      onClick={() => openEditModal(post)}
                      className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-amber-500 transition-all group-hover:translate-x-1"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      title="Xóa bài"
                      onClick={() => handleDelete(post.postId)}
                      className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500 transition-all group-hover:translate-x-1"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 glass rounded-4xl border-dashed border-white/10">
              <PackageOpen className="w-16 h-16 text-slate-700 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-2">Không tìm thấy bài viết nào</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Hãy bắt đầu rao bán những mẫu cây cảnh tuyệt vời của bạn ngay bây giờ!</p>
              <button
                onClick={() => navigate('/create-post')}
                className="bg-emerald-600/10 text-emerald-500 px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all underline decoration-emerald-500/30 underline-offset-8"
              >
                Tạo bài đăng đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm shadow-2xl flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16"></div>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2 tracking-tight text-white"><Store className="w-6 h-6 text-emerald-500" /> Sửa bài đăng</h2>
            <form onSubmit={handleEditSubmit} className="relative z-10">
              <div className="mb-5">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Tiêu đề bài viết</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Giá bán (VNĐ)</label>
                <input
                  type="number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyPosts;
