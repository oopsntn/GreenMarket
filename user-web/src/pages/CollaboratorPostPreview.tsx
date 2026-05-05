import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getPendingPostDetail, 
    approveCollaboratorPost, 
    rejectCollaboratorPost 
} from '../services/api';
import {
    Calendar, ChevronLeft, ChevronRight,
    Store, ShieldCheck, Share2, 
    Play, ShoppingBag, Eye, Map as MapIcon, ExternalLink, ZoomIn, Check, X,
    UserCircle
} from 'lucide-react';
import ImageModal from '../components/ImageModal';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { toast } from 'react-hot-toast';

const CollaboratorPostPreview: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
    const [acting, setActing] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!id) return;
            try {
                const response = await getPendingPostDetail(id);
                setPost(response.data);
            } catch (error) {
                console.error("Failed to fetch pending post detail:", error);
                toast.error("Không thể tải thông tin bài đăng");
                navigate('/owner-dashboard/team');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    const handleApprove = async () => {
        if (!id) return;
        try {
            setActing(true);
            await approveCollaboratorPost(parseInt(id));
            toast.success('Đã duyệt bài đăng!');
            navigate('/owner-dashboard/team');
        } catch (error) {
            toast.error('Duyệt bài thất bại');
        } finally {
            setActing(false);
        }
    };

    const handleReject = async () => {
        if (!id) return;
        const reason = window.prompt('Lý do từ chối bài viết:');
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }

        try {
            setActing(true);
            await rejectCollaboratorPost(parseInt(id), reason);
            toast.success('Đã từ chối bài viết');
            navigate('/owner-dashboard/team');
        } catch (error) {
            toast.error('Thao tác thất bại');
        } finally {
            setActing(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg"></div>
                <div className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Đang tải bản xem trước...</div>
            </div>
        </div>
    );

    if (!post) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
            <ShoppingBag className="w-16 h-16 text-slate-200" />
            <div className="text-slate-400 font-bold uppercase tracking-tight">Không tìm thấy bài đăng</div>
            <button onClick={() => navigate('/owner-dashboard/team')} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Quay lại</button>
        </div>
    );

    const mediaList = [
        ...(post.images || []).map((img: any) => ({ type: 'image', url: img.imageUrl })),
        ...(post.videos || []).map((vid: any) => ({ type: 'video', url: vid.videoUrl }))
    ];

    const currentMedia = mediaList[activeMediaIndex];

    const hasExactCoordinates = Boolean(post?.shop?.shopLat && post?.shop?.shopLng);
    const locationLabel = post?.shop?.shopLocation || post?.postLocation || 'Chưa cập nhật địa chỉ';
    const mapEmbedUrl = hasExactCoordinates
        ? `https://maps.google.com/maps?q=${post.shop.shopLat},${post.shop.shopLng}&t=&z=14&ie=UTF8&iwloc=&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(locationLabel)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

    return (
        <div className="min-h-screen pb-24 bg-background">
            {/* Top Navigation Bar with Actions */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 py-4 mb-8">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors group font-black uppercase text-[10px] tracking-widest">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Quay lại
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <span className="hidden md:block mr-4 text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                            Chế độ xem trước
                        </span>
                        <button
                            onClick={handleReject}
                            disabled={acting}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                        >
                            <X className="w-4 h-4" /> Từ chối
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={acting}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 font-black uppercase text-[10px] tracking-widest disabled:opacity-50"
                        >
                            {acting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <Check className="w-4 h-4" />}
                            Duyệt bài
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Warning banner for preview */}
                <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                    <Eye className="w-6 h-6 text-blue-500" />
                    <div>
                        <p className="text-sm font-bold text-blue-900">Bạn đang xem trước bài đăng của cộng tác viên</p>
                        <p className="text-xs text-blue-600">Đây là nội dung mà khách hàng sẽ nhìn thấy sau khi bạn duyệt bài.</p>
                    </div>
                </div>

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
                            </div>
                        )}
                    </div>

                    {/* Right Column: Information Card */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8 relative overflow-hidden">
                            <div className="space-y-6 relative z-10">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight transition-colors">
                                        {post.postTitle}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Chờ duyệt
                                        </div>
                                        <div className="text-slate-400 text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {new Date(post.postCreatedAt).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="text-slate-400 text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                                            <UserCircle className="w-3.5 h-3.5 text-emerald-600" /> CTV: {post.authorName || post.authorMobile}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-baseline gap-2 border-b border-slate-100 pb-3">
                                    <span className="text-5xl font-black text-emerald-700">Giá tiền: Liên hệ</span>
                                </div>

                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Mô tả chi tiết</h3>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{post.postDescription}</p>
                                </div>
                            </div>

                            {post.shop && (
                                <div className="group bg-white p-8 rounded-4xl border border-slate-200 shadow-xl relative overflow-hidden">
                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center text-emerald-600">
                                            <Store className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 leading-none mb-2 uppercase">{post.shop.shopName}</h3>
                                            <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-widest">
                                                <ShieldCheck className="w-4 h-4" /> Nhà vườn của bạn
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-4xl border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <MapIcon className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Vị trí</h2>
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

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Địa chỉ</p>
                                <p className="text-base font-bold text-slate-900 leading-relaxed">{locationLabel}</p>
                            </div>
                        </div>
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

export default CollaboratorPostPreview;
