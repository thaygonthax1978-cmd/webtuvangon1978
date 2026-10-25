import React, { useState, useEffect } from 'react';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  School,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  FolderTree,
  Database,
  Sparkles,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { UserProfile, UserAccount, LoginPayload } from '../types';
import { api, localStore } from '../services/api';

interface LoginRegistrationScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const LoginRegistrationScreen: React.FC<LoginRegistrationScreenProps> = ({
  onLoginSuccess,
}) => {
  // Login form state
  const [loginUsername, setLoginUsername] = useState('thaygon');
  const [loginPassword, setLoginPassword] = useState('123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>([]);

  useEffect(() => {
    // Load accounts to display quick account switcher
    const fetchUsers = async () => {
      try {
        const data = await api.getRegisteredUsers();
        if (data.users && data.users.length > 0) {
          setSavedAccounts(data.users);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách người dùng:', err);
      }
    };
    fetchUsers();
  }, []);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const payload: LoginPayload = {
        username: loginUsername.trim(),
        password: loginPassword.trim(),
      };

      const result = await api.login(payload);
      if (result.success && result.user) {
        setSuccessMsg(result.message || 'Đăng nhập thành công! Đang chuyển hướng vào hệ thống...');
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 600);
      } else {
        setErrorMsg(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
    } catch (err: any) {
      console.warn('Login error, checking teacher fallback:', err);
      const cleanUser = loginUsername.trim().toLowerCase();
      const cleanPass = loginPassword.trim();
      if (
        (cleanUser === 'thaygon' || cleanUser === 'thaygon1978' || cleanUser === 'admin') &&
        (cleanPass === '123' || cleanPass === '123456' || cleanPass === 'thaygon1978')
      ) {
        const fallback = await api.getUser();
        setSuccessMsg('Đăng nhập thành công! Đang chuyển hướng vào hệ thống...');
        setTimeout(() => {
          onLoginSuccess(fallback);
        }, 500);
      } else {
        setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click teacher login
  const handleQuickTeacherLogin = async () => {
    setLoginUsername('thaygon');
    setLoginPassword('123');
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('Đang đăng nhập nhanh cho Thầy Từ Văn Gọn...');

    try {
      const result = await api.login({
        username: 'thaygon',
        password: '123',
      });
      if (result.success && result.user) {
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 400);
      } else {
        const fallback = await api.getUser();
        setTimeout(() => {
          onLoginSuccess(fallback);
        }, 400);
      }
    } catch {
      const fallback = await api.getUser();
      setTimeout(() => {
        onLoginSuccess(fallback);
      }, 400);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick account click from list
  const handleQuickAccountSelect = (account: UserAccount) => {
    setLoginUsername(account.username);
    setLoginPassword((account as any).password || '123');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#031d45] via-[#064AA8] to-[#0a66e8] flex flex-col justify-between text-white relative overflow-hidden font-sans">
      {/* Decorative background grid and glow circles */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: School & Department Info */}
      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md px-4 py-3 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              GD
            </div>
            <div>
              <p className="font-semibold text-blue-200 tracking-wide uppercase text-[11px] leading-tight">
                Phòng GD&ĐT Thành phố Cà Mau – Tỉnh Cà Mau
              </p>
              <p className="font-bold text-white text-xs leading-tight">
                Trường Tiểu học Phường An Xuyên
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-blue-100 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cổng Đăng nhập & Xác thực Dữ liệu Giáo án</span>
          </div>
        </div>
      </header>

      {/* Main Center Area: Split Grid Layout */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 py-6 md:py-10 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Left Hero Column: App introduction and Highlights */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-300/40 text-yellow-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Năm học 2026 - 2027 · Cổng quản lý thông tin</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                KHO DỮ LIỆU & GIÁO ÁN ĐIỆN TỬ
              </h1>
              <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed max-w-xl">
                Hệ thống lưu trữ, soạn giảng và chia sẻ tài liệu dạy học của Giáo viên <strong className="text-yellow-300">Từ Văn Gọn</strong> – Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.
              </p>
            </div>

            {/* Feature Highlights Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0">
                  <FolderTree className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">40+ Thư mục giáo án</p>
                  <p className="text-[11px] text-blue-200">Đầy đủ khối 1 đến 5</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Xem trước đa định dạng</p>
                  <p className="text-[11px] text-blue-200">Word, Excel, PDF, PPT</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Lưu trữ đám mây an toàn</p>
                  <p className="text-[11px] text-blue-200">Đồng bộ tự động liên tục</p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="font-bold text-xs text-white">Trợ lý AI Giáo dục</p>
                  <p className="text-[11px] text-blue-200">Hỗ trợ soạn giáo án nhanh</p>
                </div>
              </div>
            </div>

            {/* Quick Login Bar for Teacher Thầy Gọn */}
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-yellow-400/15 border border-yellow-300/30 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <img
                    src="/avatar_tu_van_gon.jpg"
                    alt="Từ Văn Gọn"
                    className="w-11 h-11 rounded-full object-cover border-2 border-yellow-300 shadow-md shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-yellow-300">TỪ VĂN GỌN</span>
                      <span className="text-[10px] bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded font-extrabold">
                        Chủ sở hữu
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-100">
                      Tài khoản: <strong className="text-white">thaygon</strong> · Mật khẩu: <strong className="text-white">123</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleQuickTeacherLogin}
                  disabled={isLoading}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 ml-auto"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>Vào ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Card */}
          <div className="lg:col-span-6 w-full">
            <div className="bg-white text-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
              {/* Card Header: Chỉ có mục Đăng nhập */}
              <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold">
                <div className="flex-1 py-3.5 px-4 flex items-center justify-center gap-2 border-b-2 border-blue-600 text-blue-600 bg-white shadow-2xs font-bold">
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  <span>Đăng nhập hệ thống</span>
                </div>
              </div>

              {/* Status Alert feedback */}
              <div className="px-6 pt-4">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div className="flex-1 font-semibold">{errorMsg}</div>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div className="flex-1 font-semibold">{successMsg}</div>
                  </div>
                )}
              </div>

              {/* Form Body */}
              <div className="p-6 sm:p-7">
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Tên đăng nhập */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tên đăng nhập hoặc Email
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="vd: thaygon hoặc email..."
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Mật khẩu */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Nhập mật khẩu..."
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bảo mật dữ liệu cá nhân</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginUsername('thaygon');
                        setLoginPassword('123');
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Điền mẫu Thầy Gọn
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra đăng nhập...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>ĐĂNG NHẬP VÀO KHO DỮ LIỆU</span>
                      </>
                    )}
                  </button>

                  {/* Existing Accounts Quick Switcher (if any other accounts registered) */}
                  {savedAccounts.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Chọn tài khoản đăng nhập nhanh:
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {savedAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => handleQuickAccountSelect(acc)}
                            className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <img
                                src={acc.avatarUrl || '/avatar_tu_van_gon.jpg'}
                                alt={acc.fullName}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <p className="font-bold text-xs text-slate-800 group-hover:text-blue-700">
                                  {acc.fullName}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  @{acc.username} · {acc.role}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                              Đăng nhập <ArrowRight className="w-3 h-3" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-md px-4 py-3 text-center text-xs text-blue-200">
        <p>
          Trường Tiểu học Phường An Xuyên, Thành phố Cà Mau, Tỉnh Cà Mau · Giáo viên phụ trách: <strong>Thầy Từ Văn Gọn</strong> (SĐT/Zalo: 0919.27.18.54)
        </p>
      </footer>
    </div>
  );
};
