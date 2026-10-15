import React, { useState } from 'react';
import {
  X,
  Share2,
  Mail,
  Link,
  Copy,
  CheckCircle,
  Lock,
  Clock,
  Shield,
  Send,
  Eye,
  Edit3,
} from 'lucide-react';
import { FileItem, SharedConfig } from '../types';
import { api } from '../services/api';

interface ShareModalProps {
  file: FileItem | null;
  onClose: () => void;
  onShareUpdated?: (updatedConfig: SharedConfig) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  file,
  onClose,
  onShareUpdated,
}) => {
  if (!file) return null;

  const [emailInput, setEmailInput] = useState('');
  const [accessRole, setAccessRole] = useState<'viewer' | 'editor'>('viewer');
  const [hasPassword, setHasPassword] = useState(Boolean(file.shareConfig?.hasPassword));
  const [password, setPassword] = useState(file.shareConfig?.password || 'Thaygon2026');
  const [expiresInDays, setExpiresInDays] = useState<number>(file.shareConfig?.expiresInDays || 7);

  const [shareLink, setShareLink] = useState(
    file.shareConfig?.shareUrl || `https://khotailieu.thaygon.vn/s/g-${file.id.substring(0, 8)}`
  );
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      const config = await api.shareFile(file.id, {
        email: emailInput.trim(),
        accessRole,
        hasPassword,
        password: hasPassword ? password : '',
        expiresInDays,
      });

      setStatusMessage(`Đã gửi lời mời chia sẻ tới ${emailInput.trim()}!`);
      setEmailInput('');
      if (onShareUpdated) onShareUpdated(config);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const config = await api.shareFile(file.id, {
        accessRole,
        hasPassword,
        password: hasPassword ? password : '',
        expiresInDays,
      });
      setShareLink(config.shareUrl || shareLink);
      setStatusMessage('Đã tạo liên kết chia sẻ bảo mật thành công!');
      if (onShareUpdated) onShareUpdated(config);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0866E8] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-200" />
            <h3 className="text-sm md:text-base font-bold truncate max-w-sm">
              Chia sẻ: {file.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status feedback */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Section 1: Chia sẻ cho người khác qua Email */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Chia sẻ cho đồng nghiệp hoặc phụ huynh
            </h4>

            <form onSubmit={handleSendEmail} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Nhập email người nhận (ví dụ: bgh.anxuyen@gmail.com)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={accessRole}
                onChange={(e: any) => setAccessRole(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="viewer">Người xem</option>
                <option value="editor">Người sửa</option>
              </select>

              <button
                type="submit"
                className="bg-[#0866E8] hover:bg-[#064AA8] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </form>
          </div>

          {/* Section 2: Tạo liên kết chia sẻ */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Tạo liên kết chia sẻ trực tuyến
              </h4>
              <button
                type="button"
                onClick={handleGenerateLink}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Làm mới liên kết
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Link className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {/* Security Options matching Mockup #8 */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3 text-xs">
              {/* Password protection */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasPassword}
                    onChange={(e) => setHasPassword(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Đặt mật khẩu cho liên kết
                  </span>
                </label>

                {hasPassword && (
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu truy cập"
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white w-32 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                )}
              </div>

              {/* Expiration time */}
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Thời hạn liên kết
                </span>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  <option value={1}>1 ngày</option>
                  <option value={7}>7 ngày (Khuyên dùng)</option>
                  <option value={30}>30 ngày</option>
                  <option value={0}>Không thời hạn</option>
                </select>
              </div>
            </div>
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
