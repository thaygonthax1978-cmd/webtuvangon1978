import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  Users,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  KeyRound,
  User,
  School,
  MapPin,
  Mail,
  Phone,
  Camera,
  Loader2,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserProfile, UserAccount, RegisterPayload, LoginPayload } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserChanged: (newUser: UserProfile) => void;
  initialTab?: 'register' | 'login' | 'users';
}

const PRESET_AVATARS = [
  { label: 'Thầy Từ Văn Gọn', url: '/avatar_tu_van_gon.jpg' },
  { label: 'Cô Giáo 1', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80' },
  { label: 'Thầy Giáo 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cô Giáo 2', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
  { label: 'Thầy Giáo 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  { label: 'Cán bộ 1', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  initialTab = 'register',
}) => {
  const [activeTab, setActiveTab] = useState<'register' | 'login' | 'users'>(initialTab);

  // Form states - Registration
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState('Giáo viên tiểu học');
  const [regSchool, setRegSchool] = useState('Trường Tiểu học Phường An Xuyên');
  const [regLocation, setRegLocation] = useState('Cà Mau');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAvatarUrl, setRegAvatarUrl] = useState(PRESET_AVATARS[1].url);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Form states - Login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Status & Accounts state
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMsg('');
      setSuccessMsg('');
      loadAccounts();
    }
  }, [isOpen, initialTab]);

  const loadAccounts = async () => {
    try {
      const data = await api.getRegisteredUsers();
      if (data.users) {
        setAccounts(data.users);
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách tài khoản:', e);
    }
  };

  if (!isOpen) return null;

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = regUsername.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg('Tên đăng nhập phải có ít nhất 3 ký tự (viết liền, không dấu)!');
      return;
    }

    if (!/^[a-z0-9_.-]+$/.test(cleanUsername)) {
      setErrorMsg('Tên đăng nhập chỉ được chứa chữ cái thường không dấu, số, dấu gạch dưới (_), gạch ngang (-) hoặc chấm (.)');
      return;
    }

    if (!regPassword || regPassword.length < 3) {
      setErrorMsg('Mật khẩu phải có độ dài từ 3 ký tự trở lên!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không trùng khớp với mật khẩu đã nhập!');
      return;
    }

    if (!regFullName.trim() || regFullName.trim().length < 2) {
      setErrorMsg('Vui lòng nhập họ và tên người dùng (từ 2 ký tự trở lên)!');
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterPayload = {
        username: cleanUsername,
        password: regPassword,
        fullName: regFullName.trim(),
        role: regRole,
        school: regSchool.trim(),
        location: regLocation.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        avatarUrl: regAvatarUrl,
      };

      const result = await api.register(payload);
      if (result.success && result.user) {
        setSuccessMsg(result.message || 'Đăng ký tài khoản thành công!');
        onUserChanged(result.user);
        await loadAccounts();
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(result.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại!');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi máy chủ: ' + (err.message || 'Vui lòng thử lại sau'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập và mật khẩu!');
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
        await loadAccounts();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
    } catch (err: any) {
      setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to an account
  const handleSwitchAccount = async (targetUserId: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await api.switchUser(targetUserId);
      if (result.success && result.user) {
        setSuccessMsg(result.message || 'Đã chuyển sang tài khoản thành công!');
        onUserChanged(result.user);
        await loadAccounts();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(result.message || 'Không thể chuyển tài khoản');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi chuyển tài khoản: ' + (err.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an account
  const handleDeleteAccount = async (userId: string, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}" không?`)) {
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const result = await api.deleteUser(userId);
      if (result.success) {
        setSuccessMsg(result.message);
        if (result.activeUser) {
          onUserChanged(result.activeUser);
        }
        await loadAccounts();
      } else {
        setErrorMsg(result.message || 'Không thể xóa tài khoản này');
      }
    } catch (err: any) {
      setErrorMsg('Lỗi xóa tài khoản: ' + err.message);
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
              <UserPlus className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-bold text-base md:text-lg leading-tight">
                Quản lý & Đăng ký Tài khoản
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            <span>Đăng ký mới</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold">
              Yêu cầu
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <LogIn className="w-4 h-4 text-emerald-600" />
            <span>Đăng nhập</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('users');
              setErrorMsg('');
              setSuccessMsg('');
              loadAccounts();
            }}
            className={`flex-1 py-3 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 bg-white font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Danh sách ({accounts.length})</span>
          </button>
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

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {/* TAB 1: ĐĂNG KÝ TÀI KHOẢN MỚI */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 text-xs text-blue-900">
                <p className="font-bold flex items-center gap-1.5 text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Đăng ký tài khoản bằng tên đăng nhập và mật khẩu
                </p>
                <p className="text-blue-700 mt-0.5 leading-relaxed">
                  Tài khoản sau khi tạo sẽ được lưu vào hệ thống, có thể đăng nhập hoặc chuyển đổi bất cứ lúc nào để lưu trữ tài liệu riêng.
                </p>
              </div>

              {/* Tên đăng nhập & Mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-xs">@</span>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().trim())}
                      placeholder="vd: lethimai, nguyenvana"
                      className="w-full pl-7 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Viết thường, không dấu, ít nhất 3 ký tự (a-z, 0-9, _, -)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên người dùng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="vd: Cô Lê Thị Mai"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Họ tên hiển thị trên hệ thống giáo án</p>
                </div>
              </div>

              {/* Mật khẩu & Xác nhận mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Nhập mật khẩu (từ 3 ký tự)"
                      className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác nhận lại mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Nhập lại chính xác mật khẩu"
                      className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regConfirmPassword && (
                    <p
                      className={`text-[10px] mt-1 font-semibold ${
                        regPassword === regConfirmPassword ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {regPassword === regConfirmPassword ? '✓ Mật khẩu khớp' : '✗ Mật khẩu chưa khớp'}
                    </p>
                  )}
                </div>
              </div>

              {/* Vai trò & Đơn vị trường học */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vai trò / Chức danh
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="Giáo viên tiểu học">Giáo viên tiểu học</option>
                    <option value="Giáo viên bộ môn">Giáo viên bộ môn</option>
                    <option value="Cán bộ quản lý">Cán bộ quản lý / Ban Giám hiệu</option>
                    <option value="Cán bộ thiết bị / Thư viện">Cán bộ thiết bị / Thư viện</option>
                    <option value="Nhân viên văn thư">Nhân viên văn thư</option>
                    <option value="Khách tham quan">Khách tham quan / Phụ huynh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Trường học / Đơn vị
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={regSchool}
                      onChange={(e) => setRegSchool(e.target.value)}
                      placeholder="Tên trường học..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tỉnh thành, Email & SĐT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa phương / Tỉnh thành
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={regLocation}
                      onChange={(e) => setRegLocation(e.target.value)}
                      placeholder="Cà Mau"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email liên hệ (tùy chọn)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại (tùy chọn)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0918.xxx.xxx"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Chọn Ảnh đại diện mẫu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn ảnh đại diện cho tài khoản
                </label>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((av, idx) => {
                    const isSelected = regAvatarUrl === av.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setRegAvatarUrl(av.url)}
                        className={`relative shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-300 scale-105'
                            : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                        }`}
                        title={av.label}
                      >
                        <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-sm font-bold" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorMsg('');
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Đã có tài khoản? Bấm Đăng nhập
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Đăng ký tài khoản ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ĐĂNG NHẬP */}
          {activeTab === 'login' && (
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
                    <img src="/avatar_tu_van_gon.jpg" className="w-4 h-4 rounded-full object-cover" />
                    <span>Thầy Từ Văn Gọn (thaygon)</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg('');
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Chưa có tài khoản? Bấm Đăng ký ngay
                </button>

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
          )}

          {/* TAB 3: DANH SÁCH TÀI KHOẢN ĐÃ ĐĂNG KÝ */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  Danh sách tài khoản ({accounts.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMsg('');
                  }}
                  className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Đăng ký thêm tài khoản</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {accounts.map((acc) => {
                  const isActive =
                    currentUser?.id === acc.id ||
                    (currentUser?.username && currentUser.username === acc.username);

                  return (
                    <div
                      key={acc.id}
                      className={`py-3 px-2 flex items-center justify-between gap-3 transition-colors rounded-xl ${
                        isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={acc.avatarUrl || '/avatar_tu_van_gon.jpg'}
                          alt={acc.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{acc.fullName}</span>
                            <span className="text-[11px] text-blue-600 font-semibold bg-blue-100/70 px-1.5 py-0.2 rounded">
                              @{acc.username}
                            </span>
                            {isActive && (
                              <span className="text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                                Đang hoạt động
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {acc.role} – {acc.school}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => handleSwitchAccount(acc.id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <span>Chuyển</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-lg flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Hiện tại
                          </span>
                        )}

                        {acc.id !== 'user_gon_01' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id, acc.username)}
                            disabled={isLoading}
                            title="Xóa tài khoản này"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
