import React, { useState, useEffect } from 'react';
import {
  FileItem,
  FolderItem,
  StatsData,
  UserProfile,
  ViewTab,
  SharedConfig,
} from './types';
import { api, localStore, DEFAULT_FOLDERS, DEFAULT_FILES, formatBytes, formatDate, buildFolderTreeOptions } from './services/api';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { HomeDashboard } from './components/HomeDashboard';
import { FolderManager } from './components/FolderManager';
import { UploadView } from './components/UploadView';
import { FileViewerModal } from './components/FileViewerModal';
import { VersionManagerModal } from './components/VersionManagerModal';
import { FileSearch } from './components/FileSearch';
import { AIAssistant } from './components/AIAssistant';
import { ShareModal } from './components/ShareModal';
import { StorageStats } from './components/StorageStats';
import { TrashBin } from './components/TrashBin';
import { SecuritySettings } from './components/SecuritySettings';
import { MobileDeviceSimulator } from './components/MobileDeviceSimulator';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { LoginRegistrationScreen } from './components/LoginRegistrationScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  FileText,
  Folder,
  FolderPlus,
  ChevronRight,
  Eye,
  Download,
  Share2,
  Trash2,
  Star,
  History,
  Sparkles,
  UploadCloud,
  ArrowUpDown,
  Filter,
  Edit2,
  FolderUp,
  FolderDown,
  AlertTriangle,
  Loader2,
  RotateCcw,
  CheckSquare,
} from 'lucide-react';

const getDescendantFolderIds = (folderId: string, folderList: FolderItem[]): string[] => {
  const directChildren = folderList.filter((f) => f.parentId === folderId);
  let ids: string[] = [];
  for (const child of directChildren) {
    ids.push(child.id);
    ids = ids.concat(getDescendantFolderIds(child.id, folderList));
  }
  return ids;
};

