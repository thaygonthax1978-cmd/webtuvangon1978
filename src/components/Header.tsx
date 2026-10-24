import React, { useState, useRef } from 'react';
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  Menu,
  Database,
  Camera,
  Upload,
  X,
  Check,
  Sparkles,
  RotateCw,
  UserPlus,
  LogIn,
  Users,
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenSupabaseModal?: () => void;
  onClearCacheAndRefresh?: () => void;
  onOpenAuthModal?: (tab?: 'register' | 'login' | 'users') => void;
  toggleMobileSimulator: () => void;
  isMobileSimulatorActive: boolean;
  onToggleSidebarMobile: () => void;
  onUpdateUser?: (userData: Partial<UserProfile>) => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSearch,
  onOpenSettings,
  onOpenSupabaseModal,
  onClearCacheAndRefresh,
  onOpenAuthModal,
  toggleMobileSimulator,
  isMobileSimulatorActive,
  onToggleSidebarMobile,
  onUpdateUser,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Preset teacher avatar samples
  const presetAvatars = [
    {
      label: 'Thầy Từ Văn Gọn (Chính chủ)',
      url: '/avatar_tu_van_gon.jpg',
    },
    {
      label: 'Chân dung 2',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Chân dung 3',
      url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
    {
      label: 'Chân dung 4',
      url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    },
  ];

  const notifications = [
    { id: 1, title: 'Đã sao lưu dữ liệu tự động', time: '10 phút trước', read: false },
    { id: 2, title: 'Đã đồng bộ hóa 5 giáo án môn Toán', time: '1 giờ trước', read: false },
    { id: 3, title: 'Bảo mật 2 lớp (2FA) đang kích hoạt', time: 'Hôm nay', read: true },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  // Process file upload and optimize with canvas
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
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
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Quick 1-click avatar file selection from header
  const handleQuickAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP)!');
      return;
    }
    try {
      setIsUpdatingAvatar(true);
      const dataUrl = await processImageFile(file);
      if (onUpdateUser) {
        await onUpdateUser({ avatarUrl: dataUrl });
      }
    } catch (err) {
      console.error('Lỗi cập nhật ảnh đại diện:', err);
    } finally {
      setIsUpdatingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle modal file selection
  const handleModalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP)!');
      return;
    }
    try {
      const dataUrl = await processImageFile(file);
      setPreviewAvatar(dataUrl);
    } catch (err) {
      console.error('Lỗi đọc ảnh:', err);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Save avatar from modal
  const handleSaveAvatarFromModal = async () => {
    const targetUrl = previewAvatar || avatarUrlInput.trim();
    if (!targetUrl) return;

    try {
      setIsUpdatingAvatar(true);
      if (onUpdateUser) {
        await onUpdateUser({ avatarUrl: targetUrl });
      }
      setShowAvatarModal(false);
      setPreviewAvatar(null);
      setAvatarUrlInput('');
    } catch (err) {
      console.error('Lỗi lưu ảnh đại diện:', err);
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const currentAvatar = user?.avatarUrl || '/avatar_tu_van_gon.jpg';

  return (
    <header className="bg-gradient-to-r from-[#064AA8] via-[#0866E8] to-[#0a75f0] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Avatar của Từ Văn Gọn & Thông tin giáo viên */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebarMobile}
            className="p-1.5 rounded-lg hover:bg-white/10 md:hidden text-white cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            {/* Ảnh đại diện của Từ Văn Gọn - Có thể bấm để đổi ảnh */}
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                title="Bấm để thay đổi ảnh đại diện của Thầy Từ Văn Gọn"
                className="w-11 h-11 rounded-full overflow-hidden bg-white/20 border-2 border-white/80 shadow-md cursor-pointer relative block transition-transform hover:scale-105 active:scale-95 ring-2 ring-white/30 hover:ring-yellow-300"
              >
                <img
                  src={currentAvatar}
                  alt="Ảnh đại diện Từ Văn Gọn"
                  className="w-full h-full object-cover"
                />
                {/* Overlay khi rê chuột */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                  <Camera className="w-4 h-4 text-white drop-shadow-sm" />
                  <span className="text-[8px] font-bold leading-tight mt-0.5 uppercase tracking-tighter">Đổi ảnh</span>
                </div>
              </button>

              {/* Nút camera nhỏ ở góc phải dưới avatar */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Tải ảnh mới từ máy tính / điện thoại"
                className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full border border-white flex items-center justify-center shadow-xs cursor-pointer transition-transform hover:scale-110"
              >
                <Camera className="w-2.5 h-2.5" />
              </button>

              {/* Hidden file input for 1-click upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleQuickAvatarFileChange}
              />
            </div>

            {/* Thông tin giáo viên chủ sở hữu */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wide uppercase text-white drop-shadow-xs">
                  {user?.fullName || 'TỪ VĂN GỌN'}
                </span>
                <span className="bg-emerald-500/90 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-xs">
                  Chủ sở hữu
                </span>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(true)}
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-100 hover:text-white underline ml-1 cursor-pointer"
                  title="Thay đổi ảnh đại diện"
                >
                  <Camera className="w-3 h-3" />
                  <span>Đổi ảnh</span>
                </button>
              </div>
              <p className="text-xs text-blue-100/90 leading-tight">
                {user?.role || 'Giáo viên tiểu học'} – {user?.school || 'Trường TH Phường An Xuyên'} – {user?.location || 'Cà Mau'}
              </p>
            </div>
          </div>
        </div>

        {/* Center Section: App Title & Slogan */}
        <div className="hidden lg:flex flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight drop-shadow-sm text-white">
              KHO DỮ LIỆU CÁ NHÂN – TỪ VĂN GỌN – THỨ NHẤT
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-100 font-medium">
            <span>Lưu trữ – Tìm kiếm – Quản lý – An toàn – Mọi lúc mọi nơi</span>
            <span className="hidden xl:inline-block bg-white/20 px-2 py-0.5 rounded-full text-[11px] text-yellow-200 border border-white/20 font-semibold">
              ✨ Dữ liệu hôm nay – Giá trị ngày mai
            </span>
          </div>
        </div>

        {/* Right Section: Search & Actions (Đã bỏ 'Thầy Gọn', thay bằng nút Quản lý Tài khoản) */}
        <div className="flex items-center gap-2.5 ml-auto">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Tìm kiếm tài liệu, thư mục..."
              className="w-56 md:w-64 pl-9 pr-4 py-1.5 text-xs rounded-full bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
            />
            <Search className="w-4 h-4 text-blue-600 absolute left-3 top-2" />
          </form>

          {/* Supabase Cloud Database Status Button */}
          {onOpenSupabaseModal && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenSupabaseModal();
              }}
              title="Cơ sở dữ liệu Supabase Cloud (Bấm để xem trạng thái và đồng bộ)"
              className="p-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs px-2.5 font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300/40 cursor-pointer active:scale-95 shrink-0"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold">Supabase</span>
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse shrink-0" />
            </button>
          )}

          {/* Nút Làm mới dữ liệu sạch & Xóa bộ nhớ đệm */}
          {onClearCacheAndRefresh && (
            <button
              onClick={onClearCacheAndRefresh}
              title="Làm mới dữ liệu từ máy chủ & Xóa bộ nhớ đệm trình duyệt"
              className="p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs px-2.5 font-medium bg-white/15 hover:bg-white/25 text-white cursor-pointer active:scale-95"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Làm mới</span>
            </button>
          )}

          {/* Toggle Mobile Preview Simulator */}
          <button
            onClick={toggleMobileSimulator}
            title={isMobileSimulatorActive ? 'Tắt xem thử điện thoại' : 'Xem trên điện thoại (Mục 12)'}
            className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs px-2.5 font-medium cursor-pointer ${
              isMobileSimulatorActive
                ? 'bg-yellow-400 text-slate-900 shadow-sm font-semibold'
                : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden md:inline">Đổi xem ĐT</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors relative cursor-pointer"
              title="Thông báo hệ thống"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-blue-700 animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl py-2 z-50 text-slate-800 border border-slate-100">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-700 uppercase">Thông báo</span>
                  <span className="text-[11px] text-blue-600 cursor-pointer font-medium hover:underline">
                    Đã đọc tất cả
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-blue-50/50 transition-colors text-xs">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-800">{n.title}</p>
                          <span className="text-[10px] text-slate-400">{n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Shortcut */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Nút Đăng ký tài khoản mới bằng tên đăng nhập và mật khẩu */}
          {onOpenAuthModal && (
            <button
              type="button"
              onClick={() => onOpenAuthModal('register')}
              title="Đăng ký tài khoản mới bằng tên đăng nhập và mật khẩu"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-900 transition-all font-bold text-xs shadow-md cursor-pointer active:scale-95 shrink-0 hover:ring-2 hover:ring-amber-200"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-950 font-bold" />
              <span className="font-extrabold tracking-wide">Đăng ký</span>
            </button>
          )}

          {/* Menu Quản lý Tài khoản */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 transition-all text-white shadow-xs cursor-pointer"
              title="Tùy chọn Tài khoản & Hệ thống"
            >
              <User className="w-4 h-4 text-blue-100" />
              <span className="hidden md:inline text-xs font-semibold text-white whitespace-nowrap">
                {user?.fullName ? user.fullName.split(' ').slice(-1)[0] : 'Tài khoản'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Trạng thái: Trực tuyến" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl py-2 z-50 text-slate-800 border border-slate-100">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentAvatar}
                      alt={user?.fullName || 'Người dùng'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                    />
                    <div>
                      <p className="font-bold text-sm text-slate-900 leading-tight">
                        {user?.fullName || 'Từ Văn Gọn'}
                      </p>
                      <p className="text-[11px] text-blue-600 font-semibold truncate max-w-[170px]">
                        @{user?.username || 'thaygon'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-50 px-2 py-1 rounded-lg">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {user?.role || 'Giáo viên'}
                    </span>
                    <span className="text-slate-500">Trực tuyến</span>
                  </div>
                </div>

                <div className="py-1 text-xs">
                  {onOpenAuthModal && (
                    <>
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuthModal('register');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-800 flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-amber-600" />
                        <span>Đăng ký tài khoản mới</span>
                        <span className="text-[10px] ml-auto bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-bold">
                          Mới
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuthModal('login');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <LogIn className="w-4 h-4 text-emerald-600" />
                        <span>Đăng nhập tài khoản khác</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onOpenAuthModal('users');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Danh sách & Chuyển tài khoản</span>
                      </button>

                      <div className="border-t border-slate-100 my-1" />
                    </>
                  )}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setShowAvatarModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Đổi ảnh đại diện</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Hồ sơ giáo viên & Bảo mật</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span>Cài đặt hệ thống & Bộ nhớ</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      if (onOpenAuthModal) onOpenAuthModal('login');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Đăng xuất / Chuyển người dùng</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Thay đổi Ảnh đại diện của Từ Văn Gọn */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 text-slate-800">
            {/* Header Modal */}
            <div className="px-5 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-yellow-300" />
                <h3 className="font-bold text-sm">Thay đổi ảnh đại diện - Từ Văn Gọn</h3>
              </div>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setPreviewAvatar(null);
                  setAvatarUrlInput('');
                }}
                className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 space-y-4">
              {/* Xem trước ảnh */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 shadow-md relative group">
                  <img
                    src={previewAvatar || avatarUrlInput.trim() || currentAvatar}
                    alt="Xem trước ảnh đại diện"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-700">Xem trước ảnh đại diện</p>
                <p className="text-[11px] text-slate-400">Hình ảnh sẽ hiển thị trên góc trái hệ thống và toàn bộ hồ sơ</p>
              </div>

              {/* Lựa chọn 1: Tải ảnh từ thiết bị */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Tải ảnh từ máy tính hoặc điện thoại
                </label>
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Chọn tệp ảnh từ thiết bị (JPG, PNG, WEBP)</span>
                </button>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModalFileChange}
                />
              </div>

              {/* Lựa chọn 2: Nhập đường link URL ảnh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Hoặc nhập liên kết ảnh trực tuyến (URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrlInput}
                    onChange={(e) => {
                      setAvatarUrlInput(e.target.value);
                      if (e.target.value.trim()) {
                        setPreviewAvatar(null);
                      }
                    }}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {avatarUrlInput && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrlInput('')}
                      className="px-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>

              {/* Lựa chọn 3: Chọn từ ảnh mẫu có sẵn */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>3. Hoặc chọn nhanh ảnh mẫu chân dung</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {presetAvatars.map((preset, idx) => {
                    const isSelected = (previewAvatar || avatarUrlInput) === preset.url || (!previewAvatar && !avatarUrlInput && currentAvatar === preset.url);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPreviewAvatar(preset.url);
                          setAvatarUrlInput('');
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer hover:scale-105 ${
                          isSelected ? 'border-blue-600 ring-2 ring-blue-400' : 'border-slate-200'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAvatarModal(false);
                  setPreviewAvatar(null);
                  setAvatarUrlInput('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isUpdatingAvatar || (!previewAvatar && !avatarUrlInput.trim())}
                onClick={handleSaveAvatarFromModal}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdatingAvatar ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu ảnh đại diện</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
