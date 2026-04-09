import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Receipt, ArrowRight, Home } from 'lucide-react';

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const code = searchParams.get('code');
  const txnRef = searchParams.get('txnRef');
  const message = searchParams.get('message');

  const isSuccess = status === 'success';

  const title = isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa hoàn tất';
  const subtitle = isSuccess
    ? 'Cảm ơn bạn! Gói ưu tiên hiển thị đã được kích hoạt thành công cho bài đăng của bạn.'
    : 'Rất tiếc, giao dịch không thành công hoặc đã bị hủy. Bạn có thể thử lại bất cứ lúc nào.';

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background px-4 py-20">
      <div className="bg-white rounded-4xl p-8 sm:p-12 border border-slate-200 shadow-2xl shadow-emerald-500/5 max-w-xl w-full relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-8 border shadow-sm transition-transform hover:scale-105 active:scale-95 ${isSuccess ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            {isSuccess ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-3 text-slate-900 uppercase leading-tight">{title}</h1>
          <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">{subtitle}</p>
        </div>

        <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 space-y-4 mb-10 relative z-10 transition-colors hover:bg-slate-100/50">
          <div className="flex items-center gap-3 text-slate-900 font-black uppercase tracking-widest text-xs mb-2 pb-2 border-b border-slate-200/50">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Chi tiết giao dịch</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Mã MoMo:</span>
            <span className="text-slate-900 font-mono font-bold bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{code || '-'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Mã đơn hàng:</span>
            <span className="text-slate-900 font-mono font-bold bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">{txnRef || '-'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Trạng thái:</span>
            <span className="text-slate-900 font-bold truncate max-w-[180px] text-right">{message || (isSuccess ? 'Thành công' : 'Thất bại')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <Link
            to="/my-posts"
            className="bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-200/50 active:scale-95"
          >
            Quản lý bài đăng <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/"
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl py-4 font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all border border-slate-200 active:scale-95"
          >
            <Home className="w-5 h-5" /> Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
