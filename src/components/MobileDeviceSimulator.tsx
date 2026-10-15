import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Home,
  FileText,
  Plus,
  Search,
  Settings,
  HardDrive,
  Folder,
  Image,
  Video,
  FileCode,
  FileSpreadsheet,
  Cloud,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { FileItem, FolderItem, StatsData, UserProfile } from '../types';
import { formatBytes } from '../services/api';

interface MobileDeviceSimulatorProps {
  user: UserProfile | null;
  stats: StatsData | null;
  files: FileItem[];
  folders: FolderItem[];
  onClose: () => void;
  onOpenFile: (file: FileItem) => void;
  onOpenUpload: () => void;
}

export const MobileDeviceSimulator: React.FC<MobileDeviceSimulatorProps> = ({
  user,
  stats,
  files,
  folders,
  onClose,
  onOpenFile,
  onOpenUpload,
}) => {
  const [activeMobileTab, setActiveMobileTab] = useState<'home' | 'files' | 'search' | 'settings'>('home');
  const [mobileSearch, setMobileSearch] = useState('');

  const activeFiles = files.filter((f) => !f.isDeleted);
  const totalDocs = stats?.totalDocuments || activeFiles.length;
  const usedBytes = stats?.totalStorageBytes || 38.6 * 1024 * 1024 * 1024;
  const usedPercent = stats?.usedPercentage || 38.6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="relative flex flex-col items-center">
        {/* Close Button on Top */}
        <div className="w-full flex justify-between items-center mb-2 px-2 text-white">
          <div className="flex items-center gap-2 text-xs font-bold">
            <Smartphone className="w-4 h-4 text-yellow-300" />
            <span>Mục 12: Chế độ hiển thị trên điện thoại thông minh (Mobile Responsive)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smartphone Hardware Frame */}
        <div className="w-[340px] sm:w-[370px] h-[690px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-4 border-slate-700 relative overflow-hidden flex flex-col">
          {/* Dynamic Island / Speaker Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-900 ml-auto mr-3" />
          </div>

          {/* Smartphone Screen Viewport */}
          <div className="w-full h-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col pt-6 relative select-none">
            {/* Mobile Header Bar */}
            <div className="bg-[#0866E8] text-white p-3.5 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                    alt="Thầy Gọn"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs leading-none">KHO DỮ LIỆU</h4>
                  <p className="text-[10px] text-blue-100 font-medium">Thầy Từ Văn Gọn</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveMobileTab('search')}
                  className="p-1 rounded-full bg-white/20 text-white"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Body Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-16">
              {activeMobileTab === 'home' && (
                <>
                  {/* Two Mini Stat Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-medium">Tổng tệp</span>
                      <p className="text-base font-extrabold text-blue-700 mt-0.5">
                        {totalDocs.toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 font-medium">Đã dùng</span>
                      <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                        {formatBytes(usedBytes)}
                      </p>
                    </div>
                  </div>

                  {/* Storage Progress */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1 font-semibold">
                      <span>Bộ nhớ đám mây</span>
                      <span className="text-blue-600">{usedPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(usedPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Format Grid */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 mb-1.5">Phân loại tệp</p>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
                        <FileCode className="w-5 h-5 text-rose-500 mb-1" />
                        <span className="font-semibold text-slate-700">PDF</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
                        <FileText className="w-5 h-5 text-blue-600 mb-1" />
                        <span className="font-semibold text-slate-700">Word</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-600 mb-1" />
                        <span className="font-semibold text-slate-700">Excel</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-col items-center">
                        <Image className="w-5 h-5 text-sky-500 mb-1" />
                        <span className="font-semibold text-slate-700">Ảnh</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Files on Mobile */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[11px] font-bold text-slate-800">Tài liệu mới</p>
                      <span className="text-[10px] text-blue-600 font-semibold">Tất cả</span>
                    </div>

                    <div className="space-y-1.5">
                      {activeFiles.slice(0, 5).map((f) => (
                        <div
                          key={f.id}
                          onClick={() => onOpenFile(f)}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer active:bg-blue-50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">
                                {f.name}
                              </p>
                              <span className="text-[9px] text-slate-400">
                                {formatBytes(f.size)} • {f.folderName}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeMobileTab === 'files' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">Thư mục tài liệu ({folders.length})</p>
                  <div className="space-y-1.5">
                    {folders.map((fld) => (
                      <div
                        key={fld.id}
                        className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <Folder className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">{fld.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {fld.fileCount || 0} tệp
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeMobileTab === 'search' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Tìm tài liệu..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    autoFocus
                  />
                  <div className="space-y-1">
                    {activeFiles
                      .filter((f) => !mobileSearch || f.name.toLowerCase().includes(mobileSearch.toLowerCase()))
                      .map((f) => (
                        <div
                          key={f.id}
                          onClick={() => onOpenFile(f)}
                          className="p-2 bg-white rounded-lg border border-slate-200 text-xs font-medium text-slate-800 truncate cursor-pointer"
                        >
                          {f.name}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeMobileTab === 'settings' && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                  <p className="font-bold text-slate-900">Từ Văn Gọn</p>
                  <p className="text-slate-500 text-[11px]">{user?.school}</p>
                  <p className="text-slate-500 text-[11px]">{user?.email}</p>
                  <div className="pt-2 border-t border-slate-100 text-emerald-600 font-semibold text-[11px]">
                    ✓ 2FA đang bảo vệ
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Bottom Navigation matching Mockup #12 */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center justify-around z-30">
              <button
                onClick={() => setActiveMobileTab('home')}
                className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${
                  activeMobileTab === 'home' ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Trang chủ</span>
              </button>

              <button
                onClick={() => setActiveMobileTab('files')}
                className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${
                  activeMobileTab === 'files' ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Tài liệu</span>
              </button>

              {/* Center Floating Plus Upload Button */}
              <button
                onClick={onOpenUpload}
                className="w-10 h-10 rounded-full bg-[#0866E8] text-white flex items-center justify-center -mt-5 shadow-lg shadow-blue-500/40 active:scale-95 transition-transform"
                title="Tải tệp lên"
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveMobileTab('search')}
                className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${
                  activeMobileTab === 'search' ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Tìm kiếm</span>
              </button>

              <button
                onClick={() => setActiveMobileTab('settings')}
                className={`flex flex-col items-center gap-0.5 text-[9px] font-semibold ${
                  activeMobileTab === 'settings' ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Cài đặt</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
