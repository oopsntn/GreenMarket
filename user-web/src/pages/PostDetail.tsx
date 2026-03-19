import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPostDetail } from '../services/api';
import { 
  MapPin, Phone, Calendar, ChevronLeft, ChevronRight, 
  Store, ShieldCheck, Share2, Heart, MessageCircle, Info,
  Play, Maximize2, ShoppingBag
} from 'lucide-react';

const PostDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);

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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
    );

    if (!post) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="text-slate-500">Không tìm thấy bài đăng</div>
            <button onClick={() => navigate('/')} className="text-emerald-500 hover:outline underline underline-offset-4 font-bold">Quay lại trang chủ</button>
        </div>
    );

    const mediaList = [
        ...(post.images || []).map((img: any) => ({ type: 'image', url: img.imageUrl })),
        ...(post.videos || []).map((vid: any) => ({ type: 'video', url: vid.videoUrl }))
    ];

    const currentMedia = mediaList[activeMediaIndex];

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
    };

    return (
        <div className="min-h-screen pb-24">
            {/* Top Navigation Bar */}
            <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Quay lại
                    </button>
                    <div className="flex items-center gap-4">
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-500 transition-all">
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Media Gallery */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative aspect-square rounded-4xl overflow-hidden glass border-white/5 bg-surface group">
                            {mediaList.length > 0 ? (
                                <>
                                    {currentMedia.type === 'image' ? (
                                        <img 
                                            src={currentMedia.url.startsWith('http') ? currentMedia.url : `http://localhost:5000${currentMedia.url}`} 
                                            alt={post.postTitle}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <video 
                                            src={currentMedia.url.startsWith('http') ? currentMedia.url : `http://localhost:5000${currentMedia.url}`}
                                            controls
                                            className="w-full h-full object-contain bg-black"
                                        />
                                    )}

                                    {/* Arrow Navigation */}
                                    {mediaList.length > 1 && (
                                        <>
                                            <button 
                                                onClick={() => setActiveMediaIndex(prev => prev === 0 ? mediaList.length - 1 : prev - 1)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/40 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button 
                                                onClick={() => setActiveMediaIndex(prev => prev === mediaList.length - 1 ? 0 : prev + 1)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-black/40 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                                    <ShoppingBag className="w-16 h-16 mb-4" />
                                    <span>Chưa có hình ảnh/video</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                            {mediaList.map((media, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setActiveMediaIndex(idx)}
                                    className={`relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${activeMediaIndex === idx ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    {media.type === 'image' ? (
                                        <img src={media.url.startsWith('http') ? media.url : `http://localhost:5000${media.url}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                            <Play className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Information */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Summary Card */}
                        <div className="glass p-8 rounded-4xl border-white/5 space-y-6">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black text-white leading-tight uppercase tracking-tight">{post.postTitle}</h1>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" /> Đã xác minh
                                    </div>
                                    <div className="text-slate-500 text-sm flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Đăng ngày {new Date(post.postCreatedAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-emerald-500">{formatPrice(post.postPrice)}</span>
                                <span className="text-slate-500 font-medium">/ cây/gốc</span>
                            </div>

                            <div className="space-y-4 pb-6 border-b border-white/5">
                                <a 
                                    href={`tel:${post.shop?.shopPhone || post.postContactPhone}`}
                                    className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-emerald-900/40"
                                >
                                    <Phone className="w-6 h-6" /> {post.shop?.shopPhone || post.postContactPhone || 'Không có số'}
                                </a>
                                <a 
                                    href={`https://zalo.me/${post.shop?.shopPhone || post.postContactPhone}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xl flex items-center justify-center gap-3 transition-all"
                                >
                                    <MessageCircle className="w-6 h-6 text-emerald-500" /> Chat qua Zalo
                                </a>
                            </div>

                            <div className="flex items-center gap-3 text-slate-300">
                                <MapPin className="w-5 h-5 text-emerald-500" />
                                <span className="font-medium">{post.postLocation || 'Thạch Thất, Hà Nội'}</span>
                            </div>
                        </div>

                        {/* Shop Profile Card */}
                        {post.shop && (
                            <div className="glass p-8 rounded-4xl border-emerald-500/20 bg-linear-to-br from- emerald-500/5 to-transparent space-y-6 group cursor-pointer overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 text-emerald-500/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <Store className="w-24 h-24" />
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                                        <Store className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{post.shop.shopName}</h3>
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                            <ShieldCheck className="w-4 h-4" /> Nhà vườn đã xác minh
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed relative z-10">{post.shop.shopDescription || 'Cung cấp các mẫu bonsai tuyệt đẹp cho mọi không gian kiến trúc.'}</p>
                                <button className="w-full py-3 rounded-xl border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-white transition-all">Xem trang Nhà Vườn</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16">
                    <div className="lg:col-span-8 space-y-12">
                        {/* Description */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black flex items-center gap-4">
                                <Info className="w-8 h-8 text-emerald-500" /> Chi tiết sản phẩm
                            </h2>
                            <div className="glass p-8 rounded-4xl border-white/5 prose prose-invert max-w-none text-slate-300 leading-loose">
                                {post.postContent || 'Không có mô tả chi tiết cho sản phẩm này.'}
                            </div>
                        </div>

                        {/* Specifications/Attributes */}
                        {post.attributes && post.attributes.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-3xl font-black flex items-center gap-4">
                                    <Maximize2 className="w-8 h-8 text-emerald-500" /> Thông số kỹ thuật
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {post.attributes.map((attr: any, idx: number) => (
                                        <div key={idx} className="glass p-6 rounded-3xl border-white/5 flex items-center justify-between">
                                            <span className="text-slate-400 font-medium">{attr.name || `Thông số ${idx + 1}`}</span>
                                            <span className="text-white font-black uppercase">{attr.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs text-slate-600 italic mt-2">* Thông số hiển thị dựa trên mã định danh thuộc tính hệ thống.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetail;
