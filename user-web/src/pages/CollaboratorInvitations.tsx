import React, { useState, useEffect } from 'react';
import { 
  Bell, Check, X, Store, User, Calendar, 
  ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import { 
  getMyCollaboratorInvitations, 
  respondToCollaboratorInvitation, 
  type CollaboratorInvitation 
} from '../services/api';
import { toast } from 'react-hot-toast';

const CollaboratorInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<CollaboratorInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await getMyCollaboratorInvitations();
      setInvitations(res.data);
    } catch (error) {
      toast.error('Không thể tải danh sách lời mời');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (id: number, action: 'accept' | 'reject') => {
    try {
      setProcessingId(id);
      await respondToCollaboratorInvitation(id, action);
      toast.success(action === 'accept' ? 'Đã chấp nhận lời mời!' : 'Đã từ chối lời mời');
      setInvitations(prev => prev.filter(inv => inv.invitationId !== id));
    } catch (error) {
      toast.error('Xử lý lời mời thất bại');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <Bell className="w-8 h-8 text-emerald-600" />
              Lời mời hợp tác
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Bạn có {invitations.length} lời mời đang chờ xử lý từ các nhà vườn.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
            Hợp tác an toàn
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-white rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 text-center border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có lời mời nào</h3>
            <p className="text-slate-500 max-w-xs mx-auto font-medium">
              Khi có nhà vườn muốn mời bạn hợp tác, thông tin sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {invitations.map((inv) => (
              <div 
                key={inv.invitationId} 
                className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-center gap-8 transition-transform hover:scale-[1.01]"
              >
                <div className="relative">
                  <img 
                    src={inv.shopLogoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inv.shopName)}&background=0284c7&color=fff&size=128`}
                    alt={inv.shopName}
                    className="w-24 h-24 rounded-3xl object-cover shadow-lg border-4 border-slate-50"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100">
                    <Store className="w-5 h-5 text-sky-600" />
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {inv.shopName}
                    </h3>
                    <span className="w-fit mx-auto md:mx-0 px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-sky-100">
                      GARDEN OWNER
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 font-medium">
                    <p className="text-slate-600 flex items-center justify-center md:justify-start gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      Chủ vườn: <span className="text-slate-900">{inv.shopOwnerName}</span>
                    </p>
                    <p className="text-slate-400 text-sm flex items-center justify-center md:justify-start gap-2">
                      <Calendar className="w-4 h-4" />
                      Nhận ngày: {new Date(inv.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => handleResponse(inv.invitationId, 'reject')}
                    disabled={!!processingId}
                    className="flex-1 md:flex-none p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all group"
                    title="Từ chối"
                  >
                    <X className="w-6 h-6 group-active:scale-90" />
                  </button>
                  <button 
                    onClick={() => handleResponse(inv.invitationId, 'accept')}
                    disabled={!!processingId}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-[1.25rem] font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-[0.98] group"
                  >
                    {processingId === inv.invitationId ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Chấp nhận
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold">Bạn có biết?</h4>
            </div>
            <p className="text-slate-300 leading-relaxed font-medium mb-6">
              Khi chấp nhận lời mời, nhà vườn có thể xem được số điện thoại của bạn để liên hệ trực tiếp. Bạn cũng sẽ có quyền đăng bài nhân danh nhà vườn đó và bài viết sẽ được gửi tới trang quản lý của họ để duyệt.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm cursor-pointer hover:gap-3 transition-all">
              Tìm hiểu thêm về chính sách hợp tác
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorInvitations;
