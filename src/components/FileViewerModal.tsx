import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Layers,
  History,
  Edit2,
  Printer,
  Copy,
  Check,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  SlidersHorizontal,
  ExternalLink,
  RotateCw,
  Image as ImageIcon,
} from 'lucide-react';
import { FileItem } from '../types';
import { api, formatBytes, formatDate } from '../services/api';

interface FileViewerModalProps {
  file: FileItem | null;
  allFiles?: FileItem[];
  onNavigate?: (file: FileItem) => void;
  onClose: () => void;
  onShare: (file: FileItem) => void;
  onOpenVersions: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onOpenAIAnalyze?: (file: FileItem) => void;
}

interface ShortcutItem {
  id: string;
  keys: string[];
  desc: string;
  category: 'format' | 'align' | 'file' | 'nav' | 'unikey';
}

const BANG_GO_TAT_SHORTCUTS: ShortcutItem[] = [
  // Định dạng chữ
  { id: 'b1', keys: ['Ctrl', 'B'], desc: 'In đậm chữ (Bold)', category: 'format' },
  { id: 'b2', keys: ['Ctrl', 'I'], desc: 'In nghiêng chữ (Italic)', category: 'format' },
  { id: 'b3', keys: ['Ctrl', 'U'], desc: 'Gạch chân dưới chữ (Underline)', category: 'format' },
  { id: 'b4', keys: ['Ctrl', '['], desc: 'Thu nhỏ cỡ chữ lại 1 cấp', category: 'format' },
  { id: 'b5', keys: ['Ctrl', ']'], desc: 'Phóng to cỡ chữ lên 1 cấp', category: 'format' },
  { id: 'b6', keys: ['Ctrl', '='], desc: 'Viết chỉ số dưới (Ví dụ: H₂O)', category: 'format' },
  { id: 'b7', keys: ['Ctrl', 'Shift', '='], desc: 'Viết chỉ số trên (Ví dụ: m², x³)', category: 'format' },
  { id: 'b8', keys: ['Ctrl', 'D'], desc: 'Mở hộp thoại định dạng Font chữ toàn diện', category: 'format' },

  // Căn lề & Đoạn văn
  { id: 'a1', keys: ['Ctrl', 'L'], desc: 'Căn lề trái (Left)', category: 'align' },
  { id: 'a2', keys: ['Ctrl', 'E'], desc: 'Căn giữa trang (Center)', category: 'align' },
  { id: 'a3', keys: ['Ctrl', 'R'], desc: 'Căn lề phải (Right)', category: 'align' },
  { id: 'a4', keys: ['Ctrl', 'J'], desc: 'Căn đều hai bên lề văn bản (Justify)', category: 'align' },
  { id: 'a5', keys: ['Ctrl', 'M'], desc: 'Lùi cả hai tab vào đầu dòng', category: 'align' },
  { id: 'a6', keys: ['Ctrl', 'T'], desc: 'Lùi tab lớn vào đầu dòng', category: 'align' },
  { id: 'a7', keys: ['Ctrl', 'Q'], desc: 'Xóa định dạng thụt lề tab', category: 'align' },

  // Thao tác tệp & Soạn thảo
  { id: 'f1', keys: ['Ctrl', 'S'], desc: 'Lưu văn bản tức thời (Save)', category: 'file' },
  { id: 'f2', keys: ['Ctrl', 'A'], desc: 'Chọn tất cả nội dung (Select All)', category: 'file' },
  { id: 'f3', keys: ['Ctrl', 'C'], desc: 'Sao chép nội dung đã chọn (Copy)', category: 'file' },
  { id: 'f4', keys: ['Ctrl', 'X'], desc: 'Cắt nội dung (Cut)', category: 'file' },
  { id: 'f5', keys: ['Ctrl', 'V'], desc: 'Dán nội dung (Paste)', category: 'file' },
  { id: 'f6', keys: ['Ctrl', 'Z'], desc: 'Hoàn tác bước trước (Undo)', category: 'file' },
  { id: 'f7', keys: ['Ctrl', 'Y'], desc: 'Phục hồi lại bước vừa hoàn tác (Redo)', category: 'file' },
  { id: 'f8', keys: ['Ctrl', 'N'], desc: 'Tạo một trang tài liệu Word mới', category: 'file' },
  { id: 'f9', keys: ['Ctrl', 'O'], desc: 'Mở tệp Word đã có trên máy tính', category: 'file' },
  { id: 'f10', keys: ['Ctrl', 'P'], desc: 'Mở hộp thoại In ấn văn bản (Print)', category: 'file' },
  { id: 'f11', keys: ['Ctrl', 'F'], desc: 'Tìm kiếm từ khóa trong văn bản', category: 'file' },
  { id: 'f12', keys: ['Ctrl', 'H'], desc: 'Tìm kiếm và Thay thế từ khóa (Replace)', category: 'file' },
  { id: 'f13', keys: ['Ctrl', 'G'], desc: 'Nhảy nhanh đến trang cần tìm', category: 'file' },
  { id: 'f14', keys: ['Ctrl', 'K'], desc: 'Chèn siêu liên kết (Hyperlink)', category: 'file' },
  { id: 'f15', keys: ['Ctrl', 'W'], desc: 'Đóng tài liệu / Thoát trang Word', category: 'file' },
  { id: 'f16', keys: ['Alt', 'F4'], desc: 'Thoát hẳn chương trình đang mở', category: 'file' },
  { id: 'f17', keys: ['F2'], desc: 'Đổi tên tệp nhanh chóng', category: 'file' },

  // Điều hướng & Chọn khối
  { id: 'n1', keys: ['Ctrl', 'Enter'], desc: 'Sang trang mới ngay lập tức (Ngắt trang)', category: 'nav' },
  { id: 'n2', keys: ['Ctrl', 'Home'], desc: 'Nhảy con trỏ về đầu tài liệu', category: 'nav' },
  { id: 'n3', keys: ['Ctrl', 'End'], desc: 'Nhảy con trỏ xuống cuối tài liệu', category: 'nav' },
  { id: 'n4', keys: ['Shift', 'Home'], desc: 'Chọn khối văn bản từ con trỏ về đầu dòng', category: 'nav' },
  { id: 'n5', keys: ['Shift', 'End'], desc: 'Chọn khối văn bản từ con trỏ đến hết dòng', category: 'nav' },
  { id: 'n6', keys: ['Ctrl', '← / →'], desc: 'Nhảy con trỏ nhanh qua từng từ', category: 'nav' },
  { id: 'n7', keys: ['PrintScreen'], desc: 'Chụp ảnh màn hình (rồi dán Ctrl + V vào bài soạn)', category: 'nav' },
  { id: 'n8', keys: ['Phím Space'], desc: 'Đánh dấu tích chọn vào ô vuông', category: 'nav' },

  // Bộ gõ UniKey & Mẹo máy tính
  { id: 'u1', keys: ['Ctrl', 'Shift', 'F1'], desc: 'Chuyển mã gõ sang Unicode (chuẩn Bộ GD&ĐT)', category: 'unikey' },
  { id: 'u2', keys: ['Ctrl', 'Shift', 'F3'], desc: 'Chuyển mã gõ sang VNI Windows', category: 'unikey' },
  { id: 'u3', keys: ['Ctrl', 'Shift', 'F5'], desc: 'Mở nhanh bảng điều khiển UniKey', category: 'unikey' },
  { id: 'u4', keys: ['Ctrl', 'Shift', 'F6'], desc: 'Mở hộp thoại chuyển mã UniKey Toolkit', category: 'unikey' },
  { id: 'u5', keys: ['Ctrl', 'Shift', 'F9'], desc: 'Thực hiện chuyển mã nhanh từ Clipboard', category: 'unikey' },
  { id: 'u6', keys: ['ss + youtube'], desc: 'Mẹo tải video YouTube: Thêm 2 chữ "ss" trước link youtube (ssyoutube.com/...)', category: 'unikey' },
];

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file: initialFile,
  allFiles = [],
  onNavigate,
  onClose,
  onShare,
  onOpenVersions,
  onRename,
  onOpenAIAnalyze,
}) => {
  const [currentFile, setCurrentFile] = useState<FileItem | null>(initialFile);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [galleryScope, setGalleryScope] = useState<'folder' | 'all'>('folder');

  useEffect(() => {
    if (initialFile) {
      setCurrentFile(initialFile);
      setRotation(0);
      setImageError(false);
      setZoomLevel(100);
    }
  }, [initialFile]);

  if (!currentFile) return null;
  const file = currentFile;

  const isImageFile = (f: FileItem): boolean => {
    const ext = (f.extension || '').toLowerCase().replace('.', '');
    return f.category === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext);
  };
  const isImage = isImageFile(file);

  const folderImages = useMemo(() => {
    return allFiles.filter((f) => !f.isDeleted && f.folderId === file.folderId && isImageFile(f));
  }, [allFiles, file.folderId]);

  const allImages = useMemo(() => {
    return allFiles.filter((f) => !f.isDeleted && isImageFile(f));
  }, [allFiles]);

  const currentGalleryList = useMemo(() => {
    if (!isImage) {
      const folderFiles = allFiles.filter((f) => !f.isDeleted && f.folderId === file.folderId);
      return folderFiles.length > 0 ? folderFiles : allFiles.filter((f) => !f.isDeleted);
    }
    if (galleryScope === 'folder' && folderImages.length > 0) {
      if (!folderImages.some((f) => f.id === file.id)) {
        return [file, ...folderImages];
      }
      return folderImages;
    }
    return allImages.length > 0 ? (allImages.some((f) => f.id === file.id) ? allImages : [file, ...allImages]) : [file];
  }, [isImage, galleryScope, folderImages, allImages, allFiles, file]);

  const currentIndex = currentGalleryList.findIndex((f) => f.id === file.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < currentGalleryList.length - 1;

  const handleSwitchFile = (next: FileItem) => {
    setCurrentFile(next);
    setRotation(0);
    setImageError(false);
    setZoomLevel(100);
    onNavigate?.(next);
  };

  const goToPrev = () => {
    if (hasPrev) {
      handleSwitchFile(currentGalleryList[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      handleSwitchFile(currentGalleryList[currentIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (hasPrev) goToPrev();
      } else if (e.key === 'ArrowRight') {
        if (hasNext) goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentGalleryList, hasPrev, hasNext, onClose]);

  const getImageSrc = (f: FileItem): string => {
    const lowerName = (f.name || '').toLowerCase();
    if (
      lowerName.includes('anh the') ||
      lowerName.includes('ảnh thẻ') ||
      lowerName.includes('3x4') ||
      lowerName.includes('hinh the')
    ) {
      return '/uploads/anh_the_thay_gon.jpg';
    }
    if (f.previewContent && (f.previewContent.startsWith('http') || f.previewContent.startsWith('data:image'))) {
      return f.previewContent;
    }
    if (f.filename) {
      return `/uploads/${f.filename}`;
    }
    return api.getFileViewUrl(f);
  };

  const isWord = file.category === 'word' || ['doc', 'docx'].includes(file.extension.toLowerCase());
  const isBangGoTat = file.name.toLowerCase().includes('bang go tat') || file.name.toLowerCase().includes('bảng gõ tắt');

  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = file.category === 'pdf' ? 36 : isWord ? 1 : file.category === 'powerpoint' ? 12 : 1;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Word specific states
  const [wordTab, setWordTab] = useState<'shortcuts' | 'text'>('shortcuts');
  const [shortcutCategory, setShortcutCategory] = useState<string>('all');
  const [shortcutSearch, setShortcutSearch] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState(14);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleDownload = () => {
    window.location.href = api.getDownloadUrl(file.id);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySingleShortcut = (keys: string[], desc: string, id: string) => {
    const textToCopy = `${keys.join(' + ')}: ${desc}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCopyAllContent = () => {
    if (file.previewContent) {
      navigator.clipboard.writeText(file.previewContent);
    } else {
      const allText = BANG_GO_TAT_SHORTCUTS.map((s) => `${s.keys.join(' + ')}: ${s.desc}`).join('\n');
      navigator.clipboard.writeText(allText);
    }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  const filteredShortcuts = useMemo(() => {
    return BANG_GO_TAT_SHORTCUTS.filter((s) => {
      const matchCat = shortcutCategory === 'all' || s.category === shortcutCategory;
      const matchSearch =
        !shortcutSearch.trim() ||
        s.desc.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
        s.keys.join(' ').toLowerCase().includes(shortcutSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [shortcutCategory, shortcutSearch]);

  const renderWordViewer = () => {
    return (
      <div className="flex flex-col flex-1 overflow-hidden bg-[#eef2f8]">
        {/* Microsoft Word Ribbon Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          {/* Word Ribbon Left: Tabs & Font options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Tabs */}
            {isBangGoTat && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-2">
                <button
                  onClick={() => setWordTab('shortcuts')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    wordTab === 'shortcuts'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
                  Bảng phím tắt trực quan
                </button>
                <button
                  onClick={() => setWordTab('text')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    wordTab === 'text'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1" />
                  Trang văn bản in ấn
                </button>
              </div>
            )}

            {/* Font formatting controls */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 font-medium focus:outline-blue-500"
              >
                <option value="Times New Roman">Times New Roman</option>
                <option value="Arial">Arial</option>
                <option value="Calibri">Calibri</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Aptos">Aptos (Word 365)</option>
              </select>

              <div className="flex items-center border border-slate-300 rounded bg-slate-50 px-1 py-0.5">
                <button
                  onClick={() => setFontSize(Math.max(10, fontSize - 1))}
                  className="px-1 text-slate-600 hover:text-blue-600 font-bold text-xs"
                  title="Giảm cỡ chữ"
                >
                  A-
                </button>
                <span className="px-1.5 text-xs font-bold text-slate-800">{fontSize}pt</span>
                <button
                  onClick={() => setFontSize(Math.min(26, fontSize + 1))}
                  className="px-1 text-slate-600 hover:text-blue-600 font-bold text-xs"
                  title="Tăng cỡ chữ"
                >
                  A+
                </button>
              </div>

              {/* B, I, U Buttons */}
              <div className="flex items-center gap-0.5 border border-slate-300 rounded bg-slate-50 p-0.5">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`p-1 rounded ${isBold ? 'bg-blue-100 text-blue-700 font-black' : 'text-slate-600 hover:bg-slate-200'}`}
                  title="In đậm (Ctrl + B)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-1 rounded ${isItalic ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  title="In nghiêng (Ctrl + I)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsUnderline(!isUnderline)}
                  className={`p-1 rounded ${isUnderline ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  title="Gạch chân (Ctrl + U)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Text Alignments */}
              <div className="flex items-center gap-0.5 border border-slate-300 rounded bg-slate-50 p-0.5 hidden sm:flex">
                <button
                  onClick={() => setTextAlign('left')}
                  className={`p-1 rounded ${textAlign === 'left' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  title="Căn trái (Ctrl + L)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className={`p-1 rounded ${textAlign === 'center' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  title="Căn giữa (Ctrl + E)"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTextAlign('right')}
                  className={`p-1 rounded ${textAlign === 'right' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  title="Căn phải (Ctrl + R)"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTextAlign('justify')}
                  className={`p-1 rounded ${textAlign === 'justify' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-200'}`}
                  title="Căn đều hai bên (Ctrl + J)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Word Ribbon Right: Print & Copy actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAllContent}
              className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Sao chép toàn bộ văn bản vào bộ nhớ tạm"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Đã chép!' : 'Chép nội dung'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="In trang Word này ra giấy hoặc xuất PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In trang Word</span>
            </button>
          </div>
        </div>

        {/* Word Horizontal Ruler (Thước kẻ lề chuẩn Word A4) */}
        <div className="bg-[#f0f3f8] border-b border-slate-300 py-1 px-8 hidden md:flex items-center justify-center text-[10px] text-slate-400 select-none overflow-hidden">
          <div className="w-full max-w-3xl flex justify-between items-center px-4">
            <span className="font-mono text-slate-500">▼ 0</span>
            <span className="font-mono">1</span>
            <span className="font-mono">2</span>
            <span className="font-mono">3</span>
            <span className="font-mono">4</span>
            <span className="font-mono">5</span>
            <span className="font-mono">6</span>
            <span className="font-mono">7</span>
            <span className="font-mono">8</span>
            <span className="font-mono">9</span>
            <span className="font-mono">10</span>
            <span className="font-mono">11</span>
            <span className="font-mono">12</span>
            <span className="font-mono">13</span>
            <span className="font-mono">14</span>
            <span className="font-mono">15</span>
            <span className="font-mono text-slate-500">16 ▲</span>
          </div>
        </div>

        {/* Word A4 Page Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
          <div
            className="bg-white shadow-2xl rounded-xs p-8 md:p-14 w-full max-w-3xl min-h-[1050px] border border-slate-300 transition-transform duration-200 flex flex-col justify-between"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              fontFamily: selectedFont,
              fontSize: `${fontSize}px`,
              textAlign: textAlign,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
            }}
          >
            {/* Standard Vietnamese School Header */}
            <div>
              <div className="flex justify-between items-start text-xs border-b border-slate-300 pb-4 mb-6 font-serif">
                <div className="text-left space-y-0.5">
                  <p className="font-bold uppercase tracking-tight text-slate-800">
                    PHÒNG GD&ĐT TP CÀ MAU
                  </p>
                  <p className="font-bold text-[#0866E8] uppercase tracking-wide">
                    TRƯỜNG TH PHƯỜNG AN XUYÊN
                  </p>
                  <p className="text-[11px] text-slate-500 italic">Lớp 1C • Năm học 2026 - 2027</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-bold uppercase tracking-tight text-slate-800">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="font-bold text-slate-700 underline underline-offset-4 text-[11px]">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center space-y-1.5 mb-6">
                <h1 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-slate-900 font-serif">
                  {isBangGoTat
                    ? 'BẢNG GÕ TẮT & PHÍM TẮT THÔNG DỤNG TRONG MICROSOFT WORD'
                    : file.name.replace(/\.[^/.]+$/, '').toUpperCase()}
                </h1>
                <p className="text-xs text-slate-600 italic font-serif">
                  Tài liệu giảng dạy & soạn bài của Thầy Từ Văn Gọn
                </p>
              </div>

              {/* If viewing Bang go tat with Interactive Shortcuts view */}
              {isBangGoTat && wordTab === 'shortcuts' ? (
                <div className="space-y-4">
                  {/* Category Filter Chips & Quick Search */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5 not-sr-only">
                    {/* Search */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={shortcutSearch}
                        onChange={(e) => setShortcutSearch(e.target.value)}
                        placeholder="Tìm nhanh phím tắt (ví dụ: Ctrl + S, In ấn, Cỡ chữ, UniKey, YouTube...)"
                        className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    {/* Filter categories */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-500 font-semibold mr-1">Nhóm:</span>
                      {[
                        { id: 'all', label: `Tất cả (${BANG_GO_TAT_SHORTCUTS.length})` },
                        { id: 'format', label: 'Định dạng chữ' },
                        { id: 'align', label: 'Căn lề đoạn văn' },
                        { id: 'file', label: 'Thao tác tệp & Lưu' },
                        { id: 'nav', label: 'Điều hướng' },
                        { id: 'unikey', label: 'UniKey & Mẹo' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setShortcutCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                            shortcutCategory === cat.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shortcuts Table in Word Style */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
                          <th className="p-3 w-48 border-r border-slate-200">Tổ hợp phím</th>
                          <th className="p-3">Chức năng & Tác dụng trong Word</th>
                          <th className="p-3 w-20 text-center">Sao chép</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {filteredShortcuts.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-6 text-center text-slate-400 italic">
                              Không tìm thấy phím tắt phù hợp với từ khóa "{shortcutSearch}".
                            </td>
                          </tr>
                        ) : (
                          filteredShortcuts.map((s, idx) => (
                            <tr
                              key={s.id}
                              className={`hover:bg-blue-50/50 transition-colors ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                              }`}
                            >
                              <td className="p-3 border-r border-slate-200 whitespace-nowrap">
                                <div className="flex flex-wrap items-center gap-1">
                                  {s.keys.map((k, ki) => (
                                    <React.Fragment key={ki}>
                                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded shadow-xs font-mono font-bold text-slate-800 text-[11px]">
                                        {k}
                                      </kbd>
                                      {ki < s.keys.length - 1 && (
                                        <span className="text-slate-400 text-xs font-bold">+</span>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 text-slate-800 leading-relaxed font-sans">
                                {s.desc}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleCopySingleShortcut(s.keys, s.desc, s.id)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                                  title="Sao chép dòng phím tắt này"
                                >
                                  {copiedKeyId === s.id ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Full Word Document Text Content */
                <div className="space-y-4 text-slate-800 leading-relaxed font-serif whitespace-pre-wrap">
                  {file.previewContent || (
                    <div>
                      <p className="font-bold text-base mb-2">BẢNG GÕ TẮT SOẠN THẢO VĂN BẢN</p>
                      {BANG_GO_TAT_SHORTCUTS.map((s) => (
                        <p key={s.id} className="py-0.5">
                          • <strong>{s.keys.join(' + ')}</strong>: {s.desc}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Document Footer (Chữ ký & Bản quyền) */}
            <div className="mt-12 pt-6 border-t border-slate-300 flex justify-between items-end text-xs font-serif text-slate-500">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-700">Kho dữ liệu cá nhân Thầy Từ Văn Gọn</p>
                <p className="text-[10px] text-slate-400">
                  Trường Tiểu học Phường An Xuyên • Cập nhật: {formatDate(file.updatedDate || file.uploadDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-800">Trang 1 / 1</p>
                <p className="text-[10px] text-slate-400 font-mono">Định dạng Microsoft Word (.doc)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Word Application Bottom Status Bar */}
        <div className="bg-[#f0f3f8] border-t border-slate-300 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-600 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">Trang 1 trên 1</span>
            <span>221 từ</span>
            <span className="hidden sm:inline">Tiếng Việt (Việt Nam)</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
              ✓ Đã lưu trên đám mây
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-slate-500">Bố trí in (Print Layout)</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="hover:text-blue-600 font-bold px-1"
              >
                -
              </button>
              <span className="font-mono font-semibold w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(180, zoomLevel + 10))}
                className="hover:text-blue-600 font-bold px-1"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOtherViewerContent = () => {
    const isVideo = file.category === 'video' || ['mp4', 'mov', 'webm'].includes(file.extension);

    if (isImage) {
      const activeSrc = imageError ? '/uploads/anh_the_thay_gon.jpg' : getImageSrc(file);
      return (
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-950">
          {/* Image Toolbar Sub-header */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-white shrink-0">
            {/* Gallery Scope selector & counter */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                <button
                  onClick={() => setGalleryScope('folder')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    galleryScope === 'folder'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Chỉ duyệt ảnh trong thư mục này"
                >
                  Thư mục: {file.folderName} ({folderImages.length})
                </button>
                <button
                  onClick={() => setGalleryScope('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    galleryScope === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Duyệt tất cả ảnh trên hệ thống"
                >
                  Tất cả ảnh ({allImages.length})
                </button>
              </div>

              {currentGalleryList.length > 1 && (
                <span className="bg-blue-900/60 text-blue-200 border border-blue-700/50 text-xs font-semibold px-2.5 py-1 rounded-md">
                  Ảnh {currentIndex >= 0 ? currentIndex + 1 : 1} / {currentGalleryList.length}
                </span>
              )}
            </div>

            {/* Image zoom & rotate actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel((z) => Math.max(40, z - 15))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Thu nhỏ (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-lg border border-slate-700 text-xs font-mono font-semibold transition-colors cursor-pointer"
                title="Đặt lại 100%"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(250, z + 15))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Phóng to (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
                title="Xoay ảnh 90 độ"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xoay {rotation > 0 ? `(${rotation}°)` : ''}</span>
              </button>

              <a
                href={activeSrc}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Mở ảnh gốc trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Main Image Stage with Left & Right arrows */}
          <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden select-none bg-slate-950">
            {/* Left Nav Button */}
            {hasPrev && (
              <button
                onClick={goToPrev}
                className="absolute left-4 z-20 w-12 h-12 rounded-full bg-black/70 hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer border border-white/20 backdrop-blur-xs group"
                title="Xem ảnh trước (Phím mũi tên Trái ←)"
              >
                <ChevronLeft className="w-7 h-7 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Displayed Image */}
            <div className="max-w-full max-h-full flex items-center justify-center overflow-hidden">
              <img
                src={activeSrc}
                alt={file.name}
                onError={() => {
                  if (!imageError) {
                    setImageError(true);
                  }
                }}
                className="max-h-[60vh] max-w-full rounded-xl shadow-2xl object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            </div>

            {/* Right Nav Button */}
            {hasNext && (
              <button
                onClick={goToNext}
                className="absolute right-4 z-20 w-12 h-12 rounded-full bg-black/70 hover:bg-blue-600 text-white flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer border border-white/20 backdrop-blur-xs group"
                title="Xem ảnh kế tiếp (Phím mũi tên Phải →)"
              >
                <ChevronRight className="w-7 h-7 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {currentGalleryList.length > 1 && (
            <div className="bg-slate-900/95 border-t border-slate-800 p-2.5 shrink-0 flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 mx-auto px-2">
                {currentGalleryList.map((item, idx) => {
                  const isCurrent = item.id === file.id;
                  const thumbUrl = getImageSrc(item);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSwitchFile(item)}
                      className={`group relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-blue-500 ring-2 ring-blue-400 scale-105 shadow-md shadow-blue-500/30'
                          : 'border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500'
                      }`}
                      title={`${item.name} (${formatBytes(item.size)})`}
                    >
                      <div className="w-14 h-14 bg-slate-800 flex items-center justify-center overflow-hidden">
                        <img
                          src={thumbUrl}
                          alt={item.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/uploads/anh_the_thay_gon.jpg';
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-black/75 px-1 py-0.5 text-[9px] text-white truncate text-center">
                        {idx + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex flex-col items-center justify-center p-6 bg-black rounded-lg flex-1">
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

    // PDF, Excel, PPT Preview
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full transition-all border border-slate-300 ${
          isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-5xl h-[94vh]'
        }`}
      >
        {/* Top Header Bar matching Microsoft Word 365 Deep Blue theme */}
        <div
          className={`${
            isWord ? 'bg-[#185abd]' : isImage ? 'bg-slate-900' : 'bg-[#0866E8]'
          } text-white px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 shadow-sm`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">
              {isWord ? (
                <span className="text-white font-serif text-sm">W</span>
              ) : isImage ? (
                <ImageIcon className="w-4 h-4 text-sky-300" />
              ) : file.category === 'pdf' ? (
                <FileCode className="w-4 h-4 text-red-200" />
              ) : file.category === 'excel' ? (
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              ) : file.category === 'powerpoint' ? (
                <Presentation className="w-4 h-4 text-amber-200" />
              ) : (
                <FileText className="w-4 h-4 text-white" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold truncate max-w-xs md:max-w-md">
                  {file.name}
                </h3>
                {isWord && (
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    Word DOC
                  </span>
                )}
                {isImage && (
                  <span className="bg-sky-500/30 text-sky-200 text-[10px] px-1.5 py-0.5 rounded font-mono uppercase">
                    {file.extension || 'JPG'}
                  </span>
                )}
                {onRename && (
                  <button
                    onClick={() => onRename(file)}
                    className="text-blue-100 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
                    title="Đổi tên tệp"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-blue-100/90 truncate">
                {formatBytes(file.size)} • Thư mục: {file.folderName} • Giáo viên: Thầy Từ Văn Gọn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Next/Prev file navigation in header */}
            {currentGalleryList.length > 1 && (
              <div className="flex items-center bg-black/25 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={goToPrev}
                  disabled={!hasPrev}
                  className={`p-1 rounded transition-colors ${
                    hasPrev ? 'hover:bg-white/20 text-white cursor-pointer' : 'text-white/30 cursor-not-allowed'
                  }`}
                  title="Tài liệu trước (Phím mũi tên Trái ←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono font-semibold px-1.5 text-white/90 select-none">
                  {currentIndex >= 0 ? currentIndex + 1 : 1}/{currentGalleryList.length}
                </span>
                <button
                  onClick={goToNext}
                  disabled={!hasNext}
                  className={`p-1 rounded transition-colors ${
                    hasNext ? 'hover:bg-white/20 text-white cursor-pointer' : 'text-white/30 cursor-not-allowed'
                  }`}
                  title="Tài liệu kế tiếp (Phím mũi tên Phải →)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {(isWord || file.category === 'pdf') && (
              <button
                onClick={handlePrint}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="In trang tài liệu này"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">In</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải tệp .doc gốc về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải về</span>
            </button>

            <button
              onClick={() => onShare(file)}
              className="bg-white/20 hover:bg-white/30 text-white font-semibold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chia sẻ</span>
            </button>

            {onOpenAIAnalyze && (
              <button
                onClick={() => onOpenAIAnalyze(file)}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Trợ lý AI</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors ml-1 cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        {isWord ? renderWordViewer() : renderOtherViewerContent()}
      </div>
    </div>
  );
};
