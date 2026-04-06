import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPostDetail, recordContactClick, submitReport, checkIsSaved, toggleFavoritePost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Phone, Calendar, ChevronLeft, ChevronRight, 
  Store, ShieldCheck, Share2, Heart, MessageCircle, Info,
  Play, Maximize2, ShoppingBag, Eye, AlertCircle, Map as MapIcon, ExternalLink, ZoomIn
} from 'lucide-react';
import ImageModal from '../components/ImageModal';

const PostDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [post, setPost] = useState<any>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [contactRevealed, setContactRevealed] = useState(false);
    const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

    const handleRevealContact = async () => {
        setContactRevealed(true);
        if (post?.postId) {
            try {
                await recordContactClick(post.postId);
            } catch (error) {
                console.error("Failed to record contact click", error);
            }
        }
    };

    const handleReport = async () => {
        const reason = window.prompt("Nhập lý do báo cáo bài đăng này:");
        if (reason && post?.postId) {
            try {
                await submitReport({ postId: post.postId, reportReason: reason });
                alert("Cảm ơn bạn! Báo cáo của bạn đã được gửi tới quản trị viên.");
            } catch (error) {
                console.error("Failed to submit report", error);
                alert("Có lỗi xảy ra khi gửi báo cáo.");
            }
        }
    };

    const handleToggleSave = async () => {
        if (!user) {
            alert('Vui lòng đăng nhập để lưu bài.');
            navigate('/auth');
            return;
        }
        if (!post?.postId) return;
        try {
            const res = await toggleFavoritePost(post.postId);
            setIsSaved(res.data.isSaved);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        const fetchDetail = async () => {
            if (!slug) return;
            try {
                const response = await getPostDetail(slug);
                setPost(response.data);
                
                // Fetch save status if user is logged in
                if (response.data?.postId) {
                    try {
                        // Assuming auth token is implicitly attached if logged in
                        const savedRes = await checkIsSaved(response.data.postId);
                        setIsSaved(savedRes.data.isSaved);
                    } catch (e) {
                        console.error('Failed to check save status:', e);
                    }
                }
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

    const hasExactCoordinates = Boolean(post?.shop?.shopLat && post?.shop?.shopLng);
    const locationLabel = post?.shop?.shopLocation || post?.postLocation || 'Ha Noi';
    const mapEmbedUrl = hasExactCoordinates
        ? `https://maps.google.com/maps?q=${post.shop.shopLat},${post.shop.shopLng}&t=&z=14&ie=UTF8&iwloc=&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(locationLabel)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    const directionsUrl = hasExactCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${post.shop.shopLat},${post.shop.shopLng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`;

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
                        <button 
                            onClick={handleToggleSave}
                            className={`p-2.5 rounded-xl transition-all ${isSaved ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-rose-500'}`}
                            title={isSaved ? "Bỏ lưu bài" : "Lưu bài"}
                        >
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500' : ''}`} />
                        </button>
                        <button
                            onClick={handleReport}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-500 transition-all"
                            title="Báo cáo bài đăng"
                        >
                            <AlertCircle className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* Left Column: Media Gallery */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="relative aspect-3/2 max-h-[520px] rounded-4xl overflow-hidden glass border-white/5 bg-surface group">
                            {mediaList.length > 0 ? (
                                <>
                                    {currentMedia.type === 'image' ? (
                                        <div 
                                            className="relative w-full h-full cursor-zoom-in group/main" 
                                            onClick={() => {
                                                const imageIndex = mediaList
                                                    .filter(m => m.type === 'image')
                                                    .findIndex(m => m.url === currentMedia.url);
                                                setPreviewImageIndex(imageIndex);
                                            }}
                                        >
                                            <img
                                                src={currentMedia.url.startsWith('http') ? currentMedia.url : `http://localhost:5000${currentMedia.url}`}
                                                alt={post.postTitle}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover/main:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/main:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="p-4 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                                                    <ZoomIn className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                        </div>
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
                        {/* Content Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                            <div className="lg:col-span-8 space-y-6">
                                {/* Description */}
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black flex items-center gap-3">
                                        <Info className="w-8 h-8 text-emerald-500" /> Chi tiết sản phẩm
                                    </h2>
                                    <div className="glass p-6 rounded-3xl border-white/5 prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm">
                                        {post.postContent || 'Không có mô tả chi tiết cho sản phẩm này.'}
                                    </div>
                                </div>

                                {/* Specifications/Attributes */}
                                {post.attributes && post.attributes.length > 0 && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-black flex items-center gap-3">
                                            <Maximize2 className="w-8 h-8 text-emerald-500" /> Thông số kỹ thuật
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {post.attributes.map((attr: any, idx: number) => (
                                                <div key={idx} className="glass p-4 rounded-2xl border-white/5 flex items-center justify-between">
                                                    <span className="text-slate-400 text-sm">{attr.name || `Thông số ${idx + 1}`}</span>
                                                    <span className="text-white font-bold text-sm uppercase">{attr.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-slate-600 italic mt-2">* Thông số hiển thị dựa trên mã định danh thuộc tính hệ thống.</div>
                                    </div>
                                )}
                            </div>
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
                                    <div className="text-slate-500 text-sm flex items-center gap-2">
                                        <Eye className="w-4 h-4" /> {post.postViewCount || 1} lượt xem
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-emerald-500">{formatPrice(post.postPrice)}</span>
                                <span className="text-slate-500 font-medium">/ cây/gốc</span>
                            </div>

                            <div className="space-y-4 pb-2">
                                {!contactRevealed ? (
                                    <button
                                        onClick={handleRevealContact}
                                        className="w-full py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-emerald-900/40"
                                    >
                                        <Phone className="w-6 h-6" /> Bấm để xem SĐT & Zalo
                                    </button>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Shop Profile Card */}
                        <div className="glass p-6 rounded-4xl border-white/5 space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <MapIcon className="w-5 h-5 text-emerald-500" />
                                </div>
                                <h2 className="text-xl font-black tracking-tight uppercase">Bản đồ vị trí</h2>
                            </div>

                            <div className="relative aspect-square rounded-3xl border border-white/5 overflow-hidden shadow-2xl bg-slate-900">
                                <iframe
                                    title="Google Maps Post Location"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    style={{ border: 0 }}
                                    src={mapEmbedUrl}
                                    allowFullScreen
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500">Địa chỉ</p>
                                    <p className="text-sm font-bold text-slate-200">{locationLabel}</p>
                                </div>

                                <a
                                    href={directionsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-3 transition-all group shadow-xl shadow-emerald-900/40"
                                >
                                    <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                                    Nhận chỉ đường
                                </a>

                                <div className="flex items-center gap-3 text-[10px] text-slate-500 italic bg-white/5 p-3 rounded-xl border border-white/5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                                    <span>{hasExactCoordinates ? 'Vị trí theo tọa độ của nhà vườn.' : 'Vị trí ước tính theo địa chỉ bài đăng.'}</span>
                                </div>
                            </div>
                        </div>

                        {post.shop && (
                            <Link
                                to={`/shop/${post.postShopId}`}
                                className="glass p-8 rounded-4xl border-emerald-500/20 bg-linear-to-br from-emerald-500/5 to-transparent space-y-6 group cursor-pointer overflow-hidden relative block"
                            >
                                <div className="absolute top-0 right-0 p-8 text-emerald-500/10 -rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <Store className="w-24 h-24" />
                                </div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                                        <Store className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{post.shop.shopName}</h3>
                                        <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                            <ShieldCheck className="w-4 h-4" /> Nhà vườn đã xác minh
                                        </div>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed relative z-10 line-clamp-2">{post.shop.shopDescription || 'Cung cấp các mẫu bonsai tuyệt đẹp cho mọi không gian kiến trúc.'}</p>
                                <div className="w-full py-3 rounded-xl border border-emerald-500/30 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-white transition-all text-center">
                                    Xem trang Nhà Vườn
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <ImageModal 
                isOpen={previewImageIndex !== null} 
                images={mediaList
                    .filter(m => m.type === 'image')
                    .map(m => m.url.startsWith('http') ? m.url : `http://localhost:5000${m.url}`)
                }
                initialIndex={previewImageIndex || 0}
                onClose={() => setPreviewImageIndex(null)} 
                alt={post.postTitle}
            />
        </div>
    );
};

export default PostDetail;
