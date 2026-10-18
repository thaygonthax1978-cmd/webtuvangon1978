import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  UploadCloud,
  File,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCw,
  Trash2,
  Folder,
  AlertCircle,
  ShieldCheck,
  FolderUp,
} from 'lucide-react';
import { FolderItem, UploadQueueItem, FileItem } from '../types';
import { api, formatBytes, buildFolderTreeOptions } from '../services/api';

interface UploadViewProps {
  folders: FolderItem[];
  defaultFolderId?: string;
  defaultMode?: 'file' | 'folder';
  onUploadSuccess: (files: FileItem[]) => void;
  onFoldersCreated?: () => void;
  onClose?: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  folders,
  defaultFolderId,
  defaultMode = 'file',
  onUploadSuccess,
  onFoldersCreated,
  onClose,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState(
    defaultFolderId || (folders[0]?.id || 'f_01')
  );
  const [uploadMode, setUploadMode] = useState<'file' | 'folder'>(defaultMode);
  const [isCreatingFolders, setIsCreatingFolders] = useState(false);
  const [folderCreationStatus, setFolderCreationStatus] = useState<string>('');

  useEffect(() => {
    if (defaultFolderId) {
      setSelectedFolderId(defaultFolderId);
    }
  }, [defaultFolderId]);

  useEffect(() => {
    if (defaultMode) {
      setUploadMode(defaultMode);
    }
  }, [defaultMode]);

