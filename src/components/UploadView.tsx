import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { FolderItem, UploadQueueItem, FileItem } from '../types';
import { formatBytes } from '../services/api';

interface UploadViewProps {
  folders: FolderItem[];
  defaultFolderId?: string;
  onUploadSuccess: (files: FileItem[]) => void;
  onClose?: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({
  folders,
  defaultFolderId,
  onUploadSuccess,
  onClose,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState(defaultFolderId || (folders[0]?.id || 'f_01'));
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([
    // Provide realistic upload queue demo matching the screenshot (3 items) if empty
    {
      id: 'demo_1',
      file: new (window as any).File(['demo'], 'Giáo án Toán lớp 1.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
      name: 'Giáo án Toán lớp 1.docx',
      size: 2.4 * 1024 * 1024,
      progress: 100,
      status: 'completed',
    },
    {
      id: 'demo_2',
      file: new (window as any).File(['demo'], 'Bài giảng.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }),
      name: 'Bài giảng.pptx',
      size: 12.5 * 1024 * 1024,
      progress: 65,
      status: 'uploading',
    },
    {
      id: 'demo_3',
      file: new (window as any).File(['demo'], 'Video tiết dạy.mp4', { type: 'video/mp4' }),
      name: 'Video tiết dạy.mp4',
      size: 450 * 1024 * 1024,
      progress: 28,
      status: 'uploading',
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
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
    }));

    setQueue((prev) => [...prev, ...newItems]);
    // Automatically start uploading the new items
    uploadItems(newItems);
  };

  const uploadItems = async (items: UploadQueueItem[]) => {
    for (const item of items) {
      // Set status to uploading
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q))
      );

      const formData = new FormData();
      formData.append('files', item.file);
      formData.append('folderId', selectedFolderId);

      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: pct } : q))
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: 100, status: 'completed' } : q))
            );
            if (data.files) {
              onUploadSuccess(data.files);
            }
          } else {
            setQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMessage: 'Lỗi tải lên' } : q))
            );
          }
        };

        xhr.onerror = () => {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMessage: 'Lỗi kết nối' } : q))
          );
        };

        xhr.send(formData);
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error', errorMessage: 'Không thể tải tệp' } : q))
        );
      }
    }
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
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            Lưu vào thư mục:
          </span>
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer relative ${
          isDragging
            ? 'border-blue-600 bg-blue-50 scale-[1.01]'
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

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h3 className="text-base md:text-lg font-bold text-slate-900 mb-1">
              Kéo thả tệp vào đây
            </h3>
            <p className="text-xs text-slate-500">
              hoặc nhấn nút bên dưới để chọn tệp từ máy tính, laptop hoặc điện thoại
            </p>
          </div>

          <button
            type="button"
            className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all inline-flex items-center gap-2"
          >
            <span>📁 Chọn tệp từ máy tính</span>
          </button>

          <div className="pt-2 text-[11px] text-slate-500 space-y-1">
            <p className="font-medium text-slate-600">
              Hỗ trợ: PDF, Word, Excel, PowerPoint, Ảnh, Video, ZIP, TXT, MD...
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
          </div>

          {queue.length > 0 && (
            <button
              onClick={clearCompleted}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1"
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
                    <p className="text-xs font-bold text-slate-800 truncate pr-2">
                      {item.name}
                    </p>
                    <span className="text-[11px] text-slate-500 font-medium shrink-0">
                      {formatBytes(item.size)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex items-center">
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
                    <XCircle className="w-5 h-5 text-rose-500" />
                  ) : (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded"
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
