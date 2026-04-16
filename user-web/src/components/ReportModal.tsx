import React, { useState } from 'react';
import { X, UploadCloud, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitReport, uploadImages } from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: number;
  postTitle: string;
}

const REPORT_REASONS = [
  { code: 'scam', label: 'Lừa đảo, gian lận', description: 'Người bán có dấu hiệu lừa đảo hoặc không trung thực.' },
  { code: 'prohibited', label: 'Hàng cấm kinh doanh', description: 'Sản phẩm thuộc danh mục cấm hoặc vi phạm pháp luật.' },
  { code: 'wrong_category', label: 'Sai danh mục', description: 'Bài đăng được đặt sai chuyên mục hoặc thẻ.' },
  { code: 'poor_quality', label: 'Nội dung/Hình ảnh kém', description: 'Hình ảnh mờ, sai thực tế hoặc nội dung rác.' },
  { code: 'other', label: 'Lý do khác', description: 'Các vấn đề khác không nằm trong danh sách trên.' },
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, postId, postTitle }) => {
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState<typeof REPORT_REASONS[0] | null>(null);
  const [note, setNote] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 5) {
        alert('Chỉ được tải lên tối đa 5 ảnh bằng chứng.');
        return;
      }
      setImages([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    setError(null);

    try {
      let evidenceUrls: string[] = [];
      
      // Upload images if any
      if (images.length > 0) {
        const uploadRes = await uploadImages(images);
        evidenceUrls = uploadRes.data.urls;
      }

      await submitReport({
        postId,
        reportReason: selectedReason.label,
        reportReasonCode: selectedReason.code,
        reportNote: note,
        evidenceUrls
      });

      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi gửi báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedReason(null);
    setNote('');
    setImages([]);
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={resetAndClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Báo cáo bài đăng</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: #{postId} • {postTitle}</p>
          </div>
          <button onClick={resetAndClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="text-center py-12 animate-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Gửi báo cáo thành công</h4>
              <p className="text-slate-500 font-medium mb-8">Cảm ơn bạn đã góp phần xây dựng cộng đồng GreenMarket minh bạch. Quản trị viên sẽ xem xét báo cáo này sớm nhất có thể.</p>
              <button 
                onClick={resetAndClose}
                className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black uppercase text-sm tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Đã hiểu
              </button>
            </div>
          ) : (
            <>
              {step === 1 ? (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Bước 1: Chọn lý do vi phạm</p>
                    <div className="grid grid-cols-1 gap-3">
                      {REPORT_REASONS.map((reason) => (
                        <button
                          key={reason.code}
                          onClick={() => setSelectedReason(reason)}
                          className={`w-full text-left p-4 rounded-3xl border-2 transition-all group ${
                            selectedReason?.code === reason.code 
                              ? 'border-emerald-600 bg-emerald-50 shadow-lg shadow-emerald-100' 
                              : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-black uppercase text-sm ${selectedReason?.code === reason.code ? 'text-emerald-700' : 'text-slate-900'}`}>
                              {reason.label}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedReason?.code === reason.code ? 'border-emerald-600 bg-emerald-600' : 'border-slate-200'
                            }`}>
                              {selectedReason?.code === reason.code && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 font-medium leading-relaxed group-hover:text-slate-500 transition-colors">
                            {reason.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    disabled={!selectedReason}
                    onClick={() => setStep(2)}
                    className={`w-full py-4 rounded-3xl font-black uppercase text-sm tracking-widest transition-all ${
                      selectedReason 
                        ? 'bg-emerald-700 text-white hover:bg-emerald-600 shadow-xl shadow-emerald-200 active:scale-95' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Tiếp tục
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                  <div className="space-y-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                      ← Quay lại bước 1
                    </button>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">Bước 2: Chi tiết & Bằng chứng</p>
                      <label className="block text-xs font-black text-slate-900 uppercase tracking-tight mb-2">Thêm ghi chú chi tiết (Tùy chọn)</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none min-h-[120px]"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-tight">Hình ảnh bằng chứng</label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{images.length}/5 Ảnh</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 group">
                            <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" alt="Evidence" />
                            <button 
                              onClick={() => removeImage(idx)}
                              className="absolute top-1.5 right-1.5 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        
                        {images.length < 5 && (
                          <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group">
                            <UploadCloud className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải ảnh</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-shake">
                      <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-rose-600 leading-relaxed uppercase pr-2">{error}</p>
                    </div>
                  )}

                  <button
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="w-full py-5 rounded-3xl bg-emerald-700 hover:bg-emerald-600 text-white font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl shadow-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Đang gửi báo cáo...
                      </>
                    ) : (
                      'Xác nhận gửi báo cáo'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer info */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-emerald-600/30" />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Mọi báo cáo sai sự thật hoặc mang tính phá hoại có thể bị xử lý khóa tài khoản vĩnh viễn.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
