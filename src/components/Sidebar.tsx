import React from 'react';
import {
  Home,
  FileText,
  FolderTree,
  Share2,
  Star,
  Trash2,
  Sparkles,
  BarChart3,
  Settings,
  HardDrive,
  UploadCloud,
  FolderUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ViewTab, StatsData } from '../types';
import { formatBytes } from '../services/api';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  stats: StatsData | null;
  onOpenUpload: () => void;
  onOpenUploadFolder?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  stats,
  onOpenUpload,
  onOpenUploadFolder,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const menuItems = [
    { id: 'home' as ViewTab, label: 'Trang chủ', icon: Home, badge: null },
    { id: 'my-files' as ViewTab, label: 'Tài liệu của tôi', icon: FileText, badge: stats?.totalDocuments },
    { id: 'folders' as ViewTab, label: 'Thư mục', icon: FolderTree, badge: stats?.totalFolders },
    { id: 'share' as ViewTab, label: 'Chia sẻ', icon: Share2, badge: null },
    { id: 'favorites' as ViewTab, label: 'Yêu thích', icon: Star, badge: null },
    { id: 'trash' as ViewTab, label: 'Thùng rác', icon: Trash2, badge: stats?.trashCount ? stats.trashCount : null },
    { id: 'ai-assistant' as ViewTab, label: 'AI trợ lý', icon: Sparkles, badge: 'Pro' },
    { id: 'stats' as ViewTab, label: 'Thống kê', icon: BarChart3, badge: null },
    { id: 'settings' as ViewTab, label: 'Cài đặt', icon: Settings, badge: null },
  ];

  const usedBytes = stats?.totalStorageBytes || 38.6 * 1024 * 1024 * 1024;
  const maxBytes = stats?.maxStorageBytes || 100 * 1024 * 1024 * 1024;
  const usedPercent = stats?.usedPercentage || 38.6;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        translate="no"
        className={`notranslate fixed md:sticky top-[61px] left-0 h-[calc(100vh-61px)] bg-[#064AA8] text-white flex flex-col justify-between transition-all duration-300 z-50 shadow-xl ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Top Section */}
        <div className="p-3">
          {/* Quick Upload Buttons */}
          <div className="space-y-1.5 mb-4">
            <button
              onClick={() => {
                onOpenUpload();
                if (isMobileOpen) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 px-2.5 rounded-xl shadow-md transition-all group cursor-pointer"
              title="Tải tệp lên"
            >
              <UploadCloud className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span className="text-xs font-bold tracking-wide">Tải tệp lên</span>}
            </button>

            {onOpenUploadFolder && (
              <button
                onClick={() => {
                  onOpenUploadFolder();
                  if (isMobileOpen) onCloseMobile();
                }}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2 px-2.5 rounded-xl shadow-md transition-all group cursor-pointer"
                title="Tải thư mục lên"
              >
                <FolderUp className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                {!isCollapsed && <span className="text-xs font-bold tracking-wide">Tải thư mục lên</span>}
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (isMobileOpen) onCloseMobile();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left relative ${
                    isActive
                      ? 'bg-[#0866E8] text-white shadow-md font-semibold ring-1 ring-white/20'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isActive ? 'text-white scale-110' : 'text-blue-200'
                    }`}
                  />
                  {!isCollapsed && (
                    <span
                      translate="no"
                      className="notranslate flex-1 truncate tracking-wide text-xs md:text-sm"
                    >
                      {item.label}
                    </span>
                  )}

                  {!isCollapsed && item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.id === 'ai-assistant'
                          ? 'bg-amber-400 text-slate-900 animate-pulse'
                          : item.id === 'trash'
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white rounded-r-md" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Storage & Collapse Toggle */}
        <div className="p-3 bg-[#053d8a]/60 border-t border-white/10">
          {!isCollapsed ? (
            <div className="bg-white/10 rounded-xl p-3 border border-white/10 shadow-sm">
              <div className="flex items-center justify-between text-xs font-medium mb-1.5 text-blue-100">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  Dung lượng lưu trữ
                </span>
                <span className="font-bold text-white">{usedPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/25 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(usedPercent, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[11px] text-blue-100">
                <span>{formatBytes(usedBytes)}</span>
                <span className="text-blue-200/80">/ {formatBytes(maxBytes)}</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2" title={`Đã dùng ${usedPercent}%`}>
              <div className="relative w-8 h-8 rounded-full border-2 border-emerald-400 flex items-center justify-center text-[10px] font-bold text-white">
                {Math.round(usedPercent)}%
              </div>
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-full py-1.5 mt-2 rounded-lg bg-white/5 hover:bg-white/15 text-blue-200 hover:text-white transition-colors text-xs gap-1"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Thu gọn menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