export default function App() {
  // Navigation & View state - initialized with optional persistence
  const [currentTab, setCurrentTab] = useState<ViewTab>(() => localStore.get('active_tab', 'home'));
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(() => localStore.get('active_folderId', null));

  // Sync tab & selected folder to localStore
  useEffect(() => {
    localStore.set('active_tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    localStore.set('active_folderId', selectedFolderId);
  }, [selectedFolderId]);

  // App data state - initialized from localStore or DEFAULT constants for instant load
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStore.get<UserProfile | null>('user', null);
    if (cached) {
      if (!cached.avatarUrl || cached.avatarUrl.includes('photo-1544717305')) {
        cached.avatarUrl = '/avatar_tu_van_gon.jpg';
        localStore.set('user', cached);
      }
      return cached;
    }
    return null;
  });
  const [stats, setStats] = useState<StatsData | null>(() => localStore.get('stats', null));
  const [folders, setFolders] = useState<FolderItem[]>(() => {
    const cached = localStore.get<FolderItem[]>('folders', DEFAULT_FOLDERS);
    if (Array.isArray(cached) && cached.length >= 100) {
      return cached;
    }
    return DEFAULT_FOLDERS;
  });
  const [files, setFiles] = useState<FileItem[]>(() => {
    const cached = localStore.get<FileItem[]>('files_all', []);
    return (Array.isArray(cached) && cached.length > 0) ? cached : DEFAULT_FILES;
  });
  const [trashFiles, setTrashFiles] = useState<FileItem[]>(() => localStore.get('trash_files', []));
  const [isLoading, setIsLoading] = useState(false);
  const [includeSubfolderFiles, setIncludeSubfolderFiles] = useState(true);

  // Màn hình đăng nhập luôn hiện ra trước khi vào được giao diện web theo yêu cầu của Thầy Từ Văn Gọn
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Layout & Responsive state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileSimulatorActive, setIsMobileSimulatorActive] = useState(false);

  // Modal active states
  const [activeViewerFile, setActiveViewerFile] = useState<FileItem | null>(null);
  const [activeVersionFile, setActiveVersionFile] = useState<FileItem | null>(null);
  const [activeShareFile, setActiveShareFile] = useState<FileItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetFolderId, setUploadTargetFolderId] = useState<string | undefined>(undefined);
  const [uploadMode, setUploadMode] = useState<'file' | 'folder'>('file');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'users'>('login');

  // Create Folder Modal State
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [newFolderColorInput, setNewFolderColorInput] = useState('#8257E5');

  // Rename Folder Modal State
  const [renameFolderTarget, setRenameFolderTarget] = useState<FolderItem | null>(null);
  const [renameFolderNameInput, setRenameFolderNameInput] = useState('');
  const [renameFolderColorInput, setRenameFolderColorInput] = useState('#0866E8');
  const [renameFolderParentIdInput, setRenameFolderParentIdInput] = useState<string | null>(null);

  // Rename File Modal State
  const [renameFileTarget, setRenameFileTarget] = useState<FileItem | null>(null);
  const [renameFileNameInput, setRenameFileNameInput] = useState('');
  const [renameFileFolderIdInput, setRenameFileFolderIdInput] = useState<string>('');

  // Search keyword from Header or My Files
  const [searchQuery, setSearchQuery] = useState('');

  // Delete All Files in Folder Confirmation State
  const [folderDeleteAllConfirm, setFolderDeleteAllConfirm] = useState<{
    open: boolean;
    folderName: string;
    files: FileItem[];
    permanent: boolean;
    isDeleting: boolean;
  }>({
    open: false,
    folderName: '',
    files: [],
    permanent: false,
    isDeleting: false,
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load initial data with resilience
  const loadData = async (manualNotice = false) => {
    try {
      if (folders.length === 0) {
        setIsLoading(true);
      }
      const results = await Promise.allSettled([
        api.getUser(),
        api.getStats(),
        api.getFolders(),
        api.getFiles(),
        api.getFiles({ trash: true }),
      ]);

      const userData = results[0].status === 'fulfilled' ? results[0].value : null;
      const statsData = results[1].status === 'fulfilled' ? results[1].value : null;
      const foldersData = results[2].status === 'fulfilled' ? results[2].value : [];
      const filesData = results[3].status === 'fulfilled' ? results[3].value : [];
      const trashData = results[4].status === 'fulfilled' ? results[4].value : [];

      if (userData) {
        if (!userData.avatarUrl || userData.avatarUrl.includes('photo-1544717305')) {
          userData.avatarUrl = '/avatar_tu_van_gon.jpg';
        }
        setUser(userData);
      }
      if (statsData) setStats(statsData);
      if (Array.isArray(foldersData) && foldersData.length > 0) {
        setFolders(foldersData);
        localStore.set('folders', foldersData);
      } else {
        const cachedFolders = localStore.get<FolderItem[]>('folders', []);
        if (Array.isArray(cachedFolders) && cachedFolders.length >= 100) {
          setFolders(cachedFolders);
        } else {
          setFolders(DEFAULT_FOLDERS);
          localStore.set('folders', DEFAULT_FOLDERS);
        }
      }

      if (Array.isArray(filesData) && filesData.length > 0) {
        setFiles(filesData);
        localStore.set('files_all', filesData);
      } else {
        const cachedFiles = localStore.get<FileItem[]>('files_all', []);
        if (Array.isArray(cachedFiles) && cachedFiles.length > 0) {
          setFiles(cachedFiles);
        } else {
          setFiles(DEFAULT_FILES);
          localStore.set('files_all', DEFAULT_FILES);
        }
      }

      if (Array.isArray(trashData)) {
        setTrashFiles(trashData);
        localStore.set('trash_files', trashData);
      }

      if (manualNotice) {
        showToast('Đã làm mới và đồng bộ 12 thư mục giáo án thành công!');
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu kho tài liệu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCacheAndRefresh = async () => {
    api.clearLocalCache();
    showToast('Đang dọn sạch bộ nhớ đệm và đồng bộ dữ liệu...');
    await loadData(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for file operations
  const handleOpenFile = (file: FileItem) => {
    setActiveViewerFile(file);
  };

  const handleDownloadFile = (file: FileItem) => {
    window.location.href = api.getDownloadUrl(file.id);
  };

  const handleShareFile = (file: FileItem) => {
    setActiveShareFile(file);
  };

  const handleDeleteFile = async (file: FileItem) => {
    try {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      await api.deleteFile(file.id, false);
      showToast(`Đã chuyển tệp "${file.name}" vào thùng rác`);
      await loadData();
    } catch (err) {
      console.error('Lỗi xóa tệp:', err);
      await loadData();
    }
  };

  const handleRestoreFile = async (file: FileItem) => {
    try {
      setTrashFiles((prev) => prev.filter((f) => f.id !== file.id));
      await api.restoreFile(file.id);
      showToast(`Đã khôi phục tệp "${file.name}" thành công!`);
      await loadData();
    } catch (err) {
      console.error('Lỗi khôi phục tệp:', err);
      await loadData();
    }
  };

  const handlePermanentDeleteFile = async (file: FileItem) => {
    try {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setTrashFiles((prev) => prev.filter((f) => f.id !== file.id));
      await api.deleteFile(file.id, true);
      showToast(`Đã xóa vĩnh viễn tệp "${file.name}"`);
      await loadData();
    } catch (err) {
      console.error('Lỗi xóa vĩnh viễn:', err);
      await loadData();
    }
  };

  const handleDeleteMultipleFiles = async (filesToDelete: FileItem[], permanent: boolean = false) => {
    try {
      const ids = filesToDelete.map((f) => f.id);
      const idSet = new Set(ids);
      setFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
      if (permanent) {
        setTrashFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
      }
      await api.batchDeleteFiles({ ids, permanent });
      showToast(
        permanent
          ? `Đã xóa vĩnh viễn ${ids.length} tài liệu khỏi hệ thống!`
          : `Đã chuyển ${ids.length} tài liệu vào thùng rác!`
      );
      await loadData();
    } catch (err) {
      console.error('Lỗi xóa nhiều tệp:', err);
      showToast('Có lỗi xảy ra khi xóa tài liệu');
      await loadData();
    }
  };

  const handleDeleteAllInView = async (filesToDelete: FileItem[], permanent: boolean = false) => {
    try {
      const ids = filesToDelete.map((f) => f.id);
      const idSet = new Set(ids);
      setFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
      if (permanent) {
        setTrashFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
      }
      await api.batchDeleteFiles({ ids, permanent });
      showToast(
        permanent
          ? `Đã xóa vĩnh viễn ${ids.length} tài liệu trong thư mục!`
          : `Đã chuyển ${ids.length} tài liệu vào thùng rác!`
      );
      await loadData();
    } catch (err) {
      console.error('Lỗi xóa tất cả trong thư mục:', err);
      await loadData();
    }
  };

  const handleExecuteFolderDeleteAll = async () => {
    if (folderDeleteAllConfirm.files.length === 0) return;
    setFolderDeleteAllConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      const ids = folderDeleteAllConfirm.files.map((f) => f.id);
      await api.batchDeleteFiles({ ids, permanent: folderDeleteAllConfirm.permanent });
      showToast(
        folderDeleteAllConfirm.permanent
          ? `Đã xóa vĩnh viễn ${ids.length} tài liệu khỏi ${folderDeleteAllConfirm.folderName}!`
          : `Đã chuyển ${ids.length} tài liệu vào thùng rác!`
      );
      setFolderDeleteAllConfirm({
        open: false,
        folderName: '',
        files: [],
        permanent: false,
        isDeleting: false,
      });
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Có lỗi khi xóa tài liệu');
      setFolderDeleteAllConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await api.emptyTrash();
      showToast('Đã dọn sạch thùng rác thành công');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (file: FileItem) => {
    try {
      await api.updateFile(file.id, { isFavorite: !file.isFavorite });
      showToast(file.isFavorite ? 'Đã bỏ yêu thích tệp' : 'Đã thêm vào mục Yêu thích');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenUpload = (targetFolderId?: string, mode: 'file' | 'folder' = 'file') => {
    setUploadTargetFolderId(targetFolderId);
    setUploadMode(mode);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (uploaded: FileItem[]) => {
    showToast(`Đã tải lên thành công ${uploaded.length} tài liệu vào kho!`);
    loadData();
  };

  const handleOpenCreateFolderModal = (parentId?: string | null) => {
    setCreateFolderParentId(parentId ?? null);
    setNewFolderNameInput('');
    setNewFolderColorInput('#8257E5');
    setIsCreateFolderModalOpen(true);
  };

  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderNameInput.trim()) return;
    try {
      await api.createFolder(newFolderNameInput.trim(), createFolderParentId, newFolderColorInput);
      const parent = folders.find((f) => f.id === createFolderParentId);
      showToast(
        parent
          ? `Đã tạo thư mục con "${newFolderNameInput.trim()}" trong ${parent.name}!`
          : `Đã tạo thư mục "${newFolderNameInput.trim()}" thành công!`
      );
      setIsCreateFolderModalOpen(false);
      setNewFolderNameInput('');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Không thể tạo thư mục, vui lòng thử lại');
    }
  };

  const handleCreateFolder = async (name: string, color?: string, parentId?: string | null) => {
    try {
      await api.createFolder(name, parentId ?? null, color);
      showToast(`Đã tạo thư mục "${name}" thành công!`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string, color?: string, parentId?: string | null) => {
    try {
      await api.updateFolder(folderId, { name: newName, color, parentId });
      showToast(`Đã cập nhật thư mục thành "${newName}"`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRenameFolderModal = (folder: FolderItem) => {
    setRenameFolderTarget(folder);
    setRenameFolderNameInput(folder.name);
    setRenameFolderColorInput(folder.color || '#0866E8');
    setRenameFolderParentIdInput(folder.parentId || null);
  };

  const handleSaveRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderTarget || !renameFolderNameInput.trim()) return;
    try {
      await api.updateFolder(renameFolderTarget.id, {
        name: renameFolderNameInput.trim(),
        color: renameFolderColorInput,
        parentId: renameFolderParentIdInput,
      });
      showToast(`Đã cập nhật thư mục thành "${renameFolderNameInput.trim()}" thành công!`);
      setRenameFolderTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Không thể đổi tên thư mục, vui lòng thử lại');
    }
  };

  const handleOpenRenameFileModal = (file: FileItem) => {
    setRenameFileTarget(file);
    setRenameFileNameInput(file.name);
    setRenameFileFolderIdInput(file.folderId || (folders[0]?.id || ''));
  };

  const handleSaveRenameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFileTarget || !renameFileNameInput.trim()) return;
    let finalName = renameFileNameInput.trim();
    const ext = renameFileTarget.extension ? `.${renameFileTarget.extension}` : '';
    if (ext && !finalName.includes('.')) {
      finalName = `${finalName}${ext}`;
    }

    try {
      const updated = await api.updateFile(renameFileTarget.id, {
        name: finalName,
        folderId: renameFileFolderIdInput || undefined,
      });
      showToast(`Đã đổi tên tệp thành "${finalName}" thành công!`);
      setRenameFileTarget(null);
      if (activeViewerFile && activeViewerFile.id === renameFileTarget.id) {
        setActiveViewerFile(updated);
      }
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Không thể đổi tên tệp, vui lòng thử lại');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
      await api.deleteFolder(folderId);
      showToast('Đã xóa thư mục và chuyển các tệp vào thùng rác');
      await loadData();
    } catch (err) {
      console.error(err);
      await loadData();
    }
  };

  const handleBatchDeleteFolders = async (folderIds: string[], deleteFiles: boolean = true) => {
    try {
      const idSet = new Set(folderIds);
      setFolders((prev) => prev.filter((f) => !idSet.has(f.id)));
      await api.batchDeleteFolders({ ids: folderIds, deleteFiles });
      showToast(`Đã xóa thành công ${folderIds.length} thư mục!`);
      await loadData();
    } catch (err) {
      console.error('Lỗi xóa nhiều thư mục:', err);
      showToast('Có lỗi xảy ra khi xóa thư mục');
      await loadData();
    }
  };

  const handleDeleteAllFolders = async (deleteFiles: boolean = true) => {
    try {
      setFolders([]);
      await api.batchDeleteFolders({ all: true, deleteFiles });
      showToast('Đã xóa tất cả các thư mục khỏi hệ thống!');
      await loadData();
    } catch (err) {
      console.error('Lỗi xóa tất cả thư mục:', err);
      showToast('Có lỗi xảy ra khi xóa tất cả thư mục');
      await loadData();
    }
  };

  const handleSelectFolderToView = (folderId: string) => {
    setSelectedFolderId(folderId);
    setCurrentTab('my-files');
  };

  const handleHeaderSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentTab('my-files');
  };

  const handleOpenAIAnalyzeFromFile = (file: FileItem) => {
    setActiveViewerFile(null);
    setCurrentTab('ai-assistant');
  };

  const handleOpenAuthModal = (tab: 'login' | 'register' | 'users' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleUserChanged = (newUser: UserProfile) => {
    setUser(newUser);
    localStore.set('user', newUser);
    showToast(`Đang làm việc với tài khoản: ${newUser.fullName} (@${newUser.username || 'user'})`);
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    localStore.set('user', loggedInUser);
    setIsAuthenticated(true);
    showToast(`Chào mừng ${loggedInUser.fullName}! Đăng nhập thành công.`);
    loadData();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    localStore.remove('is_authenticated');
    setIsAuthenticated(false);
    showToast('Đã đăng xuất ra màn hình đăng nhập an toàn.');
  };

  // Render current tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeDashboard
            stats={stats}
            recentFiles={files.filter((f) => !f.isDeleted)}
            folders={folders}
            onSelectFolder={handleSelectFolderToView}
            onOpenFile={handleOpenFile}
            onDownloadFile={handleDownloadFile}
            onShareFile={handleShareFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleOpenRenameFileModal}
            onOpenUpload={() => handleOpenUpload()}
            onGoToTab={(tab) => setCurrentTab(tab)}
            onOpenAuthModal={handleOpenAuthModal}
          />
        );

      case 'my-files':
      case 'favorites':
        const isFavoritesView = currentTab === 'favorites';
        let displayedFiles = files.filter((f) => !f.isDeleted);
        if (isFavoritesView) {
          displayedFiles = displayedFiles.filter((f) => f.isFavorite);
        }
        if (selectedFolderId) {
          const descendantIds = [selectedFolderId, ...getDescendantFolderIds(selectedFolderId, folders)];
          if (includeSubfolderFiles) {
            displayedFiles = displayedFiles.filter((f) => descendantIds.includes(f.folderId));
          } else {
            const directFiles = displayedFiles.filter((f) => f.folderId === selectedFolderId);
            displayedFiles = directFiles.length > 0 ? directFiles : displayedFiles.filter((f) => descendantIds.includes(f.folderId));
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          displayedFiles = displayedFiles.filter(
            (f) =>
              f.name.toLowerCase().includes(q) ||
              (f.folderName && f.folderName.toLowerCase().includes(q)) ||
              (f.previewContent && f.previewContent.toLowerCase().includes(q))
          );
        }

        const currentFolderObj = folders.find((f) => f.id === selectedFolderId);

        // Build breadcrumb trail for subfolders
        const breadcrumbs: FolderItem[] = [];
        if (selectedFolderId) {
          let curr = currentFolderObj;
          while (curr) {
            breadcrumbs.unshift(curr);
            curr = curr.parentId ? folders.find((f) => f.id === curr?.parentId) : undefined;
          }
        }

        // Subfolders under this current folder
        const subfoldersInCurrent = selectedFolderId
          ? folders.filter((f) => f.parentId === selectedFolderId)
          : [];

        return (
          <div className="space-y-5">
            {/* Folder / Category header bar */}
            <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                {/* Breadcrumbs trail */}
                {selectedFolderId && breadcrumbs.length > 0 && (
                  <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedFolderId(null)}
                      className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>📁 Tất cả thư mục</span>
                    </button>
                    {breadcrumbs.map((b, idx) => (
                      <React.Fragment key={b.id}>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <button
                          onClick={() => setSelectedFolderId(b.id)}
                          className={`hover:text-blue-600 transition-colors cursor-pointer ${
                            idx === breadcrumbs.length - 1 ? 'font-bold text-slate-900' : ''
                          }`}
                        >
                          {b.name}
                        </button>
                      </React.Fragment>
                    ))}
                  </nav>
                )}

                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {selectedFolderId && (
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: `${currentFolderObj?.color || '#0866E8'}20`,
                          color: currentFolderObj?.color || '#0866E8',
                        }}
                      >
                        <Folder className="w-4 h-4 fill-current" />
                      </div>
                    )}
                    <span>
                      {isFavoritesView
                        ? 'Tài liệu yêu thích'
                        : selectedFolderId
                        ? `Thư mục: ${currentFolderObj?.name || 'Tài liệu'}`
                        : 'Tất cả tài liệu của Thầy Gọn'}
                    </span>
                  </h2>

                  {/* Nút Đổi tên thư mục nhanh bên cạnh tiêu đề */}
                  {selectedFolderId && currentFolderObj && (
                    <button
                      onClick={() => handleOpenRenameFolderModal(currentFolderObj)}
                      className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title={`Đổi tên thư mục "${currentFolderObj.name}"`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                  <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                    {displayedFiles.length} tệp
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isFavoritesView
                    ? 'Danh sách tài liệu giảng dạy ưu tiên đánh dấu sao'
                    : selectedFolderId
                    ? `Đang xem tài liệu trong thư mục ${currentFolderObj?.name} (Mã: ${currentFolderObj?.code || '04'})`
                    : 'Hệ thống tài liệu lưu trữ trên đám mây Trường TH Phường An Xuyên'}
                </p>

                {selectedFolderId && (
                  <label className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={includeSubfolderFiles}
                      onChange={(e) => setIncludeSubfolderFiles(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span>Hiển thị cả tệp trong các thư mục con ({displayedFiles.length} tệp)</span>
                  </label>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Nút Đổi tên thư mục hiện tại */}
                {selectedFolderId && currentFolderObj && (
                  <button
                    onClick={() => handleOpenRenameFolderModal(currentFolderObj)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title={`Đổi tên thư mục ${currentFolderObj.name}`}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Đổi tên thư mục</span>
                  </button>
                )}

                {/* 1. Nút Tạo thư mục mới / thư mục con */}
                <button
                  onClick={() => handleOpenCreateFolderModal(selectedFolderId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title={selectedFolderId ? `Tạo thư mục con trong ${currentFolderObj?.name}` : 'Tạo thư mục mới'}
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>{selectedFolderId ? '+ Tạo thư mục con' : '+ Tạo thư mục mới'}</span>
                </button>

                {/* 2. Nút Tải tệp lên thư mục này */}
                <button
                  onClick={() => handleOpenUpload(selectedFolderId || undefined, 'file')}
                  className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title={selectedFolderId ? `Tải tệp vào thư mục ${currentFolderObj?.name}` : 'Tải tệp lên'}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{selectedFolderId ? 'Tải tệp lên thư mục này' : 'Tải tệp lên'}</span>
                </button>

                {/* 3. Nút Tải thư mục lên */}
                <button
                  onClick={() => handleOpenUpload(selectedFolderId || undefined, 'folder')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title={selectedFolderId ? `Tải cả thư mục từ máy tính vào ${currentFolderObj?.name}` : 'Tải cả thư mục từ máy tính lên'}
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Tải thư mục lên</span>
                </button>

                {/* 3b. Nút Tải thư mục xuống */}
                <button
                  onClick={() => {
                    if (selectedFolderId) {
                      api.downloadFolder(selectedFolderId, currentFolderObj?.name);
                      showToast(`Đang nén và tải xuống thư mục "${currentFolderObj?.name || 'Tài liệu'}" dạng .zip...`);
                    } else {
                      api.downloadFolder('all', 'Kho_Tai_Lieu_Thay_Tu_Van_Gon');
                      showToast('Đang nén và tải xuống toàn bộ kho tài liệu của Thầy Gọn dạng .zip...');
                    }
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title={
                    selectedFolderId
                      ? `Tải toàn bộ thư mục "${currentFolderObj?.name}" về máy tính (.zip)`
                      : 'Tải toàn bộ kho tài liệu về máy tính (.zip)'
                  }
                >
                  <FolderDown className="w-4 h-4" />
                  <span>{selectedFolderId ? 'Tải thư mục xuống' : 'Tải tất cả xuống (.zip)'}</span>
                </button>

                {/* 4. Nút Xóa tất cả file trong thư mục */}
                {displayedFiles.length > 0 && (
                  <button
                    onClick={() =>
                      setFolderDeleteAllConfirm({
                        open: true,
                        folderName: currentFolderObj?.name || 'danh sách hiện tại',
                        files: displayedFiles,
                        permanent: false,
                        isDeleting: false,
                      })
                    }
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    title={`Xóa tất cả ${displayedFiles.length} tài liệu`}
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Xóa tất cả file ({displayedFiles.length})</span>
                  </button>
                )}

                {/* 3. Nút quay lại */}
                {selectedFolderId && (
                  <button
                    onClick={() => {
                      if (currentFolderObj?.parentId) {
                        setSelectedFolderId(currentFolderObj.parentId);
                      } else {
                        setSelectedFolderId(null);
                      }
                    }}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    ← Quay lại
                  </button>
                )}
              </div>
            </div>

            {/* Quick Root Folders Selector Bar - Chọn nhanh thư mục giáo án */}
            <div className="bg-white p-3 md:p-3.5 rounded-2xl shadow-xs border border-slate-200">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-xs font-bold text-slate-600 shrink-0 flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-blue-600" />
                  Chọn nhanh thư mục:
                </span>
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedFolderId === null
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>📁 Tất cả</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedFolderId === null ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {files.filter((f) => !f.isDeleted).length}
                  </span>
                </button>
                {folders
                  .filter((f) => !f.parentId || f.parentId === 'null' || f.parentId === 'undefined' || f.parentId === '' || f.parentId === 'root')
                  .sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' }))
                  .map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    const isLessonPlans = folder.id === 'f_1792476597159' || folder.name.includes('GIÁO ÁN');
                    const descendantIds = [folder.id, ...getDescendantFolderIds(folder.id, folders)];
                    const count = files.filter((f) => !f.isDeleted && descendantIds.includes(f.folderId)).length || (folder.fileCount ?? 0);
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'text-white shadow-xs'
                            : isLessonPlans
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                        style={isSelected ? { backgroundColor: folder.color || '#0866E8' } : undefined}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: isSelected ? '#ffffff' : folder.color || '#0866E8',
                          }}
                        />
                        <span>{folder.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : isLessonPlans
                              ? 'bg-blue-200 text-blue-900 font-extrabold'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Subfolders Section within the selected folder */}
            {selectedFolderId && subfoldersInCurrent.length > 0 && (
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs md:text-sm font-bold text-slate-900">
                    Thư mục bên trong {currentFolderObj?.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {subfoldersInCurrent.map((sub) => {
                    const subDescendants = [sub.id, ...getDescendantFolderIds(sub.id, folders)];
                    const subCount = files.filter((f) => !f.isDeleted && subDescendants.includes(f.folderId)).length || (sub.fileCount ?? 0);
                    return (
                      <div
                        key={sub.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer group flex items-center justify-between gap-2.5 relative"
                      >
                        <div
                          onClick={() => setSelectedFolderId(sub.id)}
                          className="flex items-center gap-2.5 min-w-0 flex-1"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs"
                            style={{
                              backgroundColor: `${sub.color || '#8257E5'}20`,
                              color: sub.color || '#8257E5',
                            }}
                          >
                            <Folder className="w-4 h-4 fill-current" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 truncate">
                              {sub.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-semibold">
                              {subCount} tệp
                            </p>
                          </div>
                        </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Nút Tải thư mục con xuống (.zip) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            api.downloadFolder(sub.id, sub.name);
                            showToast(`Đang nén và tải xuống thư mục con "${sub.name}" dạng .zip...`);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-100/60 rounded cursor-pointer"
                          title={`Tải thư mục "${sub.name}" xuống máy tính (.zip)`}
                        >
                          <FolderDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Đổi tên thư mục con */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRenameFolderModal(sub);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 rounded cursor-pointer"
                          title={`Đổi tên "${sub.name}"`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}

            {/* Quick search & filter table */}
            <FileSearch
              files={displayedFiles}
              onOpenFile={handleOpenFile}
              onDownloadFile={handleDownloadFile}
              onShareFile={handleShareFile}
              onDeleteFile={handleDeleteFile}
              onDeleteMultipleFiles={handleDeleteMultipleFiles}
              onDeleteAllFiles={handleDeleteAllInView}
              onRenameFile={handleOpenRenameFileModal}
              onOpenUpload={() => handleOpenUpload(selectedFolderId || undefined, 'file')}
              onOpenUploadFolder={() => handleOpenUpload(selectedFolderId || undefined, 'folder')}
              currentFolderName={currentFolderObj?.name}
              onMoveToEnd={async (file) => {
                try {
                  await api.reorderFile(file.id, 'end');
                  showToast(`Đã chuyển "${file.name}" xuống cuối cùng thành công!`);
                  loadData();
                } catch (e) {
                  console.error(e);
                  showToast('Không thể chuyển vị trí tệp');
                }
              }}
            />
          </div>
        );

      case 'folders':
        return (
          <FolderManager
            folders={folders}
            files={files}
            onSelectFolder={handleSelectFolderToView}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onBatchDeleteFolders={handleBatchDeleteFolders}
            onDeleteAllFolders={handleDeleteAllFolders}
            onOpenUpload={(targetFolderId) => handleOpenUpload(targetFolderId, 'file')}
            onOpenUploadFolder={(targetFolderId) => handleOpenUpload(targetFolderId, 'folder')}
            onRefreshData={() => loadData(true)}
            onDownloadFolder={(folder) => {
              api.downloadFolder(folder.id, folder.name);
              showToast(`Đang nén và tải xuống thư mục "${folder.name}" (.zip)...`);
            }}
            onDownloadBatchFolders={(folderIds) => {
              api.downloadBatchFolders(folderIds);
              showToast(`Đang nén và tải xuống ${folderIds.length} thư mục đã chọn (.zip)...`);
            }}
          />
        );

      case 'share':
        const sharedFiles = files.filter((f) => !f.isDeleted && f.shareConfig?.isShared);
        return (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-600" />
                  <span>Tài liệu đã chia sẻ ({sharedFiles.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Quản lý quyền truy cập liên kết và danh sách người xem tài liệu của Thầy Gọn
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Tên tài liệu</th>
                      <th className="py-3 px-3">Liên kết chia sẻ</th>
                      <th className="py-3 px-3">Quyền hạn</th>
                      <th className="py-3 px-3">Bảo vệ mật khẩu</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {sharedFiles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          Chưa có tài liệu nào được kích hoạt chia sẻ.
                        </td>
                      </tr>
                    ) : (
                      sharedFiles.map((f) => (
                        <tr key={f.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{f.name}</td>
                          <td className="py-3 px-3 font-mono text-blue-600 truncate max-w-xs">
                            {f.shareConfig?.shareUrl}
                          </td>
                          <td className="py-3 px-3">
                            <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                              {f.shareConfig?.accessRole === 'editor' ? 'Người chỉnh sửa' : 'Người xem'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {f.shareConfig?.hasPassword ? (
                              <span className="text-emerald-600 font-semibold text-[11px]">Có mật khẩu</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Công khai</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setActiveShareFile(f)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-xs px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Cấu hình lại
                            </button>
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

      case 'trash':
        return (
          <TrashBin
            trashFiles={trashFiles}
            onRestore={handleRestoreFile}
            onPermanentDelete={handlePermanentDeleteFile}
            onEmptyTrash={handleEmptyTrash}
          />
        );

      case 'ai-assistant':
        return <AIAssistant files={files} />;

      case 'stats':
        return <StorageStats stats={stats} />;

      case 'settings':
        return (
          <SecuritySettings
            user={user}
            onUpdateUser={async (userData) => {
              const updated = await api.updateUser(userData);
              setUser(updated);
            }}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onOpenAuthModal={handleOpenAuthModal}
            onLogout={handleLogout}
          />
        );

      default:
        return null;
    }
  };

  // Màn hình đăng nhập & đăng ký hiện ra trước khi vào được giao diện web
  if (!isAuthenticated) {
    return (
      <LoginRegistrationScreen
        onLoginSuccess={handleLoginSuccess}
        initialMode="login"
      />
    );
  }

  return (
    <div translate="no" className="notranslate min-h-screen bg-[#F0F4FA] flex flex-col font-sans text-slate-800">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header (Sticky Top) */}
      <Header
        user={user}
        onSearch={handleHeaderSearch}
        onOpenSettings={() => setCurrentTab('settings')}
        onOpenNotifications={() => {}}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onClearCacheAndRefresh={handleClearCacheAndRefresh}
        onOpenAuthModal={handleOpenAuthModal}
        onLogout={handleLogout}
        toggleMobileSimulator={() => setIsMobileSimulatorActive(!isMobileSimulatorActive)}
        isMobileSimulatorActive={isMobileSimulatorActive}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onUpdateUser={async (userData) => {
          const updated = await api.updateUser(userData);
          setUser(updated);
          showToast('Đã cập nhật ảnh đại diện thành công!');
        }}
      />

      {/* Main Body Container: Sidebar + Content */}
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        {/* 2. Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab !== 'my-files') {
              setSelectedFolderId(null);
            }
          }}
          stats={stats}
          onOpenUpload={() => handleOpenUpload(selectedFolderId || undefined)}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onOpenAuthModal={handleOpenAuthModal}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* 3. Main Dynamic Content View */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 overflow-y-auto max-w-full">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-slate-500">
                  Đang khởi tạo Kho Dữ Liệu Thầy Gọn...
                </p>
              </div>
            </div>
          ) : (
            renderTabContent()
          )}
        </main>
      </div>

      {/* Modals */}
      {/* Modal 3: Tải tài liệu lên (Upload View Modal) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 relative">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
            <UploadView
              folders={folders}
              defaultFolderId={uploadTargetFolderId}
              onUploadSuccess={(newFiles) => {
                handleUploadSuccess(newFiles);
                setIsUploadModalOpen(false);
              }}
              onClose={() => setIsUploadModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Modal 4: Xem chi tiết tài liệu (File Viewer) */}
      {activeViewerFile && (
        <FileViewerModal
          file={activeViewerFile}
          allFiles={files.filter((f) => !f.isDeleted)}
          onNavigate={(nextFile) => {
            setActiveViewerFile(nextFile);
            setFiles((prev) => prev.map((f) => (f.id === nextFile.id ? nextFile : f)));
          }}
          onClose={() => setActiveViewerFile(null)}
          onShare={handleShareFile}
          onOpenVersions={(file) => {
            setActiveViewerFile(null);
            setActiveVersionFile(file);
          }}
          onRename={handleOpenRenameFileModal}
          onOpenAIAnalyze={handleOpenAIAnalyzeFromFile}
        />
      )}

      {/* Modal 5: Quản lý phiên bản (Version History) */}
      {activeVersionFile && (
        <VersionManagerModal
          file={activeVersionFile}
          onClose={() => setActiveVersionFile(null)}
          onVersionUpdated={(updated) => {
            loadData();
          }}
        />
      )}

      {/* Modal 8: Chia sẻ tài liệu (Share Modal) */}
      {activeShareFile && (
        <ShareModal
          file={activeShareFile}
          onClose={() => setActiveShareFile(null)}
          onShareUpdated={() => loadData()}
        />
      )}

      {/* Modal: Quản lý kết nối Supabase Cloud */}
      <ErrorBoundary fallbackTitle="Không thể mở hộp thoại Supabase" onReset={() => setIsSupabaseModalOpen(false)}>
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onSyncSuccess={loadData}
        />
      </ErrorBoundary>

      {/* Modal 12: Chế độ điện thoại (Mobile Device Simulator) */}
      {isMobileSimulatorActive && (
        <MobileDeviceSimulator
          user={user}
          stats={stats}
          files={files}
          folders={folders}
          onClose={() => setIsMobileSimulatorActive(false)}
          onOpenFile={(file) => {
            setIsMobileSimulatorActive(false);
            handleOpenFile(file);
          }}
          onOpenUpload={() => {
            setIsMobileSimulatorActive(false);
            handleOpenUpload();
          }}
        />
      )}

      {/* Modal: Tạo thư mục mới / Thư mục con */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateFolderModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `${newFolderColorInput}20`,
                  color: newFolderColorInput,
                }}
              >
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-900">
                  {createFolderParentId
                    ? `Tạo thư mục con trong ${folders.find((f) => f.id === createFolderParentId)?.name || 'thư mục'}`
                    : 'Tạo thư mục mới'}
                </h3>
                <p className="text-xs text-slate-500">
                  Phân loại tài liệu giảng dạy và hồ sơ sư phạm khoa học
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              {/* Parent folder selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vị trí lưu thư mục:
                </label>
                <select
                  value={createFolderParentId || 'root'}
                  onChange={(e) => setCreateFolderParentId(e.target.value === 'root' ? null : e.target.value)}
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

              {/* Folder name input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên thư mục *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderNameInput}
                  onChange={(e) => setNewFolderNameInput(e.target.value)}
                  placeholder="Ví dụ: Tuần 1 - 4 hoặc Môn Toán lớp 1..."
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-300 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  autoFocus
                />
              </div>

              {/* Quick suggestions chips tailored for primary school teachers */}
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
                    'Môn TN&XH 1',
                    'Học kỳ I',
                    'Học kỳ II',
                    'Giáo án STEM',
                    'Phiếu bài tập',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewFolderNameInput(tag)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium border border-blue-200 transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Màu sắc nhận diện thư mục
                </label>
                <div className="flex items-center gap-2">
                  {['#8257E5', '#0866E8', '#16B875', '#FF9F1C', '#F04444', '#064AA8', '#38BDF8', '#64748B'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColorInput(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        newFolderColorInput === c ? 'scale-125 border-slate-900 shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Tạo thư mục ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi tên thư mục */}
      {renameFolderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 relative">
            <button
              onClick={() => setRenameFolderTarget(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: `${renameFolderColorInput}20`,
                  color: renameFolderColorInput,
                }}
              >
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Đổi tên thư mục</h3>
                <p className="text-xs text-slate-500">
                  Cập nhật tên cho thư mục <span className="font-semibold text-slate-800">"{renameFolderTarget.name}"</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRenameFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Vị trí lưu (Thư mục cha):
                </label>
                <select
                  value={renameFolderParentIdInput || 'root'}
                  onChange={(e) => setRenameFolderParentIdInput(e.target.value === 'root' ? null : e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="root">📁 Thư mục gốc (Cấp cao nhất ngoài màn hình)</option>
                  {buildFolderTreeOptions(folders)
                    .filter((opt) => opt.id !== renameFolderTarget.id)
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
                  value={renameFolderNameInput}
                  onChange={(e) => setRenameFolderNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Màu sắc thư mục
                </label>
                <div className="flex items-center gap-2">
                  {['#8257E5', '#0866E8', '#16B875', '#FF9F1C', '#F04444', '#064AA8', '#38BDF8', '#64748B'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRenameFolderColorInput(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                        renameFolderColorInput === c ? 'scale-125 border-slate-900 shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenameFolderTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi tên tệp tài liệu */}
      {renameFileTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 relative">
            <button
              onClick={() => setRenameFileTarget(null)}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Đổi tên tệp tài liệu</h3>
                <p className="text-xs text-slate-500">
                  Chỉnh sửa tên hiển thị hoặc di chuyển vị trí lưu trữ cho tệp của Thầy
                </p>
              </div>
            </div>

            {/* Current file badge info */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 mb-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-slate-700 truncate max-w-xs">{renameFileTarget.name}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 shrink-0">
                {formatBytes(renameFileTarget.size)}
              </span>
            </div>

            <form onSubmit={handleSaveRenameFile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên tệp mới *
                </label>
                <input
                  type="text"
                  required
                  value={renameFileNameInput}
                  onChange={(e) => setRenameFileNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-xl border border-slate-300 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                  placeholder="Ví dụ: TV TUẦN 1.docx"
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  💡 Thầy có thể giữ nguyên đuôi mở rộng (ví dụ <span className="font-mono bg-slate-100 text-amber-700 px-1 py-0.5 rounded font-bold">.{renameFileTarget.extension || 'docx'}</span>) để hệ thống nhận diện chính xác định dạng tệp.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Thư mục lưu trữ:
                </label>
                <select
                  value={renameFileFolderIdInput}
                  onChange={(e) => setRenameFileFolderIdInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {buildFolderTreeOptions(folders).map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.depth === 0 ? `📂 ${opt.name}` : opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRenameFileTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Lưu tên mới</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận Xóa tất cả file trong thư mục từ thanh công cụ đầu trang */}
      {folderDeleteAllConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">
                  Xác nhận xóa tất cả tài liệu
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Thầy có chắc chắn muốn xóa toàn bộ <strong>{folderDeleteAllConfirm.files.length} tài liệu</strong> trong {folderDeleteAllConfirm.folderName} không?
                </p>
              </div>
            </div>

            <div className="space-y-2.5 my-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-800">Phương thức xóa:</p>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                <input
                  type="radio"
                  name="folderDeleteType"
                  checked={!folderDeleteAllConfirm.permanent}
                  onChange={() => setFolderDeleteAllConfirm((prev) => ({ ...prev, permanent: false }))}
                  className="mt-0.5 accent-blue-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Chuyển vào thùng rác <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-1">Khuyên dùng</span>
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Tài liệu được chuyển vào Thùng rác. Thầy có thể khôi phục lại bất kỳ lúc nào nếu cần.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                <input
                  type="radio"
                  name="folderDeleteType"
                  checked={folderDeleteAllConfirm.permanent}
                  onChange={() => setFolderDeleteAllConfirm((prev) => ({ ...prev, permanent: true }))}
                  className="mt-0.5 accent-rose-600 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-rose-700 block">
                    Xóa vĩnh viễn khỏi hệ thống
                  </span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Xóa hoàn toàn tệp vật lý khỏi máy chủ, không thể khôi phục lại.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={folderDeleteAllConfirm.isDeleting}
                onClick={() =>
                  setFolderDeleteAllConfirm({
                    open: false,
                    folderName: '',
                    files: [],
                    permanent: false,
                    isDeleting: false,
                  })
                }
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={folderDeleteAllConfirm.isDeleting}
                onClick={handleExecuteFolderDeleteAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {folderDeleteAllConfirm.isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác nhận xóa tất cả ({folderDeleteAllConfirm.files.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Đăng ký tài khoản bằng tên đăng nhập và mật khẩu */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={user}
        onUserChanged={handleUserChanged}
        initialTab={authModalTab}
      />
    </div>
  );
}
