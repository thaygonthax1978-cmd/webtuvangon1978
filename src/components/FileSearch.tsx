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
} from 'lucide-react';
import { FileItem, FileCategory } from '../types';
import { formatBytes, formatDate } from '../services/api';

interface FileSearchProps {
  files: FileItem[];
  onOpenFile: (file: FileItem) => void;
  onDownloadFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem) => void;
}

export const FileSearch: React.FC<FileSearchProps> = ({
  files,
  onOpenFile,
  onDownloadFile,
  onShareFile,
  onDeleteFile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-xs md:text-sm font-bold text-slate-800">
            Tìm thấy <span className="text-blue-600 font-extrabold">{filteredFiles.length}</span> kết quả
          </p>

          <span className="text-xs text-slate-400">
            Hiển thị tối ưu theo độ liên quan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
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
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy tài liệu nào khớp với từ khóa "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                          <File className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p
                            onClick={() => onOpenFile(file)}
                            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer truncate max-w-xs md:max-w-md"
                          >
                            {file.name}
                          </p>
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
