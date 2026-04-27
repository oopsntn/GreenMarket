import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useAuth } from '../context/AuthContext';
import { requestOtp, verifyOtp, generateQrSession, checkQrStatus } from '../services/api';
import { Phone, Lock, ArrowRight, Loader2, QrCode, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { io } from 'socket.io-client';

const Login: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<'qr' | 'mobile'>('qr');

  // Mobile/OTP State
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);

  // QR State
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<'pending' | 'scanned' | 'authorized' | 'expired'>('pending');
  const socketRef = useRef<any>(null);
  const refreshTimerRef = useRef<any>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- QR Logic ---
  const initQr = async () => {
    setLoading(true);
    setQrStatus('pending');
    try {
      const res = await generateQrSession();
      const sessionId = res.data.sessionId;
      setQrSessionId(sessionId);

      // Setup Socket.io
      const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
      const socket = io(socketUrl);
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log("Connected to socket server");
        socket.emit('join-qr-session', sessionId);
      });

      socket.on('qr-status-updated', (data: any) => {
        console.log("QR Status Updated:", data);
        setQrStatus(data.status);
        if (data.status === 'authorized' && data.token) {
          const user = data.user;
          const allowedRoles = ['USER', null, undefined];
          if (!allowedRoles.includes(user?.businessRoleCode)) {
            alert("Tài khoản của bạn chỉ được phép đăng nhập và sử dụng trên ứng dụng GreenMarket Mobile.");
            setQrStatus('pending');
            return;
          }

          login(data.token, user);
          navigate('/home');
        }
      });

      socket.on('disconnect', () => {
        console.log("Disconnected from socket server");
      });

      // Auto refresh after 5 minutes
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        console.log("QR Session expired, refreshing...");
        initQr();
      }, 2 * 60 * 1000);

    } catch (error) {
      console.error("QR Generate failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loginMethod === 'qr') {
      initQr();
    } else {
      setQrSessionId(null);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [loginMethod]);

  // --- Mobile/OTP Logic ---
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

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

    if (mobile.length !== 10) {
      alert("Số điện thoại phải có đúng 10 chữ số.");
      setLoading(false);
      return;
    }

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
      const user = response.data.user;

      const allowedRoles = ['USER', null, undefined];
      if (!allowedRoles.includes(user?.businessRoleCode)) {
        alert("Tài khoản của bạn chỉ được phép đăng nhập và sử dụng trên ứng dụng GreenMarket Mobile.");
        setLoading(false);
        return;
      }

      login(response.data.token, user);
      navigate('/home');
    } catch (error) {
      console.error("OTP Verification failed:", error);
      alert("Mã OTP không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -z-10" />

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-8 border border-slate-200">
          <button
            onClick={() => setLoginMethod('qr')}
            className={clsx(
              "flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all",
              loginMethod === 'qr' ? "bg-emerald-700 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <QrCode className="w-4 h-4" /> Mã QR
          </button>
          <button
            onClick={() => setLoginMethod('mobile')}
            className={clsx(
              "flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all",
              loginMethod === 'mobile' ? "bg-emerald-700 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Phone className="w-4 h-4" /> Số điện thoại
          </button>
        </div>

        {loginMethod === 'qr' ? (
          // QR LOGIN VIEW
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <h1 className="text-2xl font-black mb-2 text-slate-900">Đăng nhập bằng QR</h1>
            <p className="text-slate-500 text-sm mb-8">
              Sử dụng ứng dụng <span className="text-emerald-700 font-bold">GreenMarket Mobile</span> để quét mã
            </p>

            <div className="bg-white p-4 rounded-3xl inline-block mx-auto mb-6 shadow-2xl relative border border-slate-100">
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  <QRCode
                    value={qrSessionId || "loading..."}
                    size={192}
                    className={clsx("transition-opacity duration-300", qrStatus === 'expired' && "opacity-20")}
                  />
                  {qrStatus === 'expired' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <button
                        onClick={initQr}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 active:scale-95 flex flex-col items-center gap-2 shadow-emerald-200/50"
                      >
                        <RefreshCw className="w-6 h-6" />
                      </button>
                      <span className="text-slate-900 font-bold mt-2">Tải lại mã</span>
                    </div>
                  )}
                  {qrStatus === 'scanned' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                        <QrCode className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className="text-emerald-700 font-bold">Đã quét thành công</span>
                      <span className="text-emerald-600 outline-none text-xs text-center mt-1 px-4">Vui lòng xác nhận trên ứng dụng</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {qrStatus === 'expired' ? (
              <p className="text-amber-600 font-bold text-sm">Mã QR đã hết hạn. Vui lòng tải lại.</p>
            ) : (
              <p className="text-slate-500 text-sm flex items-center justify-center gap-2 font-medium">
                {qrStatus === 'scanned' ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Đang chờ xác nhận...</>
                ) : (
                  "Mã sẽ tự động làm mới sau 2 phút"
                )}
              </p>
            )}
          </div>
        ) : (
          // MOBILE OTP VIEW
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-10">
              <div className="bg-emerald-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
                {step === 'mobile' ? <Phone className="w-8 h-8 text-emerald-600" /> : <Lock className="w-8 h-8 text-emerald-600" />}
              </div>
              <h1 className="text-2xl font-black mb-2 text-slate-900">
                {step === 'mobile' ? 'Chào mừng bạn' : 'Xác thực OTP'}
              </h1>
              <p className="text-slate-500 text-sm font-medium">
                {step === 'mobile' ? 'Nhập số điện thoại để tiếp tục' : `Chúng tôi đã gửi mã tới ${mobile}`}
              </p>
            </div>

            {step === 'mobile' ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    required
                    type="tel"
                    className="w-full bg-slate-50 border border-slate-200 pl-12 pr-4 py-4 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-900 text-sm font-medium"
                    placeholder="09xx xxx xxx"
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) setMobile(val);
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white shadow-xl shadow-emerald-200/50"
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
                      className="w-12 h-14 bg-slate-50 border border-slate-200 rounded-xl text-center text-2xl font-bold text-emerald-600 focus:border-emerald-500 focus:bg-white outline-none transition-all shadow-md"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.some(d => d === '')}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-100 disabled:text-slate-400 text-white shadow-xl shadow-emerald-200/50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : 'Xác nhận Đăng nhập'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep('mobile');
                    setOtp(['', '', '', '', '', '']);
                  }}
                  className="w-full text-slate-500 text-sm font-bold hover:text-emerald-600 transition-colors"
                >
                  Đổi số điện thoại
                </button>
              </form>
            )}
          </div>
        )}

        <div className="mt-10 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          Bằng cách tiếp tục, bạn đồng ý với <span className="text-emerald-600 underline hover:text-emerald-700 cursor-pointer transition-colors">Điều khoản dịch vụ</span> và <span className="text-emerald-600 underline hover:text-emerald-700 cursor-pointer transition-colors">Chính sách bảo mật</span> của GreenMarket.
        </div>
      </div>
    </div>
  );
};

export default Login;
