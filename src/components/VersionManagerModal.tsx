import React, { useRef, useState } from 'react';
import {
  X,
  History,
  UploadCloud,
  Download,
  RotateCcw,
  Eye,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { FileItem, FileVersion } from '../types';
import { api, formatBytes, formatDate } from '../services/api';

interface VersionManagerModalProps {
  file: FileItem | null;
  onClose: () => void;
  onVersionUpdated: (updatedFile: FileItem) => void;
  onPreviewVersion?: (file: FileItem, version: FileVersion) => void;
}

export const VersionManagerModal: React.FC<VersionManagerModalProps> = ({
  file,
  onClose,
  onVersionUpdated,
  onPreviewVersion,
}) => {
  if (!file) return null;

  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const versions = file.versions || [
    {
      version: 1,
      name: file.name,
      size: file.size,
      uploadDate: file.uploadDate.split('T')[0],
      updatedBy: 'Từ Văn Gọn',
      filename: file.filename,
    },
  ];

  const handleUploadNewVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFile = e.target.files[0];
    setIsUploading(true);
    setSuccessMessage('');

    try {
      const updated = await api.uploadNewVersion(file.id, newFile);
      setSuccessMessage(`Đã cập nhật thành công lên phiên bản v${updated.versions.length}!`);
      onVersionUpdated(updated);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadVersion = (v: FileVersion) => {
    window.location.href = api.getDownloadUrl(file.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0866E8] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-200" />
            <h3 className="text-base font-bold">Quản lý phiên bản tài liệu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Overview Bar matching Mockup #5 */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm md:text-base">{file.name}</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                <span>Kích thước: <b>{formatBytes(file.size)}</b></span>
                <span>•</span>
                <span>Ngày tải lên: <b>{formatDate(file.uploadDate)}</b></span>
                <span>•</span>
                <span>Thư mục: <b>{file.folderName}</b></span>
                <span>•</span>
                <span className="text-blue-600 font-bold">Số phiên bản: {versions.length}</span>
              </div>
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadNewVersion}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-[#0866E8] hover:bg-[#064AA8] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Đang tải...' : 'Tải phiên bản mới'}</span>
            </button>
          </div>
        </div>

        {/* Success message banner */}
        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Version History Table */}
        <div className="p-5">
          <h5 className="font-bold text-slate-800 text-xs mb-3 uppercase tracking-wider">
            Lịch sử phiên bản
          </h5>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Phiên bản</th>
                  <th className="py-2.5 px-3">Ngày cập nhật</th>
                  <th className="py-2.5 px-3">Kích thước</th>
                  <th className="py-2.5 px-3">Người cập nhật</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {versions.map((ver, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs">
                        v{ver.version}
                      </span>
                      {idx === 0 && (
                        <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.2 rounded">
                          Hiện tại
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {ver.uploadDate}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {formatBytes(ver.size)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {ver.updatedBy || 'Từ Văn Gọn'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownloadVersion(ver)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Tải về phiên bản này"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
