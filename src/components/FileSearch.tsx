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
} from 'lucide-react';
import { FileItem, FileCategory } from '../types';
import { formatBytes, formatDate } from '../services/api';

interface FileSearchProps {
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
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
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs md:text-sm font-bold text-slate-800">
              Tìm thấy <span className="text-blue-600 font-extrabold">{sortedFiles.length}</span> tài liệu
            </p>
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
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
                  <td colSpan={6} className="py-12 px-4 text-center">
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
                sortedFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-blue-50/50 transition-colors">
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
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDownloadFile(file)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                          title="Tải về"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onShareFile(file)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Chia sẻ"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteFile(file)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Xóa"
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
