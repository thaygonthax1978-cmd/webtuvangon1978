import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  UploadCloud,
  Search,
  MoreVertical,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  Calendar,
  HardDrive,
  FileText,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  ArrowLeft,
  Layers,
  FolderUp,
} from 'lucide-react';
import { FolderItem } from '../types';
import { formatBytes, formatDate, buildFolderTreeOptions } from '../services/api';

interface FolderManagerProps {
  folders: FolderItem[];
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, color?: string, parentId?: string | null) => Promise<void>;
  onRenameFolder: (folderId: string, newName: string, color?: string, parentId?: string | null) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onOpenUpload: (targetFolderId?: string) => void;
  onOpenUploadFolder?: (targetFolderId?: string) => void;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onOpenUpload,
  onOpenUploadFolder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [drillFolderId, setDrillFolderId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'root' | 'tree' | 'sub'>('root');
  const [expandedFolderIds, setExpandedFolderIds] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'files' | 'date'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#0866E8');

  const [renameTarget, setRenameTarget] = useState<FolderItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameColor, setRenameColor] = useState('#0866E8');
  const [renameParentId, setRenameParentId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Folder colors
  const colorOptions = ['#0866E8', '#16B875', '#8257E5', '#FF9F1C', '#F04444', '#064AA8', '#38BDF8', '#64748B'];

  // Root vs Subfolder separation
  const rootFolders = folders.filter((f) => !f.parentId);
  const subFolders = folders.filter((f) => Boolean(f.parentId));

  const drillFolder = drillFolderId ? folders.find((f) => f.id === drillFolderId) : null;
  const childrenOfDrill = drillFolderId ? folders.filter((f) => f.parentId === drillFolderId) : [];

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Build items to display:
  type DisplayFolderItem = FolderItem & {
    isSubfolder: boolean;
    parentName?: string;
    subfolderCount?: number;
    subfolderNames?: string[];
  };

  let displayFolders: DisplayFolderItem[] = [];

  if (drillFolderId) {
    // INSIDE A FOLDER (Drill-down): Only show subfolders of this parent
    displayFolders = childrenOfDrill.map((child) => ({
      ...child,
      isSubfolder: true,
      parentName: drillFolder?.name,
    }));
  } else if (filterLevel === 'root') {
    // ROOT / OUTSIDE LEVEL (DEFAULT): ONLY ROOT FOLDERS SHOWN!
    // Subfolders like '01. TIẾNG VIỆT 1' are hidden ("khuất ở trong") inside '03. GIÁO ÁN'!
    displayFolders = rootFolders.map((root) => {
      const children = folders.filter((f) => f.parentId === root.id);
      return {
        ...root,
        isSubfolder: false,
        subfolderCount: children.length,
        subfolderNames: children.map((c) => c.name),
      };
    });
  } else if (filterLevel === 'sub') {
    // ONLY SUBFOLDERS
    displayFolders = subFolders.map((sub) => ({
      ...sub,
      isSubfolder: true,
      parentName: folders.find((p) => p.id === sub.parentId)?.name,
    }));
  } else if (filterLevel === 'tree') {
    // TREE VIEW: Root folders, and when expanded, their subfolders right below
    rootFolders.forEach((root) => {
      const children = folders.filter((f) => f.parentId === root.id);
      displayFolders.push({
        ...root,
        isSubfolder: false,
        subfolderCount: children.length,
        subfolderNames: children.map((c) => c.name),
      });
      if (expandedFolderIds[root.id]) {
        children.forEach((child) => {
          displayFolders.push({
            ...child,
            isSubfolder: true,
            parentName: root.name,
          });
        });
      }
    });
  }

  // Filter by search
  const filteredFolders = displayFolders.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort folders
  const sortedFolders = [...filteredFolders].sort((a, b) => {
    // Keep parent-child tree order in tree mode without search
    if (filterLevel === 'tree' && !searchTerm) return 0;

    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, 'vi');
    } else if (sortBy === 'files') {
      comparison = (a.fileCount || 0) - (b.fileCount || 0);
    } else if (sortBy === 'size') {
      comparison = (a.totalSize || 0) - (b.totalSize || 0);
    } else if (sortBy === 'date') {
      comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortAsc ? comparison : -comparison;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim(), selectedColor, selectedParentId);
    setNewFolderName('');
    setSelectedParentId(null);
    setIsCreateModalOpen(false);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    await onRenameFolder(renameTarget.id, renameValue.trim(), renameColor, renameParentId);
    setRenameTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await onDeleteFolder(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Top action bar matching mockup */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Thư mục của tôi</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {folders.length} thư mục
            </span>
          </h2>
          <p className="text-xs text-slate-500">Hệ thống thư mục tài liệu giảng dạy và hồ sơ cá nhân</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            + Tạo thư mục
          </button>

          <button
            onClick={() => onOpenUpload()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Tải một hoặc nhiều tệp lên"
          >
            <UploadCloud className="w-4 h-4" />
            Tải lên tệp
          </button>

          <button
            onClick={() => onOpenUploadFolder ? onOpenUploadFolder() : onOpenUpload(undefined)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Tải cả thư mục từ máy tính lên"
          >
            <FolderUp className="w-4 h-4" />
            Tải thư mục lên
          </button>

          <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem danh sách"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Xem lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Sort Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm thư mục..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="text-slate-400">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="name">Theo tên thư mục</option>
            <option value="files">Theo số lượng tệp</option>
            <option value="size">Theo dung lượng</option>
            <option value="date">Theo ngày sửa đổi</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600"
            title="Đảo chiều sắp xếp"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Folders Display: List or Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Tên thư mục</th>
                  <th className="py-3 px-4 text-center">Số tệp</th>
                  <th className="py-3 px-4 text-center">Dung lượng</th>
                  <th className="py-3 px-4 text-center">Ngày sửa đổi</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedFolders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không tìm thấy thư mục nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  sortedFolders.map((folder, index) => (
                    <tr
                      key={folder.id}
                      className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-medium">
                        {index + 1}
                      </td>
                      <td
                        onClick={() => onSelectFolder(folder.id)}
                        className="py-3 px-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                            style={{
                              backgroundColor: `${folder.color || '#0866E8'}15`,
                              color: folder.color || '#0866E8',
                            }}
                          >
                            <Folder className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {folder.isSubfolder && (
                                <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  ↳ Con của: {folder.parentName}
                                </span>
                              )}
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {folder.name}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400">Mã: {folder.code}</span>
                          </div>
                        </div>
                      </td>
                      <td
                        onClick={() => onSelectFolder(folder.id)}
                        className="py-3 px-4 text-center font-semibold text-slate-700"
                      >
                        {folder.fileCount ?? 0}
                      </td>
                      <td
                        onClick={() => onSelectFolder(folder.id)}
                        className="py-3 px-4 text-center font-medium text-slate-600"
                      >
                        {formatBytes(folder.totalSize || 0)}
                      </td>
                      <td
                        onClick={() => onSelectFolder(folder.id)}
                        className="py-3 px-4 text-center text-slate-500"
                      >
                        {formatDate(folder.updatedAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1 relative">
                          <button
                            onClick={() => onSelectFolder(folder.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Mở thư mục"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedParentId(folder.id);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title={`Tạo thư mục con trong ${folder.name}`}
                          >
                            <FolderPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setRenameTarget(folder);
                              setRenameValue(folder.name);
                              setRenameColor(folder.color || '#0866E8');
                              setRenameParentId(folder.parentId || null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Đổi tên / Chuyển vị trí"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(folder)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Xóa thư mục"
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedFolders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
            >
              <div
                onClick={() => onSelectFolder(folder.id)}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: `${folder.color || '#0866E8'}15`,
                      color: folder.color || '#0866E8',
                    }}
                  >
                    <Folder className="w-6 h-6 fill-current" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {folder.fileCount ?? 0} tệp
                    </span>
                    {folder.isSubfolder && (
                      <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        Thư mục con
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm mb-0.5 truncate">
                  {folder.name}
                </h3>
                {folder.isSubfolder && folder.parentName && (
                  <p className="text-[11px] text-purple-700 font-semibold mb-1 truncate flex items-center gap-1">
                    <span>↳</span>
                    <span>Con của: {folder.parentName}</span>
                  </p>
                )}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                  <span>Dung lượng: {formatBytes(folder.totalSize || 0)}</span>
                  <span>{formatDate(folder.updatedAt)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => onOpenUpload(folder.id)}
                  className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Tải vào đây
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedParentId(folder.id);
                      setIsCreateModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                    title={`Tạo thư mục con trong ${folder.name}`}
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setRenameTarget(folder);
                      setRenameValue(folder.name);
                      setRenameColor(folder.color || '#0866E8');
                      setRenameParentId(folder.parentId || null);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-600 rounded"
                    title="Đổi tên / Chuyển vị trí"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(folder)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Xóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tạo thư mục mới / Thư mục con */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setSelectedParentId(null);
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `${selectedColor}20`,
                  color: selectedColor,
                }}
              >
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedParentId
                    ? `Tạo thư mục con trong ${folders.find((f) => f.id === selectedParentId)?.name || 'thư mục'}`
                    : 'Tạo thư mục mới'}
                </h3>
                <p className="text-xs text-slate-500">Phân loại tài liệu giảng dạy khoa học</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Parent folder selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vị trí lưu thư mục:
                </label>
                <select
                  value={selectedParentId || 'root'}
                  onChange={(e) => setSelectedParentId(e.target.value === 'root' ? null : e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="root">📁 Thư mục gốc (Cấp cao nhất ngoài màn hình chính)</option>
                  {buildFolderTreeOptions(folders).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.depth === 0 ? `📂 ${opt.name}` : opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên thư mục *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ví dụ: Tuần 1 - 4 hoặc Môn Toán lớp 1..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  autoFocus
                />
              </div>

              {/* Quick suggestions chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  Gợi ý tên nhanh (bấm để điền):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Tuần 1 - 4',
                    'Tuần 5 - 8',
                    'Tuần 9 - 12',
                    'Môn Toán lớp 1',
                    'Môn Tiếng Việt lớp 1',
                    'Học kỳ I',
                    'Học kỳ II',
                    'Giáo án STEM',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewFolderName(tag)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium border border-blue-200 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Màu sắc nhận diện
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        selectedColor === c ? 'scale-125 border-slate-900 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setSelectedParentId(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Tạo thư mục</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi tên / Chuyển vị trí thư mục */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setRenameTarget(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `${renameColor}20`,
                  color: renameColor,
                }}
              >
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Chỉnh sửa thư mục</h3>
                <p className="text-xs text-slate-500">
                  Đổi tên, đổi màu hoặc chuyển vị trí thư mục <span className="font-semibold text-slate-800">"{renameTarget.name}"</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vị trí lưu (Thư mục cha):
                </label>
                <select
                  value={renameParentId || 'root'}
                  onChange={(e) => setRenameParentId(e.target.value === 'root' ? null : e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="root">📁 Thư mục gốc (Cấp cao nhất)</option>
                  {buildFolderTreeOptions(folders)
                    .filter((opt) => opt.id !== renameTarget.id)
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.depth === 0 ? `📂 ${opt.name}` : opt.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên thư mục *
                </label>
                <input
                  type="text"
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Màu sắc nhận diện
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRenameColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        renameColor === c ? 'scale-125 border-slate-900 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa thư mục */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận xóa thư mục</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Thư mục <span className="font-bold text-slate-900">"{deleteTarget.name}"</span> đang chứa{' '}
                  <span className="font-semibold text-blue-600">{deleteTarget.fileCount || 0} tệp</span>.
                  Tất cả các tệp bên trong sẽ được chuyển an toàn vào{' '}
                  <span className="font-semibold text-rose-600">Thùng rác</span> để Thầy Gọn có thể khôi phục khi cần.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Không xóa
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
