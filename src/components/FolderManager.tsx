import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  UploadCloud,
  Search,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Eye,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
  FolderUp,
  AlertTriangle,
  FolderTree,
  RotateCcw,
  Layers,
  ArrowLeft,
  FileText,
  Loader2,
} from 'lucide-react';
import { FolderItem } from '../types';
import { formatBytes, formatDate, buildFolderTreeOptions, api } from '../services/api';

interface FolderManagerProps {
  folders: FolderItem[];
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, color?: string, parentId?: string | null) => Promise<void>;
  onRenameFolder: (folderId: string, newName: string, color?: string, parentId?: string | null) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onBatchDeleteFolders?: (folderIds: string[], deleteFiles?: boolean) => Promise<void>;
  onDeleteAllFolders?: (deleteFiles?: boolean) => Promise<void>;
  onOpenUpload: (targetFolderId?: string) => void;
  onOpenUploadFolder?: (targetFolderId?: string) => void;
  onRefreshData?: () => void;
}

export const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onBatchDeleteFolders,
  onDeleteAllFolders,
  onOpenUpload,
  onOpenUploadFolder,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [drillFolderId, setDrillFolderId] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<'tree' | 'all' | 'root'>('root');
  // Subfolders stay hidden inside their parent folder by default
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
  const [isRestoring, setIsRestoring] = useState(false);

  // Multi-select & Batch/Delete All State
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [deleteAllModal, setDeleteAllModal] = useState<{
    isOpen: boolean;
    mode: 'all' | 'selected';
    targetFolders: FolderItem[];
    deleteFiles: boolean;
    isDeleting: boolean;
  }>({
    isOpen: false,
    mode: 'all',
    targetFolders: [],
    deleteFiles: true,
    isDeleting: false,
  });

  // Color options
  const colorOptions = ['#0866E8', '#16B875', '#8257E5', '#FF9F1C', '#F04444', '#064AA8', '#38BDF8', '#64748B'];

  // Root vs Subfolder separation
  const rootFolders = folders.filter((f) => !f.parentId);
  const subFolders = folders.filter((f) => Boolean(f.parentId));

  const drillFolder = drillFolderId ? folders.find((f) => f.id === drillFolderId) : null;
  const childrenOfDrill = drillFolderId ? folders.filter((f) => f.parentId === drillFolderId) : [];

  // Build breadcrumb trail for drillFolderId
  const drillBreadcrumbs: FolderItem[] = [];
  if (drillFolderId) {
    let curr = drillFolder;
    while (curr) {
      drillBreadcrumbs.unshift(curr);
      curr = curr.parentId ? folders.find((f) => f.id === curr?.parentId) : undefined;
    }
  }

  const toggleFolderExpand = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedFolderIds((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Build items to display:
  // Subfolders stay hidden inside their parent folder (e.g. ẢNH CẢ NHÀ & ẢNH DU LỊCH inside 11. HÌNH ẢNH)
  type DisplayFolderItem = FolderItem & {
    isSubfolder: boolean;
    levelDepth: number;
    hasChildren: boolean;
    childrenCount: number;
  };

  let displayFolders: DisplayFolderItem[] = [];

  if (drillFolderId) {
    // Inside a folder: display only its subfolders (e.g. ẢNH CẢ NHÀ, ẢNH DU LỊCH inside 11. HÌNH ẢNH)
    displayFolders = childrenOfDrill.map((child) => {
      const grandChildren = folders.filter((f) => f.parentId === child.id);
      return {
        ...child,
        isSubfolder: true,
        levelDepth: 0,
        hasChildren: grandChildren.length > 0,
        childrenCount: grandChildren.length,
      };
    });
  } else {
    // Top-level / Thư mục chính: ALWAYS only display the 11 root folders!
    // Subfolders stay hidden inside and do NOT appear outside.
    displayFolders = rootFolders.map((root) => {
      const children = folders.filter((f) => f.parentId === root.id);
      return {
        ...root,
        isSubfolder: false,
        levelDepth: 0,
        hasChildren: children.length > 0,
        childrenCount: children.length,
      };
    });
  }

  // Filter by search
  const filteredFolders = displayFolders.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort folders (only if not tree view or if searching)
  const sortedFolders = filterLevel === 'tree' && !searchTerm
    ? filteredFolders
    : [...filteredFolders].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name, 'vi', { numeric: true });
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

  const handleToggleSelectAll = () => {
    if (selectedFolderIds.length === sortedFolders.length && sortedFolders.length > 0) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(sortedFolders.map((f) => f.id));
    }
  };

  const handleToggleSelectFolder = (id: string) => {
    setSelectedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenDeleteAllModal = () => {
    if (folders.length === 0) return;
    setDeleteAllModal({
      isOpen: true,
      mode: 'all',
      targetFolders: sortedFolders,
      deleteFiles: true,
      isDeleting: false,
    });
  };

  const handleOpenDeleteSelectedModal = () => {
    const targets = sortedFolders.filter((f) => selectedFolderIds.includes(f.id));
    if (targets.length === 0) return;
    setDeleteAllModal({
      isOpen: true,
      mode: 'selected',
      targetFolders: targets,
      deleteFiles: true,
      isDeleting: false,
    });
  };

  const handleExecuteBatchDelete = async () => {
    setDeleteAllModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      if (deleteAllModal.mode === 'all') {
        if (onDeleteAllFolders) {
          await onDeleteAllFolders(deleteAllModal.deleteFiles);
        } else if (onBatchDeleteFolders) {
          await onBatchDeleteFolders(folders.map((f) => f.id), deleteAllModal.deleteFiles);
        }
      } else {
        const ids = deleteAllModal.targetFolders.map((f) => f.id);
        if (onBatchDeleteFolders) {
          await onBatchDeleteFolders(ids, deleteAllModal.deleteFiles);
        }
      }
      setSelectedFolderIds([]);
      setDeleteAllModal({
        isOpen: false,
        mode: 'all',
        targetFolders: [],
        deleteFiles: true,
        isDeleting: false,
      });
    } catch (err) {
      console.error('Lỗi khi xóa thư mục:', err);
      setDeleteAllModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleRestoreDefaults = async () => {
    try {
      setIsRestoring(true);
      await api.restoreDatabase();
      if (onRefreshData) onRefreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top action bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          {/* Breadcrumb if drilled down */}
          {drillFolderId && drillBreadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mb-2 flex-wrap">
              <button
                onClick={() => setDrillFolderId(null)}
                className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1 text-blue-600"
              >
                <span>📁 Thư mục của tôi</span>
              </button>
              {drillBreadcrumbs.map((b, idx) => (
                <React.Fragment key={b.id}>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button
                    onClick={() => setDrillFolderId(b.id)}
                    className={`hover:text-blue-600 transition-colors cursor-pointer ${
                      idx === drillBreadcrumbs.length - 1 ? 'font-bold text-slate-900 bg-blue-50 px-2 py-0.5 rounded' : ''
                    }`}
                  >
                    {b.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}

          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>
              {drillFolder ? `Thư mục trong "${drillFolder.name}"` : 'Thư mục của tôi'}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              {drillFolder ? `${childrenOfDrill.length} thư mục` : `${rootFolders.length} thư mục chính`}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {drillFolder
              ? `Đang xem các thư mục bên trong ${drillFolder.name}`
              : 'Hệ thống 11 thư mục giáo án, hồ sơ chuyên môn và tài liệu giảng dạy của Thầy Từ Văn Gọn'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {drillFolderId && (
            <button
              onClick={() => {
                if (drillFolder?.parentId) {
                  setDrillFolderId(drillFolder.parentId);
                } else {
                  setDrillFolderId(null);
                }
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cấp trước</span>
            </button>
          )}

          <button
            onClick={() => {
              setSelectedParentId(drillFolderId);
              setIsCreateModalOpen(true);
            }}
            className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{drillFolderId ? '+ Tạo thư mục con' : '+ Tạo thư mục'}</span>
          </button>

          <button
            onClick={() => onOpenUpload(drillFolderId || undefined)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Tải một hoặc nhiều tệp lên"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Tải tệp lên</span>
          </button>

          {onOpenUploadFolder && (
            <button
              onClick={() => onOpenUploadFolder(drillFolderId || undefined)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tải cả thư mục từ máy tính lên"
            >
              <FolderUp className="w-4 h-4" />
              <span>Tải thư mục lên</span>
            </button>
          )}

          <button
            onClick={handleRestoreDefaults}
            disabled={isRestoring}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            title="Khôi phục hoặc cập nhật lại cấu trúc 11 thư mục giáo án"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          {/* Nút XÓA TẤT CẢ THƯ MỤC - Nổi bật màu đỏ */}
          {folders.length > 0 && (
            <button
              type="button"
              onClick={handleOpenDeleteAllModal}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Bấm để xóa tất cả thư mục trong hệ thống"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tất cả thư mục</span>
            </button>
          )}

          {/* List/Grid View Toggle */}
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
              title="Xem dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Mode Selector & Search / Sort Bar */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* View Indicator & Action */}
        <div className="flex flex-wrap items-center gap-2">
          {drillFolder ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-600" />
                <span>Thư mục bên trong {drillFolder.name} ({childrenOfDrill.length})</span>
              </span>
              <button
                onClick={() => setDrillFolderId(null)}
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                ← Quay lại
              </button>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-600" />
              <span>Hệ thống 11 thư mục chính của Thầy Gọn</span>
            </span>
          )}

          {folders.length > 0 && (
            <button
              type="button"
              onClick={handleOpenDeleteAllModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 hover:border-rose-300 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Bấm để xóa tất cả thư mục"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa tất cả thư mục</span>
            </button>
          )}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[280px] justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm thư mục..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="name">Theo tên thư mục</option>
              <option value="files">Theo số tệp</option>
              <option value="size">Theo dung lượng</option>
              <option value="date">Theo ngày sửa đổi</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600"
              title="Đảo chiều sắp xếp"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Thanh công cụ khi đã tích chọn thư mục */}
      {selectedFolderIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <span className="font-bold text-rose-900">
              Đã chọn {selectedFolderIds.length} / {sortedFolders.length} thư mục
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFolderIds([])}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-rose-100/60 transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={handleOpenDeleteSelectedModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {selectedFolderIds.length} thư mục đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Folders Display: List or Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả thư mục"
                      checked={sortedFolders.length > 0 && selectedFolderIds.length === sortedFolders.length}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate = selectedFolderIds.length > 0 && selectedFolderIds.length < sortedFolders.length;
                        }
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                    />
                  </th>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Tên thư mục</th>
                  <th className="py-3 px-4 text-center">Tổng số tệp</th>
                  <th className="py-3 px-4 text-center">Dung lượng</th>
                  <th className="py-3 px-4 text-center">Ngày sửa đổi</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedFolders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Folder className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-500">Không tìm thấy thư mục nào phù hợp.</p>
                        <button
                          onClick={handleRestoreDefaults}
                          className="mt-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục hệ thống 11 thư mục giáo án & tài liệu của Thầy Gọn</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedFolders.map((folder, index) => {
                    const isExpanded = expandedFolderIds[folder.id] !== false;
                    const directChildren = folders.filter((f) => f.parentId === folder.id);
                    const isSelected = selectedFolderIds.includes(folder.id);

                    return (
                      <tr
                        key={folder.id}
                        className={`transition-colors group ${
                          isSelected ? 'bg-blue-50/80 hover:bg-blue-50' : 'hover:bg-blue-50/50'
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectFolder(folder.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer accent-blue-600"
                          />
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">

                            {/* Folder Icon */}
                            <div
                              onClick={() => folder.hasChildren ? setDrillFolderId(folder.id) : onSelectFolder(folder.id)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs cursor-pointer group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: `${folder.color || '#0866E8'}18`,
                                color: folder.color || '#0866E8',
                              }}
                            >
                              <Folder className="w-4 h-4 fill-current" />
                            </div>

                            {/* Folder Details */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  onClick={() => folder.hasChildren ? setDrillFolderId(folder.id) : onSelectFolder(folder.id)}
                                  className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer text-xs md:text-sm hover:underline"
                                >
                                  {folder.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>Mã: {folder.code}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Total Files count (recursive) */}
                        <td
                          onClick={() => onSelectFolder(folder.id)}
                          className="py-3 px-4 text-center cursor-pointer"
                        >
                          <span className="font-bold text-slate-800 bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-700 px-2 py-0.5 rounded-lg transition-colors">
                            {folder.fileCount ?? 0} tệp
                          </span>
                        </td>

                        {/* Total Size */}
                        <td className="py-3 px-4 text-center font-medium text-slate-600">
                          {formatBytes(folder.totalSize || 0)}
                        </td>

                        {/* Date modified */}
                        <td className="py-3 px-4 text-center text-slate-500">
                          {formatDate(folder.updatedAt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1 relative">
                            {/* Open Files */}
                            <button
                              onClick={() => onSelectFolder(folder.id)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title={`Xem tài liệu trong "${folder.name}"`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Open Subfolders */}
                            {directChildren.length > 0 && (
                              <button
                                onClick={() => setDrillFolderId(folder.id)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                                title={`Mở thư mục "${folder.name}"`}
                              >
                                <FolderTree className="w-4 h-4" />
                              </button>
                            )}

                            {/* Add child folder */}
                            <button
                              onClick={() => {
                                setSelectedParentId(folder.id);
                                setIsCreateModalOpen(true);
                              }}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              title={`Tạo thư mục con trong "${folder.name}"`}
                            >
                              <FolderPlus className="w-4 h-4" />
                            </button>

                            {/* Upload files into this folder */}
                            <button
                              onClick={() => onOpenUpload(folder.id)}
                              className="p-1.5 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                              title={`Tải tệp vào thư mục "${folder.name}"`}
                            >
                              <UploadCloud className="w-4 h-4" />
                            </button>

                            {/* Rename / Move */}
                            <button
                              onClick={() => {
                                setRenameTarget(folder);
                                setRenameValue(folder.name);
                                setRenameColor(folder.color || '#0866E8');
                                setRenameParentId(folder.parentId || null);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                              title="Đổi tên / Chuyển vị trí"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget(folder)}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              title="Xóa thư mục"
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
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedFolders.map((folder) => {
            const directChildren = folders.filter((f) => f.parentId === folder.id);
            return (
              <div
                key={folder.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      onClick={() => folder.hasChildren ? setDrillFolderId(folder.id) : onSelectFolder(folder.id)}
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs cursor-pointer group-hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: `${folder.color || '#0866E8'}18`,
                        color: folder.color || '#0866E8',
                      }}
                    >
                      <Folder className="w-6 h-6 fill-current" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                        {folder.fileCount ?? 0} tệp
                      </span>
                    </div>
                  </div>

                  <h3
                    onClick={() => folder.hasChildren ? setDrillFolderId(folder.id) : onSelectFolder(folder.id)}
                    className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm mb-1 truncate cursor-pointer"
                  >
                    {folder.name}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                    <span>Dung lượng: {formatBytes(folder.totalSize || 0)}</span>
                    <span>{formatDate(folder.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className="text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mở xem</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedParentId(folder.id);
                        setIsCreateModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                      title={`Tạo thư mục con trong "${folder.name}"`}
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenUpload(folder.id)}
                      className="p-1 text-slate-400 hover:text-teal-600 rounded cursor-pointer"
                      title="Tải tệp vào đây"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setRenameTarget(folder);
                        setRenameValue(folder.name);
                        setRenameColor(folder.color || '#0866E8');
                        setRenameParentId(folder.parentId || null);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                      title="Đổi tên / Chuyển vị trí"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(folder)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                    ? `Tạo thư mục con trong "${folders.find((f) => f.id === selectedParentId)?.name || 'thư mục'}"`
                    : 'Tạo thư mục mới'}
                </h3>
                <p className="text-xs text-slate-500">Phân loại tài liệu giảng dạy và môn học khoa học</p>
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
                    'LỚP 1',
                    'LỚP 2',
                    'LỚP 3',
                    'LỚP 4',
                    'LỚP 5',
                    'TIẾNG VIỆT',
                    'TOÁN',
                    'ĐẠO ĐỨC',
                    'TỰ NHIÊN VÀ XÃ HỘI',
                    'HOẠT ĐỘNG TRẢI NGHIỆM',
                    'Tuần 1 - 4',
                    'Tuần 5 - 8',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Không xóa
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận xóa tất cả thư mục hoặc các thư mục đã chọn */}
      {deleteAllModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  {deleteAllModal.mode === 'all'
                    ? 'Xác nhận xóa tất cả thư mục'
                    : `Xác nhận xóa ${deleteAllModal.targetFolders.length} thư mục đã chọn`}
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {deleteAllModal.mode === 'all'
                    ? `Thầy đang chọn xóa toàn bộ ${deleteAllModal.targetFolders.length} thư mục trong hệ thống.`
                    : `Thầy đang chọn xóa ${deleteAllModal.targetFolders.length} thư mục đã chọn khỏi danh sách.`}
                </p>
              </div>
            </div>

            {/* Checkbox tùy chọn xử lý tệp tin bên trong */}
            <div className="space-y-2.5 my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteAllModal.deleteFiles}
                  onChange={(e) =>
                    setDeleteAllModal((prev) => ({ ...prev, deleteFiles: e.target.checked }))
                  }
                  className="mt-0.5 accent-rose-600 w-4 h-4 rounded cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Đồng thời chuyển các tệp tài liệu trong thư mục vào Thùng rác
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Các tệp tin giáo án sẽ được chuyển an toàn vào Thùng rác, Thầy có thể xem hoặc khôi phục lại bất kỳ lúc nào.
                  </span>
                </div>
              </label>
            </div>

            {/* Hướng dẫn an toàn */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-800 leading-relaxed mb-4">
              💡 <strong>Lưu ý:</strong> Sau khi xóa, Thầy luôn có thể bấm nút <strong>"Làm mới"</strong> trên thanh công cụ để khôi phục lại đầy đủ hệ thống 11 thư mục giáo án mặc định của Thầy Gọn bất cứ lúc nào!
            </div>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deleteAllModal.isDeleting}
                onClick={() =>
                  setDeleteAllModal({
                    isOpen: false,
                    mode: 'all',
                    targetFolders: [],
                    deleteFiles: true,
                    isDeleting: false,
                  })
                }
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteAllModal.isDeleting}
                onClick={handleExecuteBatchDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deleteAllModal.isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {deleteAllModal.mode === 'all'
                        ? `Xác nhận xóa tất cả (${deleteAllModal.targetFolders.length} thư mục)`
                        : `Xác nhận xóa (${deleteAllModal.targetFolders.length} thư mục)`}
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
