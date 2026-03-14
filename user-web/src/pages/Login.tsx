import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestOtp, verifyOtp } from '../services/api';
import { Phone, Lock, ArrowRight, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit if complete
    if (newOtp.every(digit => digit !== '') && index === 5) {
      handleVerifyOtp(undefined, newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestOtp(mobile);
      setStep('otp');
    } catch (error) {
      console.error("OTP Request failed:", error);
      alert("Không thể gửi OTP. Vui lòng kiểm tra lại số điện thoại.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent, fullOtp?: string) => {
    if (e) e.preventDefault();
    const finalOtp = fullOtp || otp.join('');
    if (finalOtp.length !== 6) return;

    setLoading(true);
    try {
      const response = await verifyOtp(mobile, finalOtp);
      login(response.data.token, response.data.user);
      navigate('/');
    } catch (error) {
      console.error("OTP Verification failed:", error);
      alert("Mã OTP không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -z-10" />
        
        <div className="text-center mb-10">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
            {step === 'mobile' ? <Phone className="w-8 h-8 text-emerald-500" /> : <Lock className="w-8 h-8 text-emerald-500" />}
          </div>
          <h1 className="text-3xl font-black mb-2">
            {step === 'mobile' ? 'Chào mừng bạn' : 'Xác thực OTP'}
          </h1>
          <p className="text-slate-400">
            {step === 'mobile' ? 'Nhập số điện thoại để tiếp tục' : `Chúng tôi đã gửi mã tới ${mobile}`}
          </p>
        </div>

        {step === 'mobile' ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                required
                type="tel"
                className="w-full bg-surface border border-white/10 pl-12 pr-4 py-4 rounded-2xl focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
                placeholder="09xx xxx xxx"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-700"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Tiếp tục <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => handleVerifyOtp(e)} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-12 h-14 bg-surface border border-white/10 rounded-xl text-center text-2xl font-bold text-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-lg"
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                />
              ))}
            </div>
            <button 
              type="submit"
              disabled={loading || otp.some(d => d === '')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Xác nhận Đăng nhập'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setStep('mobile');
                setOtp(['', '', '', '', '', '']);
              }}
              className="w-full text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors"
            >
              Đổi số điện thoại
            </button>
          </form>
        )}

        <div className="mt-10 text-center text-xs text-slate-500 leading-relaxed">
          Bằng cách tiếp tục, bạn đồng ý với <span className="text-slate-400 underline cursor-pointer">Điều khoản dịch vụ</span> và <span className="text-slate-400 underline cursor-pointer">Chính sách bảo mật</span> của GreenMarket.
        </div>
      </div>
    </div>
  );
};

export default Login;
