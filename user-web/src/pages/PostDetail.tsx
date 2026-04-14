import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPostDetail, recordContactClick, recordShopContactClick, submitReport, checkIsSaved, toggleFavoritePost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Phone, Calendar, ChevronLeft, ChevronRight,
    Store, ShieldCheck, Share2, Heart, MessageCircle,
    Play, ShoppingBag, Eye, AlertCircle, Map as MapIcon, ExternalLink, ZoomIn, Settings, Check
} from 'lucide-react';
import ImageModal from '../components/ImageModal';
import { resolveImageUrl } from '../utils/resolveImageUrl';

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
    const [copied, setCopied] = useState(false);

    const isOwner = Boolean(user && post && (user.id === post.postAuthorId || user.id === post.postShopId));

    const handleRevealContact = async () => {
        setContactRevealed(true);
        if (post?.postId) {
            try {
                await recordContactClick(post.postId);
                if (post.postShopId) {
                    await recordShopContactClick(post.postShopId);
                }
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
            navigate('/login');
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

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        const fetchDetail = async () => {
            if (!slug) return;
            try {
                const response = await getPostDetail(slug);
                setPost(response.data);

                if (response.data?.postId && user) {
                    try {
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
    }, [slug, user]);

    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return 'vừa xong';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays} ngày trước`;
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
        const diffInYears = Math.floor(diffInMonths / 12);
        return `${diffInYears} năm trước`;
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg"></div>
                <div className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Đang tải chi tiết...</div>
            </div>
        </div>
    );

    if (!post) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
            <ShoppingBag className="w-16 h-16 text-slate-200" />
            <div className="text-slate-400 font-bold uppercase tracking-tight">Không tìm thấy bài đăng</div>
            <button onClick={() => navigate('/home')} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-200">Quay lại trang chủ</button>
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
    const locationLabel = post?.shop?.shopLocation || post?.postLocation || 'Chưa cập nhật địa chỉ';
    const mapEmbedUrl = hasExactCoordinates
        ? `https://maps.google.com/maps?q=${post.shop.shopLat},${post.shop.shopLng}&t=&z=14&ie=UTF8&iwloc=&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(locationLabel)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
    const directionsUrl = hasExactCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${post.shop.shopLat},${post.shop.shopLng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`;

    return (
        <div className="min-h-screen pb-24 bg-background">
            {/* Top Navigation Bar */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors group font-black uppercase text-[10px] tracking-widest">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Quay lại
                    </button>
                    <div className="flex items-center gap-4">
                        {isOwner ? (
                            <Link
                                to={`/my-posts`}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 font-black uppercase text-[10px] tracking-widest"
                            >
                                <Settings className="w-4 h-4" /> Quản lý bài đăng
                            </Link>
                        ) : (
                            <>
                                <button
                                    onClick={handleToggleSave}
                                    className={`p-2.5 rounded-xl border transition-all ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200'}`}
                                    title={isSaved ? "Bỏ lưu bài" : "Lưu bài"}
                                >
                                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500' : ''}`} />
                                </button>
                                <button
                                    onClick={handleReport}
                                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 transition-all"
                                    title="Báo cáo bài đăng"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={handleShare}
                            className={`p-2.5 rounded-xl border transition-all ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200'}`}
                            title="Sao chép liên kết"
                        >
                            {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Media Gallery */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative aspect-3/2 max-h-[520px] rounded-4xl overflow-hidden bg-slate-50 border border-slate-200 group shadow-2xl shadow-slate-200/50">
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
                                                src={resolveImageUrl(currentMedia.url)}
                                                alt={post.postTitle}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/main:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-emerald-900/5 opacity-0 group-hover/main:opacity-100 transition-all flex items-center justify-center">
                                                <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-md border border-white shadow-2xl">
                                                    <ZoomIn className="w-8 h-8 text-emerald-600" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <video
                                            src={resolveImageUrl(currentMedia.url)}
                                            controls
                                            className="w-full h-full object-contain bg-black"
                                        />
                                    )}

                                    {/* Arrow Navigation */}
                                    {mediaList.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setActiveMediaIndex(prev => prev === 0 ? mediaList.length - 1 : prev - 1)}
                                                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-3xl bg-white/90 backdrop-blur-md text-slate-900 border border-white opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600 hover:text-white shadow-xl"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <button
                                                onClick={() => setActiveMediaIndex(prev => prev === mediaList.length - 1 ? 0 : prev + 1)}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-3xl bg-white/90 backdrop-blur-md text-slate-900 border border-white opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-600 hover:text-white shadow-xl"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                    <ShoppingBag className="w-16 h-16 mb-4 opacity-20" />
                                    <span className="font-black uppercase text-[10px] tracking-widest">Chưa có hình ảnh</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                            {mediaList.map((media, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveMediaIndex(idx)}
                                    className={`relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${activeMediaIndex === idx ? 'border-emerald-500 scale-105 shadow-xl' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
                                >
                                    {media.type === 'image' ? (
                                        <img src={resolveImageUrl(media.url)} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                            <Play className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>



                        {/* Specifications/Attributes */}
                        {post.attributes && post.attributes.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black flex items-center gap-4 text-slate-900 uppercase tracking-tight leading-none group">
                                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full group-hover:scale-y-125 transition-transform"></div>
                                    Thông số kỹ thuật
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {post.attributes.map((attr: any, idx: number) => (
                                        <div key={idx} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex items-center justify-between hover:bg-white transition-colors">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{attr.name || `Thông số ${idx + 1}`}</span>
                                            <span className="text-slate-900 font-black uppercase text-sm">{attr.value}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 italic font-medium">* Tất cả kích thước mang tính chất tương đối và được chủ vườn đo đạc trực tiếp.</p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Information Card */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Summary Card */}
                        <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight group-hover:text-emerald-700 transition-colors">{post.postTitle}</h1>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Xác minh
                                        </div>
                                        <div className="text-slate-400 text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {formatRelativeTime(post.postCreatedAt)}
                                        </div>
                                        <div className="text-slate-400 text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                                            <Eye className="w-3.5 h-3.5 text-emerald-600" /> {post.postViewCount || 1} khách xem
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3">
                                    <span className="text-5xl font-black text-emerald-700">{formatPrice(post.postPrice)}</span>
                                </div>

                                {!isOwner && (
                                    <div className="space-y-2">
                                        {!contactRevealed ? (
                                            <button
                                                onClick={handleRevealContact}
                                                className="w-full py-5 rounded-3xl bg-emerald-700 hover:bg-emerald-600 text-white font-black uppercase text-sm tracking-widest flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl shadow-emerald-200"
                                            >
                                                <Phone className="w-6 h-6" /> Hiện số điện thoại & Zalo
                                            </button>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                <a
                                                    href={`tel:${post.shop?.shopPhone || post.postContactPhone}`}
                                                    className="w-full py-5 rounded-3xl bg-emerald-700 hover:bg-emerald-600 text-white font-black uppercase text-sm tracking-widest flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-2xl shadow-emerald-200"
                                                >
                                                    <Phone className="w-6 h-6" /> {post.shop?.shopPhone || post.postContactPhone || 'Liên hệ ngay'}
                                                </a>
                                                <a
                                                    href={`https://zalo.me/${post.shop?.shopPhone || post.postContactPhone}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-5 rounded-3xl bg-white border border-slate-200 text-emerald-700 font-black uppercase text-sm tracking-widest flex items-center justify-center gap-4 transition-all hover:bg-emerald-50 active:scale-[0.98]"
                                                >
                                                    <MessageCircle className="w-6 h-6" /> Chat qua Zalo
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!isOwner && (
                                post.shop ? (
                                    <Link
                                        to={`/shop/${post.postShopId}`}
                                        className="group bg-white p-8 rounded-4xl border border-slate-200 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500 relative overflow-hidden block"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                                        <div className="flex items-center gap-6 relative z-10 mb-6">
                                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-500">
                                                <Store className="w-10 h-10" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 leading-none mb-2 uppercase group-hover:text-emerald-700 transition-colors">{post.shop.shopName}</h3>
                                                <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
                                                    <ShieldCheck className="w-4 h-4" /> Nhà vườn uy tín
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium line-clamp-3 italic">
                                            {post.shop.shopDescription || 'Đang cập nhật giới thiệu chi tiết về không gian và phong cách của nhà vườn.'}
                                        </p>
                                        <div className="w-full py-4 rounded-2xl bg-slate-50 text-slate-900 border border-slate-200 font-black uppercase text-[10px] tracking-widest text-center transition-all group-hover:bg-emerald-700 group-hover:text-white group-hover:border-emerald-700">
                                            Xem đầy đủ nhà vườn
                                        </div>
                                    </Link>
                                ) : post.author ? (
                                    <div className="group bg-white p-8 rounded-4xl border border-slate-200 shadow-xl relative overflow-hidden block">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                                        <div className="flex items-center gap-6 relative z-10 mb-6">
                                            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl overflow-hidden flex items-center justify-center text-indigo-600 shrink-0">
                                                {post.author.userAvatarUrl ? (
                                                    <img src={resolveImageUrl(post.author.userAvatarUrl)} className="w-full h-full object-cover" alt={post.author.userDisplayName || post.author.userMobile} />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-900 leading-none mb-2 uppercase transition-colors">{post.author.userDisplayName || post.author.userMobile || 'Người bán'}</h3>
                                                <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-widest">
                                                    <ShieldCheck className="w-4 h-4" /> Cá nhân bán hàng
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium line-clamp-3 italic">
                                            {post.author.userBio || 'Người bán cá nhân trên GreenMarket.'}
                                        </p>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4 border-t border-slate-100">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tham gia từ {new Date(post.author.userCreatedAt).getFullYear()}</span>
                                        </div>
                                    </div>
                                ) : null
                            )}
                        </div>

                        {!isOwner && (
                            <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-6">
                                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                        <MapIcon className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Vị trí nhà vườn</h2>
                                </div>

                                <div className="relative aspect-square rounded-3xl border border-slate-200 overflow-hidden shadow-inner bg-slate-100">
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

                                <div className="space-y-6 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Địa chỉ chi tiết</p>
                                        <p className="text-base font-bold text-slate-900 leading-relaxed">{locationLabel}</p>
                                    </div>
                                    <a
                                        href={directionsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-slate-50 shadow-sm active:scale-95"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Chỉ đường tới vườn
                                    </a>
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 group transition-colors hover:bg-emerald-50 hover:border-emerald-100">
                                        <ShieldCheck className="w-5 h-5 text-emerald-600/30 group-hover:text-emerald-500 transition-colors" />
                                        <span className="text-[10px] text-slate-400 font-medium leading-relaxed group-hover:text-emerald-700">
                                            {hasExactCoordinates ? 'Vị trí này được cung cấp bởi hệ thống định vị GPS của nhà vườn.' : 'Vị trí này được ước lượng dựa trên thông tin địa chỉ đăng tải.'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </div>
            </div>

            <ImageModal
                isOpen={previewImageIndex !== null}
                images={mediaList
                    .filter(m => m.type === 'image')
                    .map(m => resolveImageUrl(m.url))
                }
                initialIndex={previewImageIndex || 0}
                onClose={() => setPreviewImageIndex(null)}
                alt={post.postTitle}
            />
        </div>
    );
};

export default PostDetail;
