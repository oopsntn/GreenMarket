import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Image as ImageIcon, MapPin, Tag, CircleDollarSign, CheckCircle, ArrowRight, X, UploadCloud, Phone } from 'lucide-react';
import { getCategories, getCategoryAttributes, createPost, uploadMedia } from '../services/api';

const CreatePost: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [categories, setCategories] = useState<any[]>([]);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<{url: string, type: 'image' | 'video'}[]>([]);

    const [formData, setFormData] = useState({
        userId: user?.id || 0,
        categoryId: '',
        postTitle: '',
        postContent: '',
        postPrice: '',
        postLocation: '',
        postContactPhone: user?.mobile || '',
        attributes: {} as Record<number, string>
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await getCategories();
                setCategories(response.data);
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryChange = async (categoryId: string) => {
        setFormData(prev => ({ ...prev, categoryId, attributes: {} }));
        if (!categoryId) {
            setAttributes([]);
            return;
        }

        try {
            const response = await getCategoryAttributes(Number(categoryId));
            setAttributes(response.data);
        } catch (error) {
            console.error("Failed to fetch attributes:", error);
        }
    };

    const handleAttributeChange = (attrId: number, value: string) => {
        setFormData(prev => ({
            ...prev,
            attributes: { ...prev.attributes, [attrId]: value }
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selectedFiles = Array.from(e.target.files);
        
        const newImages: File[] = [];
        const newVideos: File[] = [];
        const newPreviews: {url: string, type: 'image' | 'video'}[] = [];

        selectedFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            if (file.type.startsWith('image/')) {
                newImages.push(file);
                newPreviews.push({ url, type: 'image' });
            } else if (file.type.startsWith('video/')) {
                newVideos.push(file);
                newPreviews.push({ url, type: 'video' });
            }
        });

        setImageFiles(prev => [...prev, ...newImages]);
        setVideoFiles(prev => [...prev, ...newVideos]);
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePreview = (index: number) => {
        const itemToRemove = previews[index];
        URL.revokeObjectURL(itemToRemove.url);

        setPreviews(prev => prev.filter((_, i) => i !== index));
        
        // Find which file array to remove from
        if (itemToRemove.type === 'image') {
            const previewIndexInImages = previews
                .filter((p, i) => i < index && p.type === 'image').length;
            setImageFiles(prev => prev.filter((_, i) => i !== previewIndexInImages));
        } else {
            const previewIndexInVideos = previews
                .filter((p, i) => i < index && p.type === 'video').length;
            setVideoFiles(prev => prev.filter((_, i) => i !== previewIndexInVideos));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (imageFiles.length === 0) {
            alert("Vui lòng chọn ít nhất một ảnh sản phẩm!");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Upload all media files first
            const allFiles = [...imageFiles, ...videoFiles];
            const uploadResponse = await uploadMedia(allFiles);
            const mediaUrls = uploadResponse.data.urls;

            // Split URLs back into images and videos
            const imageUrls = mediaUrls.filter((url: string) => 
                url.match(/\.(jpg|jpeg|png|webp)$/i)
            );
            const videoUrls = mediaUrls.filter((url: string) => 
                url.match(/\.(mp4|mov|avi)$/i)
            );

            // 2. Format attributes
            const formattedAttributes = Object.entries(formData.attributes).map(([id, val]) => ({
                attributeId: Number(id),
                value: val
            }));

            // 3. Submit final post
            const payload = {
                ...formData,
                categoryId: Number(formData.categoryId),
                images: imageUrls,
                videos: videoUrls,
                attributes: formattedAttributes
            };

            await createPost(payload);
            setSubmitted(true);
        } catch (error) {
            console.error("Failed to create post:", error);
            alert("Đã có lỗi xảy ra khi tạo bài đăng. Vui lòng thử lại!");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="glass p-12 rounded-3xl text-center max-w-md">
                    <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Đăng tin thành công!</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Bài đăng của bạn đã được gửi và đang chờ Admin phê duyệt. Bạn có thể theo dõi trạng thái tại mục "Tin của tôi".
                    </p>
                    <div className="space-y-4">
                        <button 
                            onClick={() => navigate('/my-posts')}
                            className="w-full bg-emerald-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all"
                        >
                            Xem tin của tôi <ArrowRight className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-800 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-all"
                        >
                            Đăng thêm tin mới
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <PlusCircle className="text-emerald-500" /> Đăng tin rao vặt
                </h1>
                <p className="text-slate-400">Chia sẻ tác phẩm nghệ thuật xanh của bạn tới hàng nghìn người yêu cây.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Basic Info */}
                <section className="glass p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-semibold border-b border-white/5 pb-4">Thông tin cơ bản</h2>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-500" /> Tiêu đề tin *
                        </label>
                        <input 
                            required
                            type="text"
                            placeholder="Ví dụ: Tùng la hán dáng văn nhân cốt chậu 10 năm"
                            className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                            value={formData.postTitle}
                            onChange={(e) => setFormData({...formData, postTitle: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400">Danh mục *</label>
                            <select 
                                required
                                className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all appearance-none"
                                value={formData.categoryId}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryTitle}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <CircleDollarSign className="w-4 h-4 text-emerald-500" /> Giá bán (đ) *
                            </label>
                            <input 
                                required
                                type="number"
                                placeholder="0"
                                className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                                value={formData.postPrice}
                                onChange={(e) => setFormData({...formData, postPrice: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-500" /> Khu vực giao dịch
                            </label>
                            <input 
                                type="text"
                                placeholder="Ví dụ: Thạch Thất, Hà Nội"
                                className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                                value={formData.postLocation}
                                onChange={(e) => setFormData({...formData, postLocation: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-emerald-500" /> Số điện thoại liên hệ *
                            </label>
                            <input 
                                required
                                type="text"
                                placeholder="Ví dụ: 0912345678"
                                className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                                value={formData.postContactPhone}
                                onChange={(e) => setFormData({...formData, postContactPhone: e.target.value})}
                            />
                        </div>
                    </div>
                </section>

                {/* Dynamic Attributes */}
                {attributes.length > 0 && (
                    <section className="glass p-8 rounded-3xl space-y-6">
                        <h2 className="text-xl font-semibold border-b border-white/5 pb-4">Thông số chi tiết</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {attributes.map(attr => (
                                <div key={attr.attributeId} className="space-y-2">
                                    <label className="text-sm font-medium text-slate-400">
                                        {attr.attributeTitle} {attr.required && '*'}
                                    </label>
                                    {attr.attributeDataType === 'enum' && attr.attributeOptions ? (
                                        <select 
                                            required={attr.required}
                                            className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                                            value={formData.attributes[attr.attributeId] || ''}
                                            onChange={(e) => handleAttributeChange(attr.attributeId, e.target.value)}
                                        >
                                            <option value="">Chọn {attr.attributeTitle}</option>
                                            {attr.attributeOptions.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input 
                                            required={attr.required}
                                            type={attr.attributeDataType === 'number' ? 'number' : 'text'}
                                            placeholder={`Nhập ${attr.attributeTitle}`}
                                            className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                                            value={formData.attributes[attr.attributeId] || ''}
                                            onChange={(e) => handleAttributeChange(attr.attributeId, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Content */}
                <section className="glass p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-semibold border-b border-white/5 pb-4">Mô tả chi tiết</h2>
                    <textarea 
                        rows={6}
                        placeholder="Mô tả chi tiết về cây: tuổi thọ, kích thước, nguồn gốc, chế độ chăm sóc..."
                        className="w-full bg-surface border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all"
                        value={formData.postContent}
                        onChange={(e) => setFormData({...formData, postContent: e.target.value})}
                    />
                </section>

                {/* Images & Videos */}
                <section className="glass p-8 rounded-3xl space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-emerald-500" /> Hình ảnh & Video sản phẩm
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                                {preview.type === 'image' ? (
                                    <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <video src={preview.url} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        type="button"
                                        onClick={() => removePreview(index)}
                                        className="bg-rose-500 p-2 rounded-full text-white hover:scale-110 transition-transform"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {preview.type === 'video' && (
                                    <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                                        Video
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        <label className="border-2 border-dashed border-white/10 rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group">
                            <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-xs font-medium text-slate-500 group-hover:text-emerald-400">Tải tệp lên</span>
                            <input 
                                type="file" 
                                multiple 
                                accept="image/*,video/*" 
                                className="hidden" 
                                onChange={handleFileSelect}
                            />
                        </label>
                    </div>

                    <div className="bg-emerald-500/5 p-4 rounded-2xl">
                        <ul className="text-xs text-slate-400 space-y-1">
                            <li>• Nên chọn ảnh rõ nét, ánh sáng tốt.</li>
                            <li>• Bạn có thể chọn nhiều ảnh cùng lúc.</li>
                            <li>• Video giúp bài đăng tin cậy hơn (tối đa 50MB).</li>
                        </ul>
                    </div>
                </section>

                {/* Submit */}
                <div className="pt-6">
                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-600 py-6 rounded-3xl font-bold text-xl hover:bg-emerald-500 disabled:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
                    >
                        {submitting ? "Đang xử lý..." : "Đăng Tin Ngay"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
