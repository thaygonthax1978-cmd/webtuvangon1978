import React from 'react';
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
  ArrowUpRight,
  Sparkles,
  UploadCloud,
  File,
  Edit2,
} from 'lucide-react';
import { StatsData, FileItem } from '../types';
import { formatBytes, formatDate } from '../services/api';

interface HomeDashboardProps {
  stats: StatsData | null;
  recentFiles: FileItem[];
  onOpenFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onRenameFile?: (file: FileItem) => void;
  onOpenUpload: () => void;
  onGoToTab: (tab: any) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  stats,
  recentFiles,
  onOpenFile,
  onDownloadFile,
  onShareFile,
  onDeleteFile,
  onRenameFile,
  onOpenUpload,
  onGoToTab,
}) => {
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

  const totalFiles = stats?.totalDocuments || 1256;
  const usedBytes = stats?.totalStorageBytes || 38.6 * 1024 * 1024 * 1024;
  const maxBytes = stats?.maxStorageBytes || 100 * 1024 * 1024 * 1024;
  const usedPercent = stats?.usedPercentage || 38.6;
  const remainingBytes = Math.max(0, maxBytes - usedBytes);

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

  // Helper for file badge
  const getFileBadge = (category: string) => {
    switch (category) {
      case 'pdf':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700">PDF</span>;
      case 'word':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700">Word</span>;
      case 'excel':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">Excel</span>;
      case 'powerpoint':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">PowerPoint</span>;
      case 'image':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-700">Hình ảnh</span>;
      case 'video':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700">Video</span>;
      case 'zip':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">ZIP</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">Khác</span>;
    }
  };

  const donutData = [
    { label: 'PDF (36%)', value: 36, color: '#F04444' },
    { label: 'Word (17%)', value: 17, color: '#0866E8' },
    { label: 'Excel (7%)', value: 7, color: '#16B875' },
    { label: 'PowerPoint (6%)', value: 6, color: '#FF9F1C' },
    { label: 'Hình ảnh (25%)', value: 25, color: '#38BDF8' },
    { label: 'Video (10%)', value: 10, color: '#8257E5' },
    { label: 'Khác (5%)', value: 5, color: '#94A3B8' },
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
            Toàn bộ kế hoạch bài dạy, bài giảng điện tử, ma trận đề kiểm tra và tài liệu đánh giá học sinh tiểu học theo Thông tư 27 được lưu trữ an toàn và sẵn sàng truy cập mọi lúc mọi nơi.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenUpload}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-4 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              Tải lên tài liệu mới
            </button>
            <button
              onClick={() => onGoToTab('ai-assistant')}
              className="bg-blue-500/30 hover:bg-blue-500/40 text-white font-semibold px-4 py-2 rounded-xl text-xs border border-white/30 backdrop-blur-md transition-all flex items-center gap-2"
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

      {/* Middle Row: Donut Chart & Storage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Donut Chart: Tỷ lệ loại tài liệu */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Tỷ lệ loại tài liệu</h3>
            <span className="text-xs text-blue-600 font-medium">Chi tiết</span>
          </div>

          <div className="flex items-center justify-center py-2">
            {/* SVG Donut */}
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {/* SVG Circle segments */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F04444" strokeWidth="18" strokeDasharray="36 64" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0866E8" strokeWidth="18" strokeDasharray="17 83" strokeDashoffset="-36" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#16B875" strokeWidth="18" strokeDasharray="7 93" strokeDashoffset="-53" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#FF9F1C" strokeWidth="18" strokeDasharray="6 94" strokeDashoffset="-60" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#38BDF8" strokeWidth="18" strokeDasharray="25 75" strokeDashoffset="-66" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8257E5" strokeWidth="18" strokeDasharray="10 90" strokeDashoffset="-91" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-slate-400 font-medium">Tổng cộng</span>
                <span className="text-base font-extrabold text-slate-800">{totalFiles}</span>
                <span className="text-[10px] text-blue-600 font-semibold">Tài liệu</span>
              </div>
            </div>
          </div>

          {/* Legend */}
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

            {/* Storage Progress */}
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
                Tổng số thư mục khởi tạo
              </span>
              <span className="font-bold text-slate-800">{stats?.totalFolders || 11} thư mục</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                Tệp trong thùng rác
              </span>
              <span className="font-bold text-slate-800">{stats?.trashCount || 1} tệp</span>
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

      {/* Table: Tài liệu gần đây */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-bold text-slate-900">Tài liệu gần đây</h3>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
              {recentFiles.length} tệp
            </span>
          </div>

          <button
            onClick={() => onGoToTab('my-files')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            Xem tất cả
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Tên tài liệu</th>
                <th className="py-3 px-3">Loại</th>
                <th className="py-3 px-3">Dung lượng</th>
                <th className="py-3 px-3">Ngày tải lên</th>
                <th className="py-3 px-3">Thư mục</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có tài liệu nào. Nhấn "Tải tài liệu lên" để bắt đầu!
                  </td>
                </tr>
              ) : (
                recentFiles.slice(0, 7).map((file) => (
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
                    <td className="py-3 px-3">{getFileBadge(file.category)}</td>
                    <td className="py-3 px-3 font-medium text-slate-600">{formatBytes(file.size)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(file.uploadDate)}</td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Folder className="w-3 h-3 text-amber-500" />
                        {file.folderName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onRenameFile && (
                          <button
                            onClick={() => onRenameFile(file)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Đổi tên tệp"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenFile(file)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem trước tài liệu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onShareFile(file)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Chia sẻ"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteFile(file)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
