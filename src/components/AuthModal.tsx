import React, { useState, useEffect } from 'react';
import {
  X,
  LogIn,
  KeyRound,
  User,
  Loader2,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { UserProfile, LoginPayload } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (newUser: UserProfile) => void;
  initialTab?: 'login' | 'register' | 'users';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
}) => {
  // Form states - Login
  const [loginUsername, setLoginUsername] = useState('thaygon');
  const [loginPassword, setLoginPassword] = useState('123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Status & loading state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset errors when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      if (!loginUsername) {
        setLoginUsername('thaygon');
        setLoginPassword('123');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
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
        setSuccessMsg(result.message || 'Đăng nhập thành công!');
        onUserChanged(result.user);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi đăng nhập: ' + (err.message || 'Vui lòng kiểm tra lại kết nối'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 text-slate-800 my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#064AA8] via-[#0866E8] to-[#0a75f0] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-inner">
              <LogIn className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-bold text-base md:text-lg leading-tight">
                Đăng nhập Tài khoản
              </h2>
              <p className="text-xs text-blue-100">
                Kho dữ liệu cá nhân – Giáo viên Từ Văn Gọn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white cursor-pointer transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Đã xóa mục Đăng ký mới và Danh sách, chỉ giữ lại mục Đăng nhập */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold">
          <div className="flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 border-blue-600 text-blue-600 bg-white font-bold shadow-2xs">
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>Đăng nhập</span>
          </div>
        </div>

        {/* Status Notification Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="flex-1 font-semibold">{successMsg}</div>
          </div>
        )}

        {/* Modal Body: Biểu mẫu Đăng nhập duy nhất */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-1.5 text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Đăng nhập tài khoản cá nhân
              </p>
              <p className="text-emerald-700 mt-0.5 leading-relaxed">
                Đăng nhập bằng tên đăng nhập và mật khẩu bạn đã đăng ký để quản lý tài liệu và giáo án của mình.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên đăng nhập hoặc Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="vd: thaygon hoặc tên tài khoản bạn đã tạo"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Preset login for teacher Thầy Gọn */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Tài khoản mẫu / gợi ý nhanh:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('thaygon');
                    setLoginPassword('123');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <img src="/avatar_tu_van_gon.jpg" alt="Từ Văn Gọn" className="w-4 h-4 rounded-full object-cover" />
                  <span>Thầy Từ Văn Gọn (thaygon)</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Bảo mật hệ thống cá nhân</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
