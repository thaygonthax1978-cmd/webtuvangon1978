import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  File,
  CheckCircle,
  Folder,
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../services/api';

interface TrashBinProps {
  trashFiles: FileItem[];
  onRestore: (file: FileItem) => Promise<void>;
  onPermanentDelete: (file: FileItem) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
}

export const TrashBin: React.FC<TrashBinProps> = ({
  trashFiles,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleRestore = async (file: FileItem) => {
    await onRestore(file);
    setSuccessMsg(`Đã khôi phục tài liệu "${file.name}" về thư mục ban đầu!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handlePermanentDelete = async (file: FileItem) => {
    await onPermanentDelete(file);
    setSuccessMsg(`Đã xóa vĩnh viễn tài liệu "${file.name}"!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEmptyAll = async () => {
    await onEmptyTrash();
    setConfirmEmpty(false);
    setSuccessMsg('Đã dọn sạch tất cả tệp trong thùng rác!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>Thùng rác ({trashFiles.length})</span>
          </h2>
          <p className="text-xs text-slate-500">
            Các tệp trong thùng rác được giữ nguyên vẹn để Thầy Gọn có thể khôi phục lại bất kỳ lúc nào
          </p>
        </div>

        {trashFiles.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setConfirmEmpty(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3.5 py-2 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Dọn sạch thùng rác</span>
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận dọn sạch thùng rác</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Hành động này sẽ xóa vĩnh viễn toàn bộ {trashFiles.length} tệp trong thùng rác khỏi hệ thống lưu trữ. Bạn có chắc chắn muốn tiếp tục?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmEmpty(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleEmptyAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trash Files Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tên tài liệu</th>
                <th className="py-3 px-3">Thư mục gốc</th>
                <th className="py-3 px-3">Dung lượng</th>
                <th className="py-3 px-3">Ngày xóa</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {trashFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Thùng rác hiện đang trống. Chưa có tài liệu nào bị xóa!
                  </td>
                </tr>
              ) : (
                trashFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                          <File className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="font-bold text-slate-900 truncate max-w-xs md:max-w-md">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <Folder className="w-3 h-3 text-amber-500" />
                        {file.folderName}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{formatBytes(file.size)}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {file.deletedAt ? formatDate(file.deletedAt) : formatDate(file.updatedDate)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(file)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Khôi phục tệp"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(file)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa vĩnh viễn"
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