  const folderOptions = useMemo(() => buildFolderTreeOptions(folders), [folders]);
  const currentTargetFolder = useMemo(
    () => folders.find((f) => f.id === selectedFolderId),
    [folders, selectedFolderId]
  );

  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Support dropping folder items
    const items = e.dataTransfer.items;
    if (items && items.length > 0 && (items[0] as any).webkitGetAsEntry) {
      const extractedFiles: File[] = [];

      const traverseEntry = async (entry: any, pathStr = ''): Promise<void> => {
        if (entry.isFile) {
          return new Promise<void>((resolve) => {
            entry.file((file: File) => {
              const rel = pathStr ? `${pathStr}/${file.name}` : file.name;
              Object.defineProperty(file, 'webkitRelativePath', {
                value: rel,
                writable: true,
              });
              extractedFiles.push(file);
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const readEntries = (): Promise<any[]> => {
            return new Promise((resolve) => {
              dirReader.readEntries((entries: any[]) => resolve(entries));
            });
          };

          let dirEntries = await readEntries();
          while (dirEntries.length > 0) {
            for (const subEntry of dirEntries) {
              await traverseEntry(subEntry, pathStr ? `${pathStr}/${entry.name}` : entry.name);
            }
            dirEntries = await readEntries();
          }
        }
      };

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry = (item as any).webkitGetAsEntry();
        if (entry) {
          await traverseEntry(entry);
        }
      }

      if (extractedFiles.length > 0) {
        const hasFolderStructure = extractedFiles.some(
          (f) => (f as any).webkitRelativePath && (f as any).webkitRelativePath.includes('/')
        );
        if (hasFolderStructure) {
          await addFolderFilesToQueue(extractedFiles);
        } else {
          addFilesToQueue(extractedFiles);
        }
        return;
      }
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await addFolderFilesToQueue(files);
      e.target.value = '';
    }
  };

  const addFilesToQueue = (files: File[]) => {
    const newItems: UploadQueueItem[] = files.map((file) => ({
      id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'pending',
      targetFolderId: selectedFolderId,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    uploadSequential(newItems, selectedFolderId);
  };

  // Logic to parse folder structure, create missing folders on server, and queue files
  const addFolderFilesToQueue = async (files: File[]) => {
    try {
      setIsCreatingFolders(true);
      setFolderCreationStatus('Đang đọc cấu trúc thư mục...');

      const folderPathToId: Record<string, string> = {
        '': selectedFolderId,
      };

      let newlyCreated = false;
      const allFolderPaths = new Set<string>();

      files.forEach((file) => {
        const relPath = (file as any).webkitRelativePath || file.name;
        const parts = relPath.split('/');
        parts.pop(); // remove filename
        let current = '';
        for (const part of parts) {
          current = current ? `${current}/${part}` : part;
          allFolderPaths.add(current);
        }
      });

      // Sort paths by depth (shallowest first)
      const sortedPaths = Array.from(allFolderPaths).sort(
        (a, b) => a.split('/').length - b.split('/').length
      );

      let currentFolders = [...folders];

      for (const pathStr of sortedPaths) {
        const parts = pathStr.split('/');
        const folderName = parts[parts.length - 1];
        const parentPath = parts.slice(0, parts.length - 1).join('/');
        const parentId = folderPathToId[parentPath] || selectedFolderId;

        const existing = currentFolders.find(
          (f) =>
            f.name.trim().toLowerCase() === folderName.trim().toLowerCase() &&
            (f.parentId || null) === (parentId || null)
        );

        if (existing) {
          folderPathToId[pathStr] = existing.id;
        } else {
          setFolderCreationStatus(`Đang tạo thư mục "${folderName}" trên hệ thống...`);
          try {
            const created = await api.createFolder(folderName, parentId, '#0866E8');
            folderPathToId[pathStr] = created.id;
            currentFolders.push(created);
            newlyCreated = true;
          } catch (err) {
            console.error('Lỗi tạo thư mục:', err);
            folderPathToId[pathStr] = parentId;
          }
        }
      }

      if (newlyCreated && onFoldersCreated) {
        onFoldersCreated();
      }

      const newItems: UploadQueueItem[] = files.map((file) => {
        const relPath = (file as any).webkitRelativePath || file.name;
        const parts = relPath.split('/');
        parts.pop();
        const folderPath = parts.join('/');
        const targetFolder = folderPathToId[folderPath] || selectedFolderId;

        return {
          id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          name: file.name,
          size: file.size,
          progress: 0,
          status: 'pending',
          targetFolderId: targetFolder,
          relativePath: relPath,
        };
      });

      setQueue((prev) => [...prev, ...newItems]);
      uploadSequential(newItems, selectedFolderId);
    } catch (err) {
      console.error('Lỗi xử lý thư mục tải lên:', err);
      // Fallback: upload directly to selectedFolderId
      addFilesToQueue(files);
    } finally {
      setIsCreatingFolders(false);
      setFolderCreationStatus('');
    }
  };

  const uploadViaChunks = (
    item: UploadQueueItem,
    targetFolderId: string,
    resolve: (files: FileItem[]) => void,
    reject: (err: any) => void
  ) => {
    const file = item.file;
    if (!file) {
      reject(new Error('Tệp không hợp lệ'));
      return;
    }

    const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB per chunk (safely under Cloud Run 32MB limit)
    const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
    const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    let currentChunk = 0;

    const uploadNextChunk = (retryCount = 0) => {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunkBlob, item.name);
      formData.append('uploadId', uploadId);
      formData.append('chunkIndex', String(currentChunk));
      formData.append('totalChunks', String(totalChunks));
      formData.append('filename', item.name);
      formData.append('fileSize', String(file.size));
      formData.append('mimeType', file.type || 'application/octet-stream');
      formData.append('folderId', targetFolderId);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-chunk', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const currentUploaded = start + e.loaded;
          const pct = Math.min(99, Math.round((currentUploaded / file.size) * 100));
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress: pct, status: 'uploading' } : q))
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.isComplete) {
              setQueue((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q))
              );
              resolve(res.files || []);
            } else {
              currentChunk++;
              uploadNextChunk(0);
            }
          } catch (e) {
            handleError(new Error('Phản hồi từ máy chủ không hợp lệ'));
          }
        } else {
          try {
            const errJson = JSON.parse(xhr.responseText);
            handleError(new Error(errJson.message || `Lỗi tải tệp (${xhr.status})`));
          } catch {
            handleError(new Error(`Lỗi tải tệp (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => {
        if (retryCount < 2) {
          setTimeout(() => uploadNextChunk(retryCount + 1), 1000);
        } else {
          handleError(new Error('Lỗi kết nối mạng khi tải tệp'));
        }
      };

      const handleError = (err: Error) => {
        if (retryCount < 2) {
          setTimeout(() => uploadNextChunk(retryCount + 1), 1000);
        } else {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMessage: err.message } : q))
          );
          reject(err);
        }
      };

      xhr.send(formData);
    };

    uploadNextChunk(0);
  };

  const uploadSingleItem = (item: UploadQueueItem, targetFolderId: string): Promise<FileItem[]> => {
    return new Promise((resolve, reject) => {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 5, errorMessage: undefined } : q))
      );

      // Primary strategy: Chunked upload (handles files of any size smoothly, byte-level progress, bypasses proxy limits)
      uploadViaChunks(item, targetFolderId, resolve, (chunkErr) => {
        console.warn('Chunk upload failed, attempting fallback to multipart upload:', chunkErr);
        // Fallback: standard FormData upload
        const formData = new FormData();
        formData.append('files', item.file);
        formData.append('folderId', targetFolderId);

        fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.message || (res.status === 413 ? 'Tệp vượt quá giới hạn dung lượng tải lên' : 'Lỗi tải tệp'));
            }
            return res.json();
          })
          .then((data) => {
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q))
            );
            resolve(data.files || []);
          })
          .catch((err: any) => {
            const errorMsg = err.message || 'Lỗi đường truyền mạng';
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMessage: errorMsg } : q))
            );
            reject(err);
          });
      });
    });
  };

  const uploadSequential = async (items: UploadQueueItem[], targetFolderId: string) => {
    setIsUploading(true);
    for (const item of items) {
      try {
        const destFolderId = item.targetFolderId || targetFolderId;
        const uploadedFiles = await uploadSingleItem(item, destFolderId);
        if (uploadedFiles && uploadedFiles.length > 0) {
          onUploadSuccess(uploadedFiles);
        }
      } catch (err) {
        console.error('Upload error for item:', item.name, err);
        // Continue uploading remaining files even if one fails
      }
    }
    setIsUploading(false);
  };

  const handleRetryItem = (item: UploadQueueItem) => {
    uploadSequential([item], selectedFolderId);
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const clearCompleted = () => {
    setQueue((prev) => prev.filter((q) => q.status !== 'completed'));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Selection */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <span>Tải tài liệu lên đám mây</span>
          </h2>
          <p className="text-xs text-slate-500">
            Lưu trữ trực tiếp vào kho dữ liệu cá nhân của Thầy Từ Văn Gọn
          </p>
        </div>

        {/* Target Folder Selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            Lưu vào thư mục:
          </span>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm text-xs cursor-pointer"
          >
            {folderOptions.map((opt) => (
              <option
                key={opt.id}
                value={opt.id}
                className={opt.depth === 0 ? 'font-bold text-slate-900 bg-slate-100' : 'text-slate-700'}
              >
                {opt.depth === 0 ? `📁 ${opt.label}` : opt.label}
              </option>
            ))}
          </select>

          {currentTargetFolder && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              Đang chọn: <strong>{currentTargetFolder.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Toggle Mode: Tải tệp lên vs Tải thư mục lên */}
      <div className="flex items-center justify-center">
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              uploadMode === 'file'
                ? 'bg-[#0866E8] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Tải tệp lên</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('folder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              uploadMode === 'folder'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Tải thư mục lên</span>
          </button>
        </div>
      </div>

      {isCreatingFolders && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-2xl flex items-center gap-3 animate-pulse text-xs font-bold">
          <RotateCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
          <span>{folderCreationStatus || 'Đang tạo thư mục trên hệ thống...'}</span>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (uploadMode === 'folder') {
            folderInputRef.current?.click();
          } else {
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer relative ${
          isDragging
            ? uploadMode === 'folder'
              ? 'border-indigo-600 bg-indigo-50 scale-[1.01]'
              : 'border-blue-600 bg-blue-50 scale-[1.01]'
            : uploadMode === 'folder'
            ? 'border-indigo-300 bg-gradient-to-b from-indigo-50/60 to-white hover:border-indigo-500 hover:shadow-md'
            : 'border-blue-300 bg-gradient-to-b from-[#EAF4FF] to-white hover:border-blue-500 hover:shadow-md'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderInputChange}
          multiple
          {...({ webkitdirectory: '', directory: '' } as any)}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-4">
          <div
            className={`w-20 h-20 mx-auto rounded-3xl text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform ${
              uploadMode === 'folder'
                ? 'bg-indigo-600 shadow-indigo-500/30'
                : 'bg-blue-600 shadow-blue-500/30'
            }`}
          >
            {uploadMode === 'folder' ? (
              <FolderUp className="w-10 h-10 animate-bounce" />
            ) : (
              <UploadCloud className="w-10 h-10 animate-bounce" />
            )}
          </div>

          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1">
              {uploadMode === 'folder'
                ? 'Kéo thả thư mục vào đây hoặc bấm để chọn'
                : 'Kéo thả tệp vào đây hoặc bấm để chọn'}
            </h3>
            <p className="text-xs text-slate-500">
              {uploadMode === 'folder'
                ? 'Chọn cả thư mục từ máy tính — Hệ thống sẽ tự động tạo thư mục và tải toàn bộ tệp bên trong lên'
                : 'hoặc nhấn nút bên dưới để chọn tệp từ máy tính, laptop hoặc điện thoại'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Chọn tệp từ máy tính</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                folderInputRef.current?.click();
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <FolderUp className="w-4 h-4" />
              <span>Chọn cả thư mục từ máy tính</span>
            </button>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 space-y-1">
            <p className="font-medium text-slate-600">
              {uploadMode === 'folder'
                ? '📁 Hỗ trợ tải thư mục chứa nhiều tệp Word, PowerPoint, PDF, hình ảnh cùng lúc'
                : 'Hỗ trợ: PDF, Word, Excel, PowerPoint, Ảnh, Video, ZIP, TXT, MD...'}
            </p>
            <p className="text-slate-400">Dung lượng tối đa mỗi tệp: 2 GB • Tự động mã hóa an toàn</p>
          </div>
        </div>
      </div>

      {/* Upload Queue Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Danh sách tệp đang tải lên ({queue.length})
            </h3>
            {queue.some((q) => q.status === 'completed') && (
              <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                Đã xong {queue.filter((q) => q.status === 'completed').length} tệp
              </span>
            )}
            {isUploading && (
              <span className="text-[11px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                Đang xử lý tải lên...
              </span>
            )}
          </div>

          {queue.length > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa tệp đã hoàn thành
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {queue.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Chưa có tệp nào trong hàng đợi tải lên.
            </div>
          ) : (
            queue.map((item) => (
              <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <File className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {item.name}
                      </p>
                      {item.relativePath && item.relativePath.includes('/') && (
                        <p className="text-[10px] text-indigo-600 font-medium flex items-center gap-1 truncate">
                          <Folder className="w-3 h-3 shrink-0" />
                          <span>Thư mục: {item.relativePath}</span>
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">
                      {formatBytes(item.size)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex items-center mb-1">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === 'completed'
                          ? 'bg-emerald-500'
                          : item.status === 'error'
                          ? 'bg-rose-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  {item.status === 'error' && item.errorMessage && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{item.errorMessage}</span>
                    </p>
                  )}
                </div>

                {/* Progress Status and Action Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-bold min-w-[42px] text-right ${
                      item.status === 'completed'
                        ? 'text-emerald-600'
                        : item.status === 'error'
                        ? 'text-rose-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {item.progress}%
                  </span>

                  {item.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  ) : item.status === 'error' ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRetryItem(item)}
                        className="p-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        title="Thử tải lại tệp này"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Thử lại</span>
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                        title="Xóa tệp lỗi"
                      >
                        <XCircle className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                      title="Hủy tải lên"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
