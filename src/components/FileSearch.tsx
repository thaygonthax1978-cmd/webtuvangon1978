import React, { useState } from 'react';
import {
  Search,
  FileCode,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Video as VideoIcon,
  Folder,
  Download,
  Share2,
  Eye,
  Trash2,
  File,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsDown,
  UploadCloud,
  Edit2,
  FolderUp,
  AlertTriangle,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { FileItem, FileCategory } from '../types';
import { formatBytes, formatDate, api } from '../services/api';

interface FileSearchProps {
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
  onDeleteMultipleFiles?: (files: FileItem[], permanent?: boolean) => Promise<void>;
  onDeleteAllFiles?: (filesToDelete: FileItem[], permanent?: boolean) => Promise<void>;
  onRenameFile?: (file: FileItem) => void;
  onMoveToEnd?: (file: FileItem) => void;
  onOpenUpload?: () => void;
  onOpenUploadFolder?: () => void;
  currentFolderName?: string;
}

export const FileSearch: React.FC<FileSearchProps> = ({
  files,
  onOpenFile,
  onDownloadFile,
  onShareFile,
  onDeleteFile,
  onDeleteMultipleFiles,
  onDeleteAllFiles,
  onRenameFile,
  onMoveToEnd,
  onOpenUpload,
  onOpenUploadFolder,
  currentFolderName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date' | 'category'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Multi-selection state
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Modal confirm state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    mode: 'all' | 'selected';
    filesToDelete: FileItem[];
    permanent: boolean;
    isDeleting: boolean;
  }>({
    isOpen: false,
    mode: 'all',
    filesToDelete: [],
    permanent: false,
    isDeleting: false,
  });

  const categories = [
    { id: 'all', label: 'Tất cả', icon: File },
    { id: 'pdf', label: 'PDF', icon: FileCode, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'word', label: 'Word', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'powerpoint', label: 'PowerPoint', icon: Presentation, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'image', label: 'Hình ảnh', icon: ImageIcon, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'video', label: 'Video', icon: VideoIcon, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  ];

  // Filtering
  const filteredFiles = files.filter((f) => {
    if (f.isDeleted) return false;
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      (f.folderName && f.folderName.toLowerCase().includes(q)) ||
      (f.previewContent && f.previewContent.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Natural sorting: Tuần 1 -> Tuần 35 (Tuần 35 nằm ở cuối cùng)
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'name') {
      diff = a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' });
    } else if (sortBy === 'size') {
      diff = (a.size || 0) - (b.size || 0);
    } else if (sortBy === 'date') {
      diff = new Date(a.uploadDate || a.updatedDate).getTime() - new Date(b.uploadDate || b.updatedDate).getTime();
    } else if (sortBy === 'category') {
      diff = (a.category || '').localeCompare(b.category || '', 'vi');
    }
    return sortAsc ? diff : -diff;
  });

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedFileIds.length === sortedFiles.length && sortedFiles.length > 0) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(sortedFiles.map((f) => f.id));
    }
  };

  const handleToggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleClearSelection = () => {
    setSelectedFileIds([]);
  };

  // Open Delete Confirmation
  const handlePromptDeleteAll = () => {
    if (sortedFiles.length === 0) return;
    setDeleteModal({
      isOpen: true,
      mode: 'all',
      filesToDelete: sortedFiles,
      permanent: false,
      isDeleting: false,
    });
  };

  const handlePromptDeleteSelected = () => {
    const selectedFiles = sortedFiles.filter((f) => selectedFileIds.includes(f.id));
    if (selectedFiles.length === 0) return;
    setDeleteModal({
      isOpen: true,
      mode: 'selected',
      filesToDelete: selectedFiles,
      permanent: false,
      isDeleting: false,
    });
  };

  const handleExecuteDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      if (deleteModal.mode === 'all') {
        if (onDeleteAllFiles) {
          await onDeleteAllFiles(deleteModal.filesToDelete, deleteModal.permanent);
        } else if (onDeleteMultipleFiles) {
          await onDeleteMultipleFiles(deleteModal.filesToDelete, deleteModal.permanent);
        } else {
          await api.batchDeleteFiles({
            ids: deleteModal.filesToDelete.map((f) => f.id),
            permanent: deleteModal.permanent,
          });
        }
      } else {
        if (onDeleteMultipleFiles) {
          await onDeleteMultipleFiles(deleteModal.filesToDelete, deleteModal.permanent);
        } else {
          await api.batchDeleteFiles({
            ids: deleteModal.filesToDelete.map((f) => f.id),
            permanent: deleteModal.permanent,
          });
        }
      }
      setSelectedFileIds([]);
      setDeleteModal({ isOpen: false, mode: 'all', filesToDelete: [], permanent: false, isDeleting: false });
    } catch (err) {
      console.error('Lỗi khi xóa tệp:', err);
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

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
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">Khác</span>;
    }
  };

  const isAllSelected = sortedFiles.length > 0 && selectedFileIds.length === sortedFiles.length;
  const isPartiallySelected = selectedFileIds.length > 0 && selectedFileIds.length < sortedFiles.length;

  return (
    <div className="space-y-5">
      {/* Search Header Bar matching Mockup #6 */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên tài liệu, nội dung, bài giảng (ví dụ: giáo án Toán lớp 1, Thông tư 27)..."
              className="w-full pl-11 pr-4 py-2.5 text-xs md:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>
          <button
            onClick={() => {}}
            className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs md:text-sm px-6 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Tìm kiếm</span>
          </button>
        </div>

        {/* Filter Chips matching mockup #6 */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0866E8] text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Meta & Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-xs md:text-sm font-bold text-slate-800">
              {currentFolderName ? (
                <span>
                  Thư mục <span className="text-blue-700 font-extrabold font-mono">"{currentFolderName}"</span>: có{' '}
                  <span className="text-blue-600 font-extrabold">{sortedFiles.length}</span> tài liệu
                </span>
              ) : (
                <span>
                  Tìm thấy <span className="text-blue-600 font-extrabold">{sortedFiles.length}</span> tài liệu
                </span>
              )}
            </p>

            {/* NÚT XÓA TẤT CẢ FILE - Nổi bật ngay cạnh Tải tệp, Tải thư mục */}
            {sortedFiles.length > 0 && (
              <button
                onClick={handlePromptDeleteAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Bấm để xóa tất cả tài liệu trong danh sách này"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa tất cả file</span>
              </button>
            )}

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                title="Tải tệp lên"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Tải tệp</span>
              </button>
            )}
            {onOpenUploadFolder && (
              <button
                onClick={onOpenUploadFolder}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                title="Tải thư mục lên"
              >
                <FolderUp className="w-3.5 h-3.5" />
                <span>Tải thư mục</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              Sắp xếp:
            </span>
            <select
              value={`${sortBy}-${sortAsc ? 'asc' : 'desc'}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortAsc(so === 'asc');
              }}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="name-asc">Tên: Tuần 1 → Tuần 35 (TV TUẦN 35 ở cuối cùng)</option>
              <option value="name-desc">Tên: Tuần 35 → Tuần 1 (Đảo ngược)</option>
              <option value="date-asc">Ngày tải lên: Cũ nhất trước</option>
              <option value="date-desc">Ngày tải lên: Mới nhất trước</option>
              <option value="size-asc">Dung lượng: Nhỏ đến lớn</option>
              <option value="size-desc">Dung lượng: Lớn đến nhỏ</option>
            </select>
          </div>
        </div>

        {/* Thanh tác vụ khi chọn nhiều tệp (Bulk Action Bar) */}
        {selectedFileIds.length > 0 && (
          <div className="mx-4 mt-3 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-blue-950">
                Đã chọn <span className="text-blue-700 font-extrabold">{selectedFileIds.length}</span> / {sortedFiles.length} tài liệu
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn toàn bộ'}
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={() => {
                  const targets = sortedFiles.filter((f) => selectedFileIds.includes(f.id));
                  targets.forEach((file, idx) => {
                    setTimeout(() => {
                      const link = document.createElement('a');
                      link.href = api.getDownloadUrl(file.id);
                      link.setAttribute('download', file.name);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }, idx * 250);
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer active:scale-95"
                title={`Tải xuống ${selectedFileIds.length} tệp đã chọn về máy tính`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải xuống {selectedFileIds.length} tệp</span>
              </button>
              <button
                type="button"
                onClick={handlePromptDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa {selectedFileIds.length} file</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                {/* Checkbox chọn tất cả */}
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả tài liệu"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = isPartiallySelected;
                      }
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                  />
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'name') setSortAsc(!sortAsc);
                    else {
                      setSortBy('name');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                  title="Bấm để sắp xếp theo tên tài liệu"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tên tài liệu</span>
                    {sortBy === 'name' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'category') setSortAsc(!sortAsc);
                    else {
                      setSortBy('category');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                  title="Bấm để sắp xếp theo loại tệp"
                >
                  <div className="flex items-center gap-1">
                    <span>Loại</span>
                    {sortBy === 'category' &&
                      (sortAsc ? (
                        <ArrowUp className="w-3 h-3 text-blue-600" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-blue-600" />
                      ))}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'size') setSortAsc(!sortAsc);
                    else {
                      setSortBy('size');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                  title="Bấm để sắp xếp theo dung lượng"
                >
                  <div className="flex items-center gap-1">
                    <span>Dung lượng</span>
                    {sortBy === 'size' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'date') setSortAsc(!sortAsc);
                    else {
                      setSortBy('date');
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 select-none transition-colors"
                  title="Bấm để sắp xếp theo ngày tải lên"
                >
                  <div className="flex items-center gap-1">
                    <span>Ngày tải lên</span>
                    {sortBy === 'date' ? (
                      sortAsc ? (
                        <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-3">Thư mục</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    {searchTerm.trim() || selectedCategory !== 'all' ? (
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-slate-500 text-sm mb-2">
                          Không tìm thấy tài liệu nào khớp với từ khóa "{searchTerm}".
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('all');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                        >
                          Xóa bộ lọc để xem tất cả
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center max-w-md mx-auto py-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm md:text-base font-bold text-slate-800 mb-1">
                          {currentFolderName ? `Thư mục "${currentFolderName}" chưa có tài liệu` : 'Chưa có tài liệu nào'}
                        </h4>
                        <p className="text-xs text-slate-500 mb-4 max-w-sm leading-relaxed">
                          Thầy có thể bấm nút bên dưới để tải giáo án, bài giảng Word, PowerPoint, PDF hoặc hình ảnh vào thư mục này ngay.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          {onOpenUpload && (
                            <button
                              onClick={onOpenUpload}
                              className="px-4 py-2.5 bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                              title="Tải một hoặc nhiều tệp vào thư mục này"
                            >
                              <UploadCloud className="w-4 h-4" />
                              <span>Tải tệp lên thư mục này</span>
                            </button>
                          )}
                          {onOpenUploadFolder && (
                            <button
                              onClick={onOpenUploadFolder}
                              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                              title="Tải cả thư mục từ máy tính vào thư mục này"
                            >
                              <FolderUp className="w-4 h-4" />
                              <span>Tải thư mục lên</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                sortedFiles.map((file) => {
                  const isChecked = selectedFileIds.includes(file.id);

                  return (
                    <tr
                      key={file.id}
                      className={`transition-colors ${
                        isChecked ? 'bg-blue-50/70 hover:bg-blue-100/60' : 'hover:bg-blue-50/40'
                      }`}
                    >
                      {/* Checkbox hàng */}
                      <td className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          aria-label={`Chọn ${file.name}`}
                          checked={isChecked}
                          onChange={() => handleToggleSelectFile(file.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <File className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 group">
                              <p
                                onClick={() => onOpenFile(file)}
                                className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate max-w-xs md:max-w-md"
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
                          {onMoveToEnd && (
                            <button
                              onClick={() => onMoveToEnd(file)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Đưa tệp này xuống cuối danh sách"
                            >
                              <ChevronsDown className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenFile(file)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Xem trước"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDownloadFile(file)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                            title="Tải về"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onShareFile(file)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Chia sẻ"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteFile(file)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Xóa tệp này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XÁC NHẬN XÓA TẤT CẢ FILE HOẶC CÁC FILE ĐÃ CHỌN */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {deleteModal.mode === 'all'
                    ? 'Xác nhận xóa tất cả tài liệu'
                    : `Xác nhận xóa ${deleteModal.filesToDelete.length} tài liệu đã chọn`}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {deleteModal.mode === 'all'
                    ? `Thầy đang chọn xóa toàn bộ ${deleteModal.filesToDelete.length} tài liệu ${
                        currentFolderName ? `trong thư mục "${currentFolderName}"` : 'đang hiển thị'
                      }.`
                    : `Thầy đang chọn xóa ${deleteModal.filesToDelete.length} tài liệu đã chọn khỏi danh sách.`}
                </p>
              </div>
            </div>

            {/* Chọn phương thức xóa: Thùng rác vs Vĩnh viễn */}
            <div className="space-y-2.5 my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-800">Phương thức xóa:</p>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                <input
                  type="radio"
                  name="deleteType"
                  checked={!deleteModal.permanent}
                  onChange={() => setDeleteModal((prev) => ({ ...prev, permanent: false }))}
                  className="mt-0.5 accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Chuyển vào thùng rác <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">Khuyên dùng</span>
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Tài liệu được chuyển vào Thùng rác và Thầy có thể xem hoặc khôi phục lại bất kỳ lúc nào.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                <input
                  type="radio"
                  name="deleteType"
                  checked={deleteModal.permanent}
                  onChange={() => setDeleteModal((prev) => ({ ...prev, permanent: true }))}
                  className="mt-0.5 accent-rose-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-rose-700 block">
                    Xóa vĩnh viễn khỏi hệ thống
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Xóa hoàn toàn tệp tin vật lý khỏi máy chủ lưu trữ, không thể khôi phục lại.
                  </span>
                </div>
              </label>
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={() => setDeleteModal({ isOpen: false, mode: 'all', filesToDelete: [], permanent: false, isDeleting: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteModal.isDeleting}
                onClick={handleExecuteDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteModal.isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {deleteModal.mode === 'all'
                        ? `Xác nhận xóa tất cả (${deleteModal.filesToDelete.length})`
                        : `Xác nhận xóa (${deleteModal.filesToDelete.length} tệp)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
