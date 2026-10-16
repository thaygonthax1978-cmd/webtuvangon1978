import React, { useState } from 'react';
import {
  Cloud,
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
} from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onSearch: (query: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenSupabaseModal?: () => void;
  toggleMobileSimulator: () => void;
  isMobileSimulatorActive: boolean;
  onToggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSearch,
  onOpenSettings,
  onOpenSupabaseModal,
  toggleMobileSimulator,
  isMobileSimulatorActive,
  onToggleSidebarMobile,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Đã sao lưu dữ liệu tự động', time: '10 phút trước', read: false },
    { id: 2, title: 'Đã đồng bộ hóa 5 giáo án môn Toán', time: '1 giờ trước', read: false },
    { id: 3, title: 'Bảo mật 2 lớp (2FA) đang kích hoạt', time: 'Hôm nay', read: true },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <header className="bg-gradient-to-r from-[#064AA8] via-[#0866E8] to-[#0a75f0] text-white shadow-md sticky top-0 z-40">
      <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Section: Logo & Teacher Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebarMobile}
            className="p-1.5 rounded-lg hover:bg-white/10 md:hidden text-white"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner border border-white/20">
              <Cloud className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-wide uppercase text-white">
                  {user?.fullName || 'TỪ VĂN GỌN'}
                </span>
                <span className="bg-emerald-500/90 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  Chủ sở hữu
                </span>
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
              KHO DỮ LIỆU CÁ NHÂN – THẦY GỌN
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-100 font-medium">
            <span>Lưu trữ – Tìm kiếm – Quản lý – An toàn – Mọi lúc mọi nơi</span>
            <span className="hidden xl:inline-block bg-white/20 px-2 py-0.5 rounded-full text-[11px] text-yellow-200 border border-white/20 font-semibold">
              ✨ Dữ liệu hôm nay – Giá trị ngày mai
            </span>
          </div>
        </div>

        {/* Right Section: Search & Actions */}
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
              onClick={onOpenSupabaseModal}
              title="Cơ sở dữ liệu Supabase Cloud (Bấm để xem trạng thái và đồng bộ)"
              className="p-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs px-2.5 font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300/40 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Supabase</span>
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
            </button>
          )}

          {/* Toggle Mobile Preview Simulator */}
          <button
            onClick={toggleMobileSimulator}
            title={isMobileSimulatorActive ? 'Tắt xem thử điện thoại' : 'Xem trên điện thoại (Mục 12)'}
            className={`p-1.5 rounded-full transition-colors flex items-center gap-1 text-xs px-2.5 font-medium ${
              isMobileSimulatorActive
                ? 'bg-yellow-400 text-slate-900 shadow-sm'
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
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors relative"
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
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            title="Cài đặt hệ thống"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Account Avatar & Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-200 border border-white">
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                  alt="Thầy Từ Văn Gọn"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="hidden md:inline text-xs font-semibold text-white whitespace-nowrap">
                Thầy Gọn
              </span>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 text-slate-800 border border-slate-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="font-bold text-sm text-slate-900">Từ Văn Gọn</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Đã xác minh chính chủ
                  </div>
                </div>

                <div className="py-1 text-xs">
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    Hồ sơ giáo viên & Bảo mật
                  </button>
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-blue-600" />
                    Cài đặt tài khoản & Bộ nhớ
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Đăng xuất an toàn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
