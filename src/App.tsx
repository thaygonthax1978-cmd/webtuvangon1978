import React, { useState, useEffect } from 'react';
import {
  FileItem,
  FolderItem,
  StatsData,
  UserProfile,
  ViewTab,
  SharedConfig,
} from './types';
import { api, formatBytes, formatDate } from './services/api';
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
import {
  FileText,
  Folder,
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
} from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // App data state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Search keyword from Header or My Files
  const [searchQuery, setSearchQuery] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load initial data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [userData, statsData, foldersData, filesData, trashData] = await Promise.all([
        api.getUser(),
        api.getStats(),
        api.getFolders(),
        api.getFiles(),
        api.getFiles({ trash: true }),
      ]);

      setUser(userData);
      setStats(statsData);
      setFolders(foldersData);
      setFiles(filesData);
      setTrashFiles(trashData);
    } catch (err) {
      console.error('Lỗi tải dữ liệu kho tài liệu:', err);
    } finally {
      setIsLoading(false);
    }
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
      await api.deleteFile(file.id, false);
      showToast(`Đã chuyển tệp "${file.name}" vào thùng rác`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreFile = async (file: FileItem) => {
    try {
      await api.restoreFile(file.id);
      showToast(`Đã khôi phục tệp "${file.name}" thành công!`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDeleteFile = async (file: FileItem) => {
    try {
      await api.deleteFile(file.id, true);
      showToast(`Đã xóa vĩnh viễn tệp "${file.name}"`);
      loadData();
    } catch (err) {
      console.error(err);
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

  const handleOpenUpload = (targetFolderId?: string) => {
    setUploadTargetFolderId(targetFolderId);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (uploaded: FileItem[]) => {
    showToast(`Đã tải lên thành công ${uploaded.length} tài liệu vào kho!`);
    loadData();
  };

  const handleCreateFolder = async (name: string, color?: string) => {
    try {
      await api.createFolder(name, null, color);
      showToast(`Đã tạo thư mục "${name}" thành công!`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      await api.updateFolder(folderId, { name: newName });
      showToast(`Đã cập nhật tên thư mục thành "${newName}"`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await api.deleteFolder(folderId);
      showToast('Đã xóa thư mục và di chuyển tệp vào thùng rác');
      loadData();
    } catch (err) {
      console.error(err);
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

  // Render current tab content
  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeDashboard
            stats={stats}
            recentFiles={files.filter((f) => !f.isDeleted)}
            onOpenFile={handleOpenFile}
            onDownloadFile={handleDownloadFile}
            onShareFile={handleShareFile}
            onDeleteFile={handleDeleteFile}
            onOpenUpload={() => handleOpenUpload()}
            onGoToTab={(tab) => setCurrentTab(tab)}
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
          displayedFiles = displayedFiles.filter((f) => f.folderId === selectedFolderId);
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

        return (
          <div className="space-y-5">
            {/* Folder / Category header bar */}
            <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {isFavoritesView
                      ? 'Tài liệu yêu thích'
                      : selectedFolderId
                      ? `Thư mục: ${currentFolderObj?.name || 'Tài liệu'}`
                      : 'Tất cả tài liệu của Thầy Gọn'}
                  </h2>
                  <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                    {displayedFiles.length} tệp
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {isFavoritesView
                    ? 'Danh sách tài liệu giảng dạy ưu tiên đánh dấu sao'
                    : 'Hệ thống tài liệu lưu trữ trên đám mây Trường TH Phường An Xuyên'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedFolderId && (
                  <button
                    onClick={() => setSelectedFolderId(null)}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    ← Tất cả thư mục
                  </button>
                )}

                <button
                  onClick={() => handleOpenUpload(selectedFolderId || undefined)}
                  className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Tải lên thư mục này</span>
                </button>
              </div>
            </div>

            {/* Quick search & filter table */}
            <FileSearch
              files={displayedFiles}
              onOpenFile={handleOpenFile}
              onDownloadFile={handleDownloadFile}
              onShareFile={handleShareFile}
              onDeleteFile={handleDeleteFile}
            />
          </div>
        );

      case 'folders':
        return (
          <FolderManager
            folders={folders}
            onSelectFolder={handleSelectFolderToView}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onOpenUpload={handleOpenUpload}
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
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4FA] flex flex-col font-sans text-slate-800">
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
        toggleMobileSimulator={() => setIsMobileSimulatorActive(!isMobileSimulatorActive)}
        isMobileSimulatorActive={isMobileSimulatorActive}
        onToggleSidebarMobile={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
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
          onOpenUpload={() => handleOpenUpload()}
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
          onClose={() => setActiveViewerFile(null)}
          onShare={handleShareFile}
          onOpenVersions={(file) => {
            setActiveViewerFile(null);
            setActiveVersionFile(file);
          }}
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
    </div>
  );
}
