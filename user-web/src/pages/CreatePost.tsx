import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Image as ImageIcon, MapPin, Tag, CircleDollarSign, CheckCircle, ArrowRight, X, UploadCloud } from 'lucide-react';
import { getCategories, getCategoryAttributes, createPost, uploadMedia, getPublicSystemSettings } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrencyInput } from '../hooks/useCurrencyInput';

const CreatePost: React.FC = () => {
    const navigate = useNavigate();

    const { shop } = useAuth();
    const isGardenOwner = shop?.shopStatus === 'active';

    const [categories, setCategories] = useState<any[]>([]);
    const [attributes, setAttributes] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [systemSettings, setSystemSettings] = useState({
        media: {
            maxImagesPerPost: 10,
            maxFileSizeMb: 5,
            enableImageCompression: true,
        },
        postLifecycle: {
            postRateLimitPerHour: 10,
        },
    });
    const [submissionMeta, setSubmissionMeta] = useState<{
        autoApprove: boolean;
        chargedAmount: number;
        planTitle: string | null;
    } | null>(null);

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [videoFiles, setVideoFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<{ url: string, type: 'image' | 'video' }[]>([]);
    const postPriceInput = useCurrencyInput("");

    const [formData, setFormData] = useState({
        categoryId: '',
        postTitle: '',
        postLocation: '',
        attributes: {} as Record<number, string>
    });

    useEffect(() => {
        if (isGardenOwner && shop?.shopLocation) {
            setFormData(prev => ({ ...prev, postLocation: shop.shopLocation as string }));
        }
    }, [isGardenOwner, shop]);

    useEffect(() => {
        const fetchSystemSettings = async () => {
            try {
                const response = await getPublicSystemSettings();
                setSystemSettings({
                    media: {
                        maxImagesPerPost: Number(response.data?.media?.maxImagesPerPost || 10),
                        maxFileSizeMb: Number(response.data?.media?.maxFileSizeMb || 5),
                        enableImageCompression: Boolean(response.data?.media?.enableImageCompression ?? true),
                    },
                    postLifecycle: {
                        postRateLimitPerHour: Number(response.data?.postLifecycle?.postRateLimitPerHour || 10),
                    },
                });
            } catch (error) {
                console.error('Failed to fetch public system settings:', error);
            }
        };

        fetchSystemSettings();
    }, []);

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
        const maxFileSizeBytes = systemSettings.media.maxFileSizeMb * 1024 * 1024;

        const newImages: File[] = [];
        const newVideos: File[] = [];
        const newPreviews: { url: string, type: 'image' | 'video' }[] = [];

        for (const file of selectedFiles) {
            if (file.size > maxFileSizeBytes) {
                alert(`Tệp "${file.name}" vượt quá giới hạn ${systemSettings.media.maxFileSizeMb}MB.`);
                return;
            }

            const url = URL.createObjectURL(file);
            if (file.type.startsWith('image/')) {
                newImages.push(file);
                newPreviews.push({ url, type: 'image' });
            } else if (file.type.startsWith('video/')) {
                newVideos.push(file);
                newPreviews.push({ url, type: 'video' });
            }
        }

        const nextImageCount = imageFiles.length + newImages.length;
        if (nextImageCount > systemSettings.media.maxImagesPerPost) {
            newPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
            alert(`Mỗi bài chỉ được tối đa ${systemSettings.media.maxImagesPerPost} ảnh.`);
            return;
        }

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
            alert("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t áº£nh sáº£n pháº©m!");
            return;
        }


        if (imageFiles.length > systemSettings.media.maxImagesPerPost) {
            alert(`Mỗi bài chỉ được tối đa ${systemSettings.media.maxImagesPerPost} ảnh.`);
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
                postPrice: postPriceInput.rawValue,
                images: imageUrls,
                videos: videoUrls,
                attributes: formattedAttributes
            };

            const createRes = await createPost(payload);
            const createdData = createRes.data || {};
            setSubmissionMeta({
                autoApprove: Boolean(createdData?.postingPolicy?.autoApprove),
                chargedAmount: Number(createdData?.billing?.chargedAmount || 0),
                planTitle: createdData?.postingPolicy?.planTitle || null,
            });
            setSubmitted(true);
        } catch (error: any) {
            console.error("Failed to create post:", error);
            alert(error?.response?.data?.error || "ÄÃ£ cÃ³ lá»—i xáº£y ra khi táº¡o bÃ i Ä‘Äƒng. Vui lÃ²ng thá»­ láº¡i!");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="bg-white p-12 rounded-3xl text-center max-w-md border border-slate-200 shadow-2xl">
                    <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                        <CheckCircle className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 text-slate-900">ÄÄƒng tin thÃ nh cÃ´ng!</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        {submissionMeta?.autoApprove
                            ? "BÃ i Ä‘Äƒng cá»§a báº¡n Ä‘Ã£ hiá»ƒn thá»‹ ngay trÃªn sÃ n. Báº¡n cÃ³ thá»ƒ theo dÃµi hiá»‡u quáº£ táº¡i má»¥c Tin cá»§a tÃ´i."
                            : "BÃ i Ä‘Äƒng cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c gá»­i vÃ  Ä‘ang chá» Admin phÃª duyá»‡t. Báº¡n cÃ³ thá»ƒ theo dÃµi tráº¡ng thÃ¡i táº¡i má»¥c Tin cá»§a tÃ´i."}
                        {submissionMeta?.planTitle ? ` (GÃ³i Ã¡p dá»¥ng: ${submissionMeta.planTitle})` : ""}
                        {submissionMeta?.chargedAmount
                            ? ` PhÃ­ phÃ¡t sinh: ${Number(submissionMeta.chargedAmount).toLocaleString("vi-VN")}Ä‘.`
                            : ""}
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/my-posts')}
                            className="w-full bg-emerald-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 text-white transition-all shadow-lg shadow-emerald-200/50"
                        >
                            Xem tin cá»§a tÃ´i <ArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-slate-100 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200"
                        >
                            ÄÄƒng thÃªm tin má»›i
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-10">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3 text-slate-900">
                    <PlusCircle className="text-emerald-600" /> ÄÄƒng tin rao váº·t
                </h1>
                <p className="text-slate-500 font-medium">Chia sáº» tÃ¡c pháº©m nghá»‡ thuáº­t xanh cá»§a báº¡n tá»›i hÃ ng nghÃ¬n ngÆ°á»i yÃªu cÃ¢y.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Basic Info */}
                <section className="bg-white p-8 rounded-3xl space-y-6 border border-slate-200 shadow-xl">
                    <h2 className="text-xl font-bold border-b border-slate-100 pb-4 text-slate-900 uppercase tracking-tight">ThÃ´ng tin cÆ¡ báº£n</h2>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2 ml-1">
                            <Tag className="w-4 h-4 text-emerald-600" /> TiÃªu Ä‘á» tin *
                        </label>
                        <input
                            required
                            type="text"
                            placeholder="VÃ­ dá»¥: TÃ¹ng la hÃ¡n dÃ¡ng vÄƒn nhÃ¢n cá»‘t cháº­u 10 nÄƒm"
                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm font-medium"
                            value={formData.postTitle}
                            onChange={(e) => setFormData({ ...formData, postTitle: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Danh má»¥c *</label>
                            <select
                                required
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all appearance-none text-slate-900 text-sm font-medium"
                                value={formData.categoryId}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                            >
                                <option value="">Chá»n danh má»¥c</option>
                                {categories.map(cat => (
                                    <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryTitle}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2 ml-1">
                                <CircleDollarSign className="w-4 h-4 text-emerald-600" /> GiÃ¡ bÃ¡n (Ä‘) *
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="0"
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-900 text-sm font-medium"
                                ref={postPriceInput.inputRef}
                                value={postPriceInput.displayValue}
                                onChange={postPriceInput.handleChange}
                                inputMode="numeric"
                            />
                        </div>
                    </div>

                    {!isGardenOwner && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-2 ml-1">
                                <MapPin className="w-4 h-4 text-emerald-600" /> Khu vá»±c giao dá»‹ch
                            </label>
                            <input
                                type="text"
                                placeholder="VÃ­ dá»¥: Tháº¡ch Tháº¥t, HÃ  Ná»™i"
                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-900 text-sm font-medium"
                                value={formData.postLocation}
                                onChange={(e) => setFormData({ ...formData, postLocation: e.target.value })}
                            />
                        </div>
                    )}
                </section>

                {/* Dynamic Attributes */}
                {attributes.length > 0 && (
                    <section className="bg-white p-8 rounded-3xl space-y-6 border border-slate-200 shadow-xl">
                        <h2 className="text-xl font-bold border-b border-slate-100 pb-4 text-slate-900 uppercase tracking-tight">ThÃ´ng sá»‘ chi tiáº¿t</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {attributes.map(attr => (
                                <div key={attr.attributeId} className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">
                                        {attr.attributeTitle} {attr.required && '*'}
                                    </label>
                                    {attr.attributeDataType === 'enum' && attr.attributeOptions ? (
                                        <select
                                            required={attr.required}
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-900 text-sm font-medium"
                                            value={formData.attributes[attr.attributeId] || ''}
                                            onChange={(e) => handleAttributeChange(attr.attributeId, e.target.value)}
                                        >
                                            <option value="">Chá»n {attr.attributeTitle}</option>
                                            {attr.attributeOptions.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            required={attr.required}
                                            type={attr.attributeDataType === 'number' ? 'number' : 'text'}
                                            placeholder={`Nháº­p ${attr.attributeTitle}`}
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-900 text-sm font-medium"
                                            value={formData.attributes[attr.attributeId] || ''}
                                            onChange={(e) => handleAttributeChange(attr.attributeId, e.target.value)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}



                {/* Images & Videos */}
                <section className="bg-white p-8 rounded-3xl space-y-6 border border-slate-200 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 uppercase tracking-tight">
                            <ImageIcon className="w-5 h-5 text-emerald-600" /> HÃ¬nh áº£nh & Video sáº£n pháº©m
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
                                        className="bg-rose-500 p-2 rounded-full text-white hover:scale-110 transition-transform shadow-xl"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                {preview.type === 'video' && (
                                    <div className="absolute top-2 left-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white">
                                        Video
                                    </div>
                                )}
                            </div>
                        ))}

                        <label className="border-2 border-dashed border-slate-200 rounded-2xl aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50 transition-all group">
                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-600 uppercase tracking-tight">Táº£i tá»‡p lÃªn</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </label>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                        <ul className="text-xs text-slate-500 space-y-1 font-medium">
                            <li>• Nên chọn ảnh rõ nét, ánh sáng tốt.</li>
                            <li>• Tối đa {systemSettings.media.maxImagesPerPost} ảnh cho mỗi bài đăng.</li>
                            <li>• Ảnh hoặc video tải lên không vượt quá {systemSettings.media.maxFileSizeMb}MB mỗi tệp.</li>
                            <li>• Hệ thống giới hạn tối đa {systemSettings.postLifecycle.postRateLimitPerHour} bài trong 1 giờ cho mỗi tài khoản.</li>
                            {systemSettings.media.enableImageCompression ? (
                                <li>• Ảnh tải lên sẽ được nén tự động trước khi gửi để tối ưu tốc độ.</li>
                            ) : null}
                        </ul>
                    </div>
                </section>

                {/* Submit */}
                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-700 py-6 rounded-3xl font-bold text-xl hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-200/50"
                    >
                        {submitting ? "Äang xá»­ lÃ½..." : "ÄÄƒng Tin Ngay"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;






