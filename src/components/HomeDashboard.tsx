import React, { useState } from 'react';
import {
  FileText,
  HardDrive,
  Image,
  Video,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Download,
  Share2,
  Eye,
  Trash2,
  Folder,
  FolderTree,
  FolderDown,
  ArrowUpRight,
  Sparkles,
  UploadCloud,
  File,
  Edit2,
  BookOpen,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { StatsData, FileItem, FolderItem } from '../types';
import { formatBytes, formatDate, DEFAULT_FOLDERS, api } from '../services/api';

interface HomeDashboardProps {
  stats: StatsData | null;
  recentFiles: FileItem[];
  folders?: FolderItem[];
  onSelectFolder?: (folderId: string) => void;
  onOpenFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onRenameFile?: (file: FileItem) => void;
  onOpenUpload: (folderId?: string) => void;
  onGoToTab: (tab: any) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  stats,
  recentFiles,
  folders = [],
  onSelectFolder,
  onOpenFile,
  onDownloadFile,
  onShareFile,
  onDeleteFile,
  onRenameFile,
  onOpenUpload,
  onGoToTab,
}) => {
  const [activeSubjectTab, setActiveSubjectTab] = useState<string>('all');

  const counts = stats?.counts || {
    pdf: 456,
    word: 215,
    excel: 86,
    powerpoint: 54,
    image: 320,
    video: 125,
    zip: 45,
    other: 15,
  };

  const totalFiles = stats?.totalDocuments || 175;
  const usedBytes = stats?.totalStorageBytes || 38.6 * 1024 * 1024 * 1024;
  const maxBytes = stats?.maxStorageBytes || 100 * 1024 * 1024 * 1024;
  const usedPercent = stats?.usedPercentage || 38.6;
  const remainingBytes = Math.max(0, maxBytes - usedBytes);

  // Filter root folders only - subfolders stay strictly hidden inside their parent
  const rawRoots = folders.filter(
    (f) =>
      !f.parentId ||
      f.parentId === 'null' ||
      f.parentId === 'undefined' ||
      f.parentId === '' ||
      f.parentId === 'root'
  );
  const rootFolders = (rawRoots.length > 0 ? rawRoots : DEFAULT_FOLDERS.filter((f) => !f.parentId)).sort(
    (a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' })
  );

  // Filter files in table based on selected subject tab
  const displayedTableFiles = (() => {
    let list = recentFiles.filter((f) => !f.isDeleted);
    if (activeSubjectTab !== 'all') {
      list = list.filter((f) => f.folderId === activeSubjectTab);
    }
    // Natural sort: Tuần 1 -> Tuần 35
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' })
    );
  })();

  // Subject quick tabs
  const subjectTabs = [
    { id: 'all', label: 'Tất cả tài liệu gần đây', count: recentFiles.length },
    { id: 'f_1792477017092', label: '1. TIẾNG VIỆT 1', count: recentFiles.filter((f) => f.folderId === 'f_1792477017092').length || 36, color: '#8257E5' },
    { id: 'f_1792477060603', label: '2. TOÁN 1', count: recentFiles.filter((f) => f.folderId === 'f_1792477060603').length || 36, color: '#0866E8' },
    { id: 'f_1792477086352', label: '3. ĐẠO ĐỨC 1', count: recentFiles.filter((f) => f.folderId === 'f_1792477086352').length || 36, color: '#0866E8' },
    { id: 'f_1792477101211', label: '4. TNXH 1', count: recentFiles.filter((f) => f.folderId === 'f_1792477101211').length || 36, color: '#16B875' },
    { id: 'f_1792477113371', label: '5. HĐTN 1', count: recentFiles.filter((f) => f.folderId === 'f_1792477113371').length || 36, color: '#0866E8' },
  ];

  // File type categories
  const fileTypeCards = [
    {
      title: 'Tổng số tài liệu',
      value: totalFiles.toLocaleString('vi-VN'),
      unit: 'tài liệu',
      icon: FileText,
      bg: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      title: 'Dung lượng đã sử dụng',
      value: formatBytes(usedBytes),
      unit: `/ ${formatBytes(maxBytes)}`,
      icon: HardDrive,
      bg: 'bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
    },
    {
      title: 'Hình ảnh',
      value: counts.image.toLocaleString('vi-VN'),
      unit: 'tài liệu',
      icon: Image,
      bg: 'bg-sky-50 border-sky-200',
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-100',
    },
    {
      title: 'Video',
      value: counts.video.toLocaleString('vi-VN'),
      unit: 'tài liệu',
      icon: Video,
      bg: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
    },
    {
      title: 'PDF',
      value: counts.pdf.toLocaleString('vi-VN'),
      unit: 'tài liệu',
      icon: FileCode,
      bg: 'bg-rose-50 border-rose-200',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
    },
    {
      title: 'Word',
      value: counts.word.toLocaleString('vi-VN'),
      unit: 'tài liệu',
      icon: FileText,
      bg: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-200',
    },
    {
      title: 'Excel',
      value: counts.excel.toLocaleString('vi-VN'),
      unit: 'tài liệu',
      icon: FileSpreadsheet,
      bg: 'bg-green-50 border-green-200',
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-200',
    },
    {
      title: 'PowerPoint',
      value: counts.powerpoint.toLocaleString('vi-VN'),
      unit: 'tài liệu',
      icon: Presentation,
      bg: 'bg-amber-50 border-amber-200',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
  ];

  const donutData = [
    { label: 'Word (55%)', value: 55, color: '#0866E8' },
    { label: 'PDF (20%)', value: 20, color: '#F04444' },
    { label: 'PowerPoint (10%)', value: 10, color: '#FF9F1C' },
    { label: 'Excel (5%)', value: 5, color: '#16B875' },
    { label: 'Hình ảnh (5%)', value: 5, color: '#38BDF8' },
    { label: 'Video (5%)', value: 5, color: '#8257E5' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner / Welcome Area */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-400 text-slate-900 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Năm học 2026 - 2027
            </span>
            <span className="text-blue-100 text-xs">Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold mb-1.5">
            Chào mừng Thầy Từ Văn Gọn đến với Kho Dữ Liệu Giáo Dục
          </h2>
          <p className="text-blue-100 text-xs md:text-sm leading-relaxed mb-4">
            Toàn bộ kế hoạch bài dạy, giáo án Tiếng Việt 1 (35 tuần), Toán 1, Đạo đức 1, TNXH 1, HĐTN 1 và tư liệu giảng dạy được lưu trữ an toàn và sẵn sàng truy cập mọi lúc mọi nơi.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenUpload()}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-4 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Tải lên tài liệu mới
            </button>
            {onSelectFolder && (
              <button
                onClick={() => onSelectFolder('f_1792476597159')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-2 cursor-pointer border border-blue-400/50"
              >
                <BookOpen className="w-4 h-4" />
                Mở Giáo Án Các Lớp (180 tệp)
              </button>
            )}
            <button
              onClick={() => onGoToTab('ai-assistant')}
              className="bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold px-4 py-2 rounded-xl text-xs border border-white/30 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Nhờ AI soạn giáo án & phân tích
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
          <HardDrive className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* 8 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {fileTypeCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${card.bg} shadow-xs hover:shadow-md transition-all duration-200 bg-white`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 truncate">{card.title}</span>
                <div className={`p-1.5 rounded-lg ${card.iconBg} ${card.iconColor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {card.value}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{card.unit}</div>
            </div>
          );
        })}
      </div>

      {/* SECTION: 11 THƯ MỤC GIÁO ÁN & DỮ LIỆU CỦA THẦY GỌN (Prominent Folder Grid) */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <FolderTree className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {rootFolders.length || 12} Thư Mục Giáo Án & Tư Liệu Giảng Dạy Của Thầy Gọn
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {rootFolders.length} thư mục chính
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bấm vào thư mục bất kỳ để mở xem toàn bộ danh sách giáo án, bài giảng và tài liệu bên trong.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                api.downloadFolder('all', 'Kho_Tai_Lieu_Thay_Tu_Van_Gon');
              }}
              className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1.5 cursor-pointer bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl transition-colors border border-sky-200 shadow-xs active:scale-95"
              title="Tải toàn bộ kho tài liệu và giáo án về máy tính (.zip)"
            >
              <FolderDown className="w-3.5 h-3.5 text-sky-600" />
              <span>Tải toàn bộ (.zip)</span>
            </button>
            <button
              onClick={() => onGoToTab('folders')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors border border-blue-200"
            >
              <span>Quản lý chi tiết cây thư mục</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Folder Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
          {rootFolders.map((folder) => {
            const isLessonPlans = folder.id === 'f_1792476597159' || folder.name.includes('GIÁO ÁN');
            const fileCount = folder.fileCount ?? 0;

            return (
              <div
                key={folder.id}
                onClick={() => onSelectFolder && onSelectFolder(folder.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  isLessonPlans
                    ? 'bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 border-blue-300 ring-2 ring-blue-200 shadow-sm hover:shadow-md hover:border-blue-500'
                    : 'bg-white hover:bg-blue-50/40 border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: `${folder.color || '#0866E8'}20`,
                        color: folder.color || '#0866E8',
                      }}
                    >
                      <Folder className="w-5 h-5 fill-current" />
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                          isLessonPlans
                            ? 'bg-blue-600 text-white shadow-xs'
                            : fileCount > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {fileCount} tệp
                      </span>
                      {isLessonPlans && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded">
                          Lớp 1 - Lớp 5 GDPT 2018
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs md:text-sm line-clamp-1 mb-1">
                    {folder.name}
                  </h4>

                  <p className="text-[11px] text-slate-400">
                    Dung lượng: {formatBytes(folder.totalSize || 0)}
                  </p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span
                    className={`font-semibold flex items-center gap-1 ${
                      isLessonPlans ? 'text-blue-700 font-bold' : 'text-blue-600 group-hover:translate-x-0.5 transition-transform'
                    }`}
                  >
                    {isLessonPlans ? 'Mở xem giáo án các lớp' : 'Mở xem tệp'}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        api.downloadFolder(folder.id, folder.name);
                      }}
                      className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                      title={`Tải thư mục "${folder.name}" về máy (.zip)`}
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400">Mã: {folder.code}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle Row: Donut Chart & Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Donut Chart: Tỷ lệ loại tài liệu */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Tỷ lệ loại tài liệu</h3>
            <span className="text-xs text-blue-600 font-medium">Chi tiết</span>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0866E8" strokeWidth="18" strokeDasharray="55 45" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F04444" strokeWidth="18" strokeDasharray="20 80" strokeDashoffset="-55" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#FF9F1C" strokeWidth="18" strokeDasharray="10 90" strokeDashoffset="-75" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#16B875" strokeWidth="18" strokeDasharray="5 95" strokeDashoffset="-85" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#38BDF8" strokeWidth="18" strokeDasharray="5 95" strokeDashoffset="-90" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8257E5" strokeWidth="18" strokeDasharray="5 95" strokeDashoffset="-95" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 font-medium">Tổng cộng</span>
                <span className="text-base font-extrabold text-slate-800">{totalFiles}</span>
                <span className="text-[10px] text-blue-600 font-semibold">Tài liệu</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {donutData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dung lượng lưu trữ (Storage overview) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Dung lượng lưu trữ</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Gói Giáo Viên 100 GB
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Lưu trữ an toàn trên máy chủ đám mây, bảo vệ bằng mã hóa và sao lưu định kỳ cho toàn bộ tư liệu giảng dạy.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-semibold text-slate-700">
                  Đã dùng {formatBytes(usedBytes)} / {formatBytes(maxBytes)}
                </span>
                <span className="font-extrabold text-blue-600">{usedPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(usedPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
                <span>Còn trống: {formatBytes(remainingBytes)}</span>
                <span className="text-emerald-600 font-medium">Trạng thái: Hoàn hảo</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-500" />
                Tổng số thư mục chính
              </span>
              <span className="font-bold text-slate-800">{stats?.totalFolders || rootFolders.length || 12} thư mục</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Tệp trong thùng rác
              </span>
              <span className="font-bold text-slate-800">{stats?.trashCount || 0} tệp</span>
            </div>
          </div>
        </div>

        {/* Shortcut Action Box: Quick Education Tools */}
        <div className="bg-gradient-to-br from-[#EAF4FF] to-blue-50 p-5 rounded-2xl border border-blue-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Trợ Lý Giáo Dục Thầy Gọn</h3>
                <span className="text-[11px] text-blue-700 font-medium">Hỗ trợ nghiệp vụ chuyên môn</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Trợ lý AI được tích hợp tài liệu chương trình giáo dục tiểu học mới, hỗ trợ Thầy Gọn:
            </p>

            <ul className="text-xs text-slate-700 space-y-1.5 font-medium mb-4">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Soạn kế hoạch bài dạy môn Toán, Tiếng Việt Lớp 1
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Viết nhận xét học sinh định kỳ theo Thông tư 27
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Lập ma trận đề kiểm tra 3 mức độ đạt chuẩn
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Tóm tắt và tra cứu văn bản điều hành trường học
              </li>
            </ul>
          </div>

          <button
            onClick={() => onGoToTab('ai-assistant')}
            className="w-full bg-[#0866E8] hover:bg-[#064AA8] text-white font-semibold py-2 px-3 rounded-xl text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Mở Trợ lý AI của Thầy Gọn</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table: Danh Sách Giáo Án & Tài Liệu với Bộ Lọc Thư Mục */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-bold text-slate-900">
              Danh sách giáo án & tài liệu giảng dạy
            </h3>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {displayedTableFiles.length} tệp
            </span>
          </div>

          <button
            onClick={() => {
              if (activeSubjectTab !== 'all' && onSelectFolder) {
                onSelectFolder(activeSubjectTab);
              } else {
                onGoToTab('my-files');
              }
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
          >
            {activeSubjectTab !== 'all' ? 'Mở trong thư mục đầy đủ' : 'Xem tất cả tài liệu'}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Subject Tabs */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Lọc theo môn:</span>
          {subjectTabs.map((tab) => {
            const isActive = activeSubjectTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubjectTab(tab.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#0866E8] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.color && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isActive ? '#ffffff' : tab.color }}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Tên tài liệu</th>
                <th className="py-3 px-3">Loại</th>
                <th className="py-3 px-3">Dung lượng</th>
                <th className="py-3 px-3">Ngày cập nhật</th>
                <th className="py-3 px-3">Thư mục</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedTableFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có tài liệu nào trong mục này.
                  </td>
                </tr>
              ) : (
                displayedTableFiles.slice(0, 35).map((file) => (
                  <tr key={file.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <File className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 group">
                            <p
                              onClick={() => onOpenFile(file)}
                              className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer truncate max-w-xs md:max-w-md"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            {onRenameFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRenameFile(file);
                                }}
                                className="opacity-70 group-hover:opacity-100 p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all cursor-pointer shrink-0"
                                title="Sửa tên tệp này"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Phiên bản: v{file.versions?.length || 1}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">
                        {file.extension?.toUpperCase() || 'DOCX'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-600">
                      {formatBytes(file.size || 0)}
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {formatDate(file.updatedDate || file.uploadDate)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        onClick={() => onSelectFolder && onSelectFolder(file.folderId)}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline cursor-pointer font-medium max-w-[140px] truncate"
                        title={file.folderName}
                      >
                        <Folder className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{file.folderName}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onOpenFile(file)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="Xem trước tệp"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          title="Tải tệp về máy"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onShareFile(file)}
                          className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
                          title="Chia sẻ tệp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteFile(file)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Chuyển vào thùng rác"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
