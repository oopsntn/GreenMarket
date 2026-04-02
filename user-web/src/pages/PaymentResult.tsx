import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Receipt, ArrowRight } from 'lucide-react';

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const code = searchParams.get('code');
  const txnRef = searchParams.get('txnRef');
  const message = searchParams.get('message');

  const isSuccess = status === 'success';

  const title = isSuccess ? 'Thanh toan thanh cong' : 'Thanh toan chua thanh cong';
  const subtitle = isSuccess
    ? 'Goi uu tien hien thi da duoc kich hoat cho bai dang cua ban.'
    : 'Giao dich khong thanh cong hoac da bi huy. Ban co the thu lai bat cu luc nao.';

  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <div className="glass rounded-4xl p-8 sm:p-10 border border-white/10 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isSuccess ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-400'}`}>
            {isSuccess ? <CheckCircle2 className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-2">{title}</h1>
          <p className="text-slate-400 mb-8">{subtitle}</p>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5 space-y-2 mb-8">
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <Receipt className="w-4 h-4 text-emerald-500" />
            <span>Thong tin giao dich</span>
          </div>
          <div className="text-xs text-slate-400">Ma VNPay: <span className="text-slate-200">{code || '-'}</span></div>
          <div className="text-xs text-slate-400">Ma don hang: <span className="text-slate-200">{txnRef || '-'}</span></div>
          <div className="text-xs text-slate-400">Trang thai he thong: <span className="text-slate-200">{message || '-'}</span></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/my-posts"
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition-all"
          >
            Quan ly bai dang <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl py-3 font-bold text-center transition-all"
          >
            Ve trang chu
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
