import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Image as ImageIcon,
  Video as VideoIcon,
  Layers,
  History,
} from 'lucide-react';
import { FileItem } from '../types';
import { api, formatBytes, formatDate } from '../services/api';

interface FileViewerModalProps {
  file: FileItem | null;
  onClose: () => void;
  onShare: (file: FileItem) => void;
  onOpenVersions: (file: FileItem) => void;
  onOpenAIAnalyze?: (file: FileItem) => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  onClose,
  onShare,
  onOpenVersions,
  onOpenAIAnalyze,
}) => {
  if (!file) return null;

  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = file.category === 'pdf' ? 36 : file.category === 'word' ? 5 : file.category === 'powerpoint' ? 12 : 1;
  const [docSearch, setDocSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const handleDownload = () => {
    window.location.href = api.getDownloadUrl(file.id);
  };

  const renderViewerContent = () => {
    const isImage = file.category === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(file.extension);
    const isVideo = file.category === 'video' || ['mp4', 'mov', 'webm'].includes(file.extension);

    if (isImage) {
      return (
        <div className="flex items-center justify-center min-h-[500px] p-4 bg-slate-900/5">
          <img
            src={file.previewContent?.startsWith('http') ? file.previewContent : `/api/files/${file.id}/download`}
            alt={file.name}
            className="max-h-[650px] max-w-full rounded-lg shadow-md object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-black rounded-lg">
          <video
            controls
            className="max-h-[600px] max-w-full rounded shadow-lg"
            src={`/api/files/${file.id}/download`}
          >
            Trình duyệt của Thầy không hỗ trợ thẻ video.
          </video>
          <p className="text-white text-xs mt-3">{file.name}</p>
        </div>
      );
    }

    // PDF, Word, Excel, PPT Preview Mockup matching screenshot #4
    return (
      <div className="flex flex-1 overflow-hidden bg-slate-100">
        {/* Left Thumbnails Strip */}
        {showThumbnails && file.category === 'pdf' && (
          <div className="w-48 bg-slate-200/70 border-r border-slate-300 p-3 overflow-y-auto space-y-3 hidden sm:block shrink-0">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Các trang ({totalPages})
            </p>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`p-2 rounded-lg bg-white border cursor-pointer transition-all text-center ${
                  currentPage === idx + 1
                    ? 'border-blue-600 ring-2 ring-blue-300 shadow-sm'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="h-20 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400 p-1">
                  Trang {idx + 1}
                </div>
                <span className="text-[10px] text-slate-600 font-semibold mt-1 inline-block">
                  Trang {idx + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main Document Canvas */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center">
          <div
            className="bg-white shadow-xl rounded-md p-8 md:p-12 w-full max-w-3xl min-h-[750px] border border-slate-300 font-serif transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Document Header */}
            {file.category === 'pdf' && (
              <div className="text-center space-y-2 border-b-2 border-slate-800 pb-6 mb-6">
                <div className="flex justify-between items-start text-xs font-sans text-slate-800">
                  <div className="text-left font-bold uppercase">
                    BỘ GIÁO DỤC VÀ ĐÀO TẠO
                    <br />
                    <span className="text-slate-600 font-normal">Số: 27/2020/TT-BGDĐT</span>
                  </div>
                  <div className="text-right font-bold uppercase">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    <br />
                    <span className="font-semibold underline">Độc lập - Tự do - Hạnh phúc</span>
                  </div>
                </div>

                <div className="pt-4">
                  <h1 className="text-base md:text-lg font-bold text-slate-900 uppercase tracking-wide">
                    QUY ĐỊNH ĐÁNH GIÁ HỌC SINH TIỂU HỌC
                  </h1>
                  <p className="text-xs italic text-slate-600">(Ban hành kèm theo Thông tư 27/2020/TT-BGDĐT)</p>
                </div>
              </div>
            )}

            {file.category === 'word' && (
              <div className="text-center space-y-2 border-b border-blue-200 pb-4 mb-6">
                <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-sans font-semibold">
                  TRƯỜNG TIỂU HỌC PHƯỜNG AN XUYÊN – GIÁO ÁN LỚP 1C
                </span>
                <h1 className="text-lg font-bold text-slate-900 mt-2">
                  {file.name.replace(/\.[^/.]+$/, '')}
                </h1>
                <p className="text-xs font-sans text-slate-500">
                  Giáo viên: Thầy Từ Văn Gọn • Năm học 2026 - 2027
                </p>
              </div>
            )}

            {file.category === 'excel' && (
              <div className="mb-4">
                <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-sans font-semibold">
                  BẢNG DỮ LIỆU ĐIỆN TỬ EXCEL
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-2">{file.name}</h2>
              </div>
            )}

            {/* Document Body */}
            <div className="text-xs md:text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
              {file.previewContent ||
                `Nội dung tài liệu: ${file.name}\n\nChủ sở hữu: Thầy Từ Văn Gọn\nTrường Tiểu học Phường An Xuyên, tỉnh Cà Mau.\nTài liệu đã được lưu trữ an toàn trên đám mây, sẵn sàng phục vụ công tác giảng dạy.`}
            </div>

            {/* Bottom Signature / Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs font-sans text-slate-500">
              <div>
                <p>Kho dữ liệu cá nhân Thầy Gọn</p>
                <p className="text-[10px]">Ngày cập nhật: {formatDate(file.updatedDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">Trang {currentPage} / {totalPages}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full transition-all ${
          isFullscreen ? 'h-full max-w-full' : 'max-w-5xl h-[92vh]'
        }`}
      >
        {/* Top Header Bar matching Mockup #4 */}
        <div className="bg-[#0866E8] text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              {file.category === 'pdf' ? (
                <FileCode className="w-4 h-4 text-red-200" />
              ) : file.category === 'word' ? (
                <FileText className="w-4 h-4 text-blue-100" />
              ) : file.category === 'excel' ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              ) : file.category === 'powerpoint' ? (
                <Presentation className="w-4 h-4 text-amber-200" />
              ) : (
                <FileText className="w-4 h-4 text-white" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate max-w-xs md:max-w-md">{file.name}</h3>
              <p className="text-[11px] text-blue-100 truncate">
                {formatBytes(file.size)} • Thư mục: {file.folderName} • v{file.versions?.length || 1}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải xuống</span>
            </button>

            <button
              onClick={() => onShare(file)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>

            <button
              onClick={() => onOpenVersions(file)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              title="Quản lý lịch sử phiên bản"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Phiên bản</span>
            </button>

            {onOpenAIAnalyze && (
              <button
                onClick={() => onOpenAIAnalyze(file)}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Phân tích AI</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Sub-toolbar (Zoom, Page navigation, Search) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            {file.category === 'pdf' && (
              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={`p-1.5 rounded hover:bg-slate-200 ${showThumbnails ? 'bg-slate-200' : ''}`}
                title="Ẩn/Hiện hình thu nhỏ"
              >
                <Layers className="w-4 h-4 text-slate-600" />
              </button>
            )}

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-0.5 font-bold text-slate-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
              className="p-1 rounded hover:bg-slate-200 text-slate-700"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700 w-12 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(200, zoomLevel + 15))}
              className="p-1 rounded hover:bg-slate-200 text-slate-700"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="p-1 rounded hover:bg-slate-200 text-slate-500 text-[11px]"
              title="Đặt lại zoom"
            >
              100%
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded hover:bg-slate-200 text-slate-600 ml-2"
              title="Toàn màn hình"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        {renderViewerContent()}
      </div>
    </div>
  );
};
