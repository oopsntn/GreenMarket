import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, Store, ShieldCheck, Zap } from 'lucide-react';

const Splash: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center bg-background px-4 text-center overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-3xl -mr-48 -mt-48 rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 blur-3xl -ml-48 -mb-48 rounded-full"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex justify-center mb-8">
          <div className="bg-emerald-50 p-6 rounded-4xl border border-emerald-100 shadow-xl shadow-emerald-500/10 transition-transform hover:scale-110 active:scale-95 duration-500">
            <Leaf className="w-16 h-16 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-6 tracking-tight uppercase leading-tight">
          Chợ <span className="text-emerald-700">Bonsai</span> <br /> Hữu Tình
        </h1>

        <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
          Nơi kết nối các nhà vườn uy tín và người yêu cây cảnh nghệ thuật trên toàn quốc. Trải nghiệm không gian mua sắm xanh, hiện đại và tin cậy.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
            onClick={() => navigate('/home')}
            className="group relative bg-emerald-700 hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-2xl shadow-emerald-200 active:scale-95 flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            Bắt đầu khám phá <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => navigate('/shops')}
            className="bg-white border border-slate-200 text-slate-600 px-10 py-5 rounded-2xl font-black uppercase text-sm tracking-widest transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm"
          >
            Tìm nhà vườn
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/50 p-6 rounded-3xl border border-slate-100 backdrop-blur-sm shadow-sm transition-all hover:shadow-lg hover:border-emerald-100 group">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 transition-transform group-hover:scale-110">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-2">Nhà vườn uy tín</h3>
            <p className="text-slate-500 text-sm font-medium">Tất cả đối tác đều được xác thực thông tin và chất lượng vườn.</p>
          </div>

          <div className="bg-white/50 p-6 rounded-3xl border border-slate-100 backdrop-blur-sm shadow-sm transition-all hover:shadow-lg hover:border-emerald-100 group">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 transition-transform group-hover:scale-110">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-2">Giao dịch trực tiếp</h3>
            <p className="text-slate-500 text-sm font-medium">Kết nối thẳng tới chủ vườn để nhận tư vấn và giá tốt nhất.</p>
          </div>

          <div className="bg-white/50 p-6 rounded-3xl border border-slate-100 backdrop-blur-sm shadow-sm transition-all hover:shadow-lg hover:border-emerald-100 group">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 transition-transform group-hover:scale-110">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-slate-900 font-black uppercase text-xs tracking-widest mb-2">Tin rao mới mỗi ngày</h3>
            <p className="text-slate-500 text-sm font-medium">Hàng ngàn mẫu cây bonsai quý hiếm được đăng tải liên tục.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;