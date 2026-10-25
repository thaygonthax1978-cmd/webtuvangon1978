import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  Lock,
  Smartphone,
  HardDrive,
  Globe,
  Sun,
  Moon,
  CheckCircle,
  Save,
  Laptop,
  Monitor,
  Database,
  Camera,
  Upload,
  UserPlus,
  Users,
  AlertCircle,
  LogOut,
  LogIn,
} from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface SecuritySettingsProps {
  user: UserProfile | null;
  onUpdateUser: (userData: Partial<UserProfile>) => Promise<void>;
  onOpenSupabaseModal?: () => void;
  onOpenAuthModal?: (tab?: 'register' | 'login' | 'users') => void;
  onLogout?: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  user,
  onUpdateUser,
  onOpenSupabaseModal,
  onOpenAuthModal,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(user?.fullName || 'TỪ VĂN GỌN');
  const [role, setRole] = useState(user?.role || 'Giáo viên tiểu học');
  const [school, setSchool] = useState(user?.school || 'Trường Tiểu học Phường An Xuyên');
  const [location, setLocation] = useState(user?.location || 'Cà Mau');
  const [email, setEmail] = useState(user?.email || 'thaygonthax1978@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '0918.452.889');

  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled ?? true);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | '2fa' | 'devices' | 'storage'>('profile');
  const [notification, setNotification] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(dataUrl);
          await onUpdateUser({ avatarUrl: dataUrl });
          setNotification('Đã cập nhật ảnh đại diện của Thầy Từ Văn Gọn thành công!');
          setTimeout(() => setNotification(''), 3000);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateUser({
      fullName,
      role,
      school,
      location,
      email,
      phone,
      twoFactorEnabled: twoFactor,
      avatarUrl: avatarUrl || user?.avatarUrl,
    });
    setNotification('Đã cập nhật thông tin hồ sơ của Thầy Từ Văn Gọn thành công!');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    try {
      const res = await api.changeAccountPassword(oldPassword, newPassword);
      if (res.success) {
        setNotification('Đổi mật khẩu thành công! Mật khẩu mới đã được lưu an toàn.');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(res.message || 'Lỗi đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.');
      }
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể đổi mật khẩu'));
    }
    setTimeout(() => setNotification(''), 3500);
  };

  const devices = [
    {
      id: 1,
      name: 'Máy tính để bàn Phòng Tin học',
      type: 'desktop',
      location: 'Trường TH Phường An Xuyên, Cà Mau',
      lastActive: 'Đang hoạt động (Hiện tại)',
      isCurrent: true,
      icon: Monitor,
    },
    {
      id: 2,
      name: 'Laptop giáo án Dell Vostro',
      type: 'laptop',
      location: 'Nhà riêng - Phường An Xuyên, TP. Cà Mau',
      lastActive: '2 giờ trước',
      isCurrent: false,
      icon: Laptop,
    },
    {
      id: 3,
      name: 'Điện thoại Samsung Galaxy S23',
      type: 'mobile',
      location: 'Cà Mau, Việt Nam',
      lastActive: 'Hôm qua',
      isCurrent: false,
      icon: Smartphone,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Cài đặt tài khoản & An toàn dữ liệu</span>
        </h2>
        <p className="text-xs text-slate-500">
          Quản lý thông tin cá nhân giáo viên, lớp học và các chính sách bảo mật kho lưu trữ
        </p>
      </div>

      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs matching Mockup #11 */}
        <div className="bg-white p-3 rounded-2xl shadow-xs border border-slate-200 space-y-1 h-fit">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'profile'
                ? 'bg-[#0866E8] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'password'
                ? 'bg-[#0866E8] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Đổi mật khẩu</span>
          </button>

          <button
            onClick={() => setActiveTab('2fa')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === '2fa'
                ? 'bg-[#0866E8] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Xác thực 2 bước (2FA)</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'devices'
                ? 'bg-[#0866E8] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Quản lý thiết bị</span>
          </button>

          <button
            onClick={() => setActiveTab('storage')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              activeTab === 'storage'
                ? 'bg-[#0866E8] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Dung lượng lưu trữ</span>
          </button>

          {onOpenAuthModal && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onOpenAuthModal('login')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between text-emerald-900 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-300 shadow-2xs cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-emerald-600" />
                  <span>Đăng nhập tài khoản</span>
                </div>
              </button>
            </div>
          )}

          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-200 mt-2 shadow-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Supabase Cloud</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200 mt-3 cursor-pointer active:scale-98 shadow-2xs"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Đăng xuất ra màn hình chính</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Hồ sơ giáo viên chủ sở hữu
              </h3>

              {/* Khối Ảnh đại diện Từ Văn Gọn */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                <div className="relative group w-20 h-20 rounded-full overflow-hidden border-3 border-blue-500 shadow-md shrink-0 bg-white">
                  <img
                    src={avatarUrl || user?.avatarUrl || '/avatar_tu_van_gon.jpg'}
                    alt="Từ Văn Gọn"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-[10px]">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span>Đổi ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                  </label>
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h4 className="font-bold text-slate-800 text-sm">Ảnh đại diện của Thầy Từ Văn Gọn</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ảnh đại diện xuất hiện trên góc trái màn hình chính và các liên kết chia sẻ tài liệu.
                  </p>
                  <label className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh mới từ thiết bị</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFile}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức danh / Nghề nghiệp</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đơn vị công tác *</label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu thay đổi hồ sơ</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Đổi mật khẩu truy cập
              </h3>

              <div className="text-xs space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          )}

          {activeTab === '2fa' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Xác thực 2 yếu tố (2FA)
              </h3>
              <p className="text-xs text-slate-600">
                Tăng cường mức độ bảo mật cho kho tài liệu giáo viên bằng việc yêu cầu mã OTP khi đăng nhập từ thiết bị lạ.
              </p>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">
                      Bảo vệ 2 lớp đang {twoFactor ? 'BẬT' : 'TẮT'}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      Mã xác thực gửi về email thaygonthax1978@gmail.com
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={(e) => setTwoFactor(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Thiết bị đang đăng nhập
              </h3>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {devices.map((d) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-2">
                            {d.name}
                            {d.isCurrent && (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                Thiết bị này
                              </span>
                            )}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {d.location} • {d.lastActive}
                          </span>
                        </div>
                      </div>

                      {!d.isCurrent && (
                        <button className="text-xs text-rose-600 hover:underline font-semibold">
                          Đăng xuất từ xa
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                Gói dung lượng tài khoản
              </h3>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="bg-yellow-400 text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Gói Giáo Dục Tiểu Học
                  </span>
                  <h4 className="text-xl font-bold mt-2">Dung lượng: 100 GB Cloud</h4>
                  <p className="text-xs text-blue-100 mt-1">
                    Cấp phép riêng cho Thầy Từ Văn Gọn – TH Phường An Xuyên
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-white/20 px-3 py-1.5 rounded-xl font-semibold border border-white/20">
                    Hiệu lực: Vô thời hạn
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
