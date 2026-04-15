import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPaymentHistory } from '../services/api';
import { Clock, CheckCircle2, XCircle, ChevronLeft, Zap, Store, Receipt, Calendar } from 'lucide-react';
import { resolveImageUrl } from '../utils/resolveImageUrl';

const formatVnd = (value: number | string) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success':
      return <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-emerald-100 shadow-sm"><CheckCircle2 className="w-3 h-3" /> Thành công</span>;
    case 'failed':
      return <span className="bg-rose-50 text-rose-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-rose-100 shadow-sm"><XCircle className="w-3 h-3" /> Thất bại</span>;
    case 'pending':
    default:
      return <span className="bg-amber-50 text-amber-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase flex items-center gap-1 border border-amber-100 shadow-sm"><Clock className="w-3 h-3" /> Đang chờ</span>;
  }
};

const PersonalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getPaymentHistory();
        setTransactions(res.data?.transactions || []);
        setActivePromotions(res.data?.activePromotions || []);
      } catch (error) {
        console.error('Failed to fetch transaction history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg"></div>
          <div className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
        >
          <ChevronLeft className="w-5 h-5 -ml-0.5" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Bảng điều khiển cá nhân</h1>
          <p className="text-slate-500 font-medium">Lịch sử thanh toán & Dịch vụ đang sử dụng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                <Receipt className="w-5 h-5 text-slate-500" />
              </div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lịch sử giao dịch</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Mã GD / Thời gian</th>
                    <th className="px-6 py-4">Nội dung</th>
                    <th className="px-6 py-4 text-right">Số tiền</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                        Chưa có giao dịch nào
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn, index) => (
                      <tr key={txn.id || index} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">#GD_{txn.id}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" /> {new Date(txn.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 line-clamp-1">{txn.packageTitle || 'Giao dịch hệ thống'}</div>
                          {txn.postTitle && <div className="text-xs text-slate-500 truncate mt-1 max-w-[200px]">Bài: {txn.postTitle}</div>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-black text-slate-900">{formatVnd(txn.amount)}</div>
                        </td>
                        <td className="px-6 py-4 text-center flex justify-center">
                          {getStatusBadge(txn.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile view for transactions */}
          <div className="md:hidden space-y-4">
             <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight ml-2">Lịch sử giao dịch</h2>
             {transactions.length === 0 ? (
               <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 font-medium italic shadow-sm">
                  Chưa có giao dịch nào
               </div>
             ) : (
               transactions.map((txn, index) => (
                 <div key={txn.id || index} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="font-bold text-slate-900">#GD_{txn.id}</div>
                       <div className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                         <Calendar className="w-3 h-3" /> {new Date(txn.createdAt).toLocaleDateString('vi-VN')}
                       </div>
                     </div>
                     {getStatusBadge(txn.status)}
                   </div>
                   <div className="pt-2 border-t border-slate-100">
                     <div className="font-bold text-slate-800">{txn.packageTitle || 'Giao dịch hệ thống'}</div>
                     {txn.postTitle && <div className="text-xs text-slate-500 mt-1">Bài: {txn.postTitle}</div>}
                   </div>
                   <div className="pt-2 flex justify-end">
                     <div className="font-black text-slate-900 text-base">{formatVnd(txn.amount)}</div>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-700 rounded-3xl border border-emerald-600 shadow-xl shadow-emerald-200/50 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-tight">Bài đăng đang đẩy</h2>
            </div>
            
            <div className="space-y-4 relative z-10">
              {activePromotions.length === 0 ? (
                <div className="text-emerald-100 text-sm font-medium text-center py-6">
                  Bạn chưa có bài đăng nào đang chạy dịch vụ ưu tiên hiển thị.
                </div>
              ) : (
                activePromotions.map((promo, idx) => (
                  <div key={promo.promotionId || idx} className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="font-bold text-white line-clamp-1 mb-1">{promo.postTitle}</div>
                    <div className="flex justify-between items-end mt-3">
                      <div className="bg-emerald-800 text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider text-emerald-100 border border-emerald-600/50">
                        {promo.packageTitle}
                      </div>
                      <div className="text-[10px] text-emerald-200 font-medium">
                        Hết hạn: {new Date(promo.endAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDashboard;
