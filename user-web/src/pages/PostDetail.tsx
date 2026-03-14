import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostDetail, submitReport } from '../services/api';
import { 
  MapPin, 
  User, 
  Store, 
  Clock, 
  AlertTriangle, 
  ChevronLeft, 
  Share2,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!slug) return;
      try {
        const response = await getPostDetail(slug);
        setPost(response.data);
      } catch (error) {
        console.error("Failed to fetch post detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await submitReport({ postId: post.postId, reportReason });
      alert("Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xử lý sớm nhất có thể.");
      setShowReportModal(false);
    } catch (error) {
      console.error("Failed to submit report:", error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Đang tải chi tiết...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center text-slate-500">Không tìm thấy bài đăng.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-500 mb-8 transition-colors">
        <ChevronLeft className="w-5 h-5" /> Quay lại chợ
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Images */}
        <div className="space-y-4">
          <div className="aspect-4/5 glass rounded-3xl overflow-hidden relative">
            {post.images && post.images.length > 0 ? (
              <img src={post.images[0].imageUrl} alt={post.postTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-700">Chưa có hình ảnh</div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
             {post.images?.slice(1, 5).map((img: any, i: number) => (
               <div key={i} className="aspect-square glass rounded-xl overflow-hidden">
                 <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
               </div>
             ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-8">
          <div>
             <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold uppercase tracking-wider mb-2">
               <ShieldCheck className="w-4 h-4" /> Đã xác minh
             </div>
             <h1 className="text-4xl font-extrabold mb-4">{post.postTitle}</h1>
             <div className="flex items-center gap-4 text-slate-400 text-sm">
               <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> 2 giờ trước</div>
               <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {post.postLocation}</div>
             </div>
          </div>

          <div className="text-4xl font-black text-emerald-500">
            {Number(post.postPrice).toLocaleString()} <span className="text-lg">VNĐ</span>
          </div>

          <div className="glass p-6 rounded-3xl space-y-4">
             <h3 className="font-bold flex items-center gap-2 text-slate-200">
               <Store className="w-5 h-5 text-emerald-500" /> Thông tin nhà vườn
             </h3>
             {post.shop ? (
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 font-bold text-xl">
                    {post.shop.shopName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{post.shop.shopName}</div>
                    <div className="text-slate-400 text-sm">{post.shop.shopLocation}</div>
                  </div>
               </div>
             ) : (
               <div className="flex items-center gap-3 text-slate-400 italic">
                 <User className="w-5 h-5" /> Người bán cá nhân
               </div>
             )}
             <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                  <MessageCircle className="w-5 h-5" /> Chat ngay
                </button>
                <button className="w-12 h-12 glass flex items-center justify-center rounded-xl hover:text-emerald-500 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold">Mô tả chi tiết</h3>
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">
              {post.postContent || "Không có mô tả chi tiết cho bài đăng này."}
            </p>
          </div>

          {/* Attributes */}
          <div className="grid grid-cols-2 gap-4">
             {post.attributes?.map((attr: any, i: number) => (
               <div key={i} className="bg-surface/30 p-4 rounded-2xl border border-white/5">
                 <span className="text-slate-500 text-xs block mb-1 uppercase tracking-widest">Đặc điểm {i + 1}</span>
                 <span className="font-medium">{attr.attributeValue}</span>
               </div>
             ))}
          </div>

          <div className="pt-6 border-t border-white/5">
             <button 
               onClick={() => setShowReportModal(true)}
               className="text-slate-600 hover:text-red-400 text-sm flex items-center gap-2 transition-colors uppercase tracking-widest font-bold"
             >
               <AlertTriangle className="w-4 h-4" /> Báo cáo vi phạm
             </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass max-w-md w-full p-8 rounded-3xl shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Báo cáo bài đăng</h3>
            <p className="text-slate-400 mb-6">Hãy cho chúng tôi biết vấn đề bạn gặp phải với bài đăng này.</p>
            <textarea 
              className="w-full bg-surface border border-white/10 p-4 rounded-2xl mb-6 outline-none focus:border-red-400 transition-all"
              rows={4}
              placeholder="Vấn đề: Lừa đảo, thông tin sai, hình ảnh không đúng..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleReport}
                className="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-3 rounded-xl font-bold transition-all"
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
