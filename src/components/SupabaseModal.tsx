import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  FolderTree,
  FileText,
  User,
  HardDrive,
  ShieldCheck,
  ArrowRight,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { api, SUPABASE_SQL_SCRIPT } from '../services/api';
import { SupabaseStatus } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onSyncSuccess,
}) => {
  const [status, setStatus] = useState<SupabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  // Custom config form state
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [inputAnonKey, setInputAnonKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSupabaseStatus();
      setStatus(data);
      if (data?.url) setInputUrl(data.url);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setSyncMessage(null);
      setIsEditingConfig(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveConfig = async () => {
    if (!inputUrl.trim() || !inputAnonKey.trim()) {
      setSyncMessage({ text: 'Vui lòng điền đầy đủ Supabase URL và API Key', success: false });
      return;
    }
    setSavingConfig(true);
    setSyncMessage(null);
    try {
      const res = await api.updateSupabaseConfig(inputUrl.trim(), inputAnonKey.trim());
      if (res.success) {
        setSyncMessage({ text: 'Đã lưu cấu hình mới thành công! Đang kiểm tra kết nối...', success: true });
        setIsEditingConfig(false);
        await fetchStatus();
      } else {
        setSyncMessage({ text: res.message || 'Lỗi khi lưu cấu hình', success: false });
      }
    } catch (err: any) {
      setSyncMessage({ text: 'Lỗi: ' + err.message, success: false });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUsePresetProject = async () => {
    setSavingConfig(true);
    setSyncMessage(null);
    try {
      const presetUrl = 'https://ceuwkkfwklxedzndsisu.supabase.co';
      const presetKey = 'sb_publishable_5nblBT8S82bUTXPp-wQwig_yRIDJXYF';
      const res = await api.updateSupabaseConfig(presetUrl, presetKey);
      if (res.success) {
        setInputUrl(presetUrl);
        setInputAnonKey(presetKey);
        setIsEditingConfig(false);
        setSyncMessage({
          text: 'Đã chuyển thành công sang máy chủ Supabase Cloud hoạt động sẵn (ceuwkkfwklxedzndsisu)!',
          success: true,
        });
        await fetchStatus();
      }
    } catch (err: any) {
      setSyncMessage({ text: 'Lỗi chuyển máy chủ: ' + err.message, success: false });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncToSupabase();
      if (res.success) {
        setSyncMessage({ text: res.message, success: true });
        await fetchStatus();
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setSyncMessage({ text: res.message, success: false });
      }
    } catch (err: any) {
      setSyncMessage({
        text: 'Lỗi đồng bộ: ' + (err.message || 'Vui lòng kiểm tra lại cấu hình Supabase'),
        success: false,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handlePullData = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.pullFromSupabase();
      if (res.success) {
        setSyncMessage({ text: res.message, success: true });
        await fetchStatus();
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setSyncMessage({ text: res.message, success: false });
      }
    } catch (err: any) {
      setSyncMessage({
        text: 'Lỗi tải dữ liệu: ' + (err.message || 'Không thể kéo dữ liệu từ Supabase'),
        success: false,
      });
    } finally {
      setSyncing(false);
    }
  };

  const isReady = status?.isFullyReady;
  const isConnected = status?.connected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1c1c1c] via-[#24292e] to-[#1a3636] text-white p-5 flex items-center justify-between border-b border-emerald-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Kết Nối Cơ Sở Dữ Liệu Supabase
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30">
                  Supabase Cloud
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Lưu trữ và đồng bộ hóa an toàn mọi giáo án, hồ sơ của Thầy Từ Văn Gọn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Connection Status Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Trạng thái kết nối:
                </span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    Đã kết nối máy chủ Supabase
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Chưa kết nối được máy chủ Supabase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingConfig(!isEditingConfig)}
                  className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-semibold px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingConfig ? 'Đóng cấu hình' : 'Sửa URL / Khóa API'}
                </button>
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Kiểm tra lại
                </button>
              </div>
            </div>

            {/* Error banner when not connected */}
            {!isConnected && status?.message && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Lỗi không thể kết nối tới máy chủ Supabase này:</p>
                    <p className="text-[11px] text-rose-800 leading-relaxed font-mono">
                      {status.message}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleUsePresetProject}
                    disabled={savingConfig}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Chuyển sang máy chủ Supabase hoạt động sẵn (ceuwkkfwklxedzndsisu)</span>
                  </button>
                  <button
                    onClick={() => setIsEditingConfig(true)}
                    className="inline-flex items-center gap-1 text-xs text-rose-700 hover:text-rose-900 underline font-semibold px-2 py-1"
                  >
                    Kiểm tra lại URL vừa nhập
                  </button>
                </div>
              </div>
            )}

            {/* Form sửa cấu hình Supabase */}
            {isEditingConfig ? (
              <div className="bg-white p-3.5 rounded-xl border border-blue-200 space-y-3">
                <div className="font-bold text-xs text-blue-900 flex items-center justify-between">
                  <span>Thay đổi cấu hình Supabase Project:</span>
                  <button
                    type="button"
                    onClick={handleUsePresetProject}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Đặt lại máy chủ mẫu đang hoạt động
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Project URL (Ví dụ: https://xxxxxxxxxxxxxxxxxxxx.supabase.co):
                    </label>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Khóa API (Anon Key / Publishable Key):
                    </label>
                    <input
                      type="text"
                      value={inputAnonKey}
                      onChange={(e) => setInputAnonKey(e.target.value)}
                      placeholder="sb_publishable_... hoặc eyJhbGciOi..."
                      className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingConfig(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={savingConfig}
                    onClick={handleSaveConfig}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingConfig ? 'Đang lưu...' : 'Lưu & Kiểm tra kết nối'}
                  </button>
                </div>
              </div>
            ) : (
              /* URL & Key details */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block mb-0.5 font-medium">Supabase Project URL:</span>
                  <span className="font-mono text-slate-800 font-semibold break-all">
                    {status?.url || 'https://pirmwzflxvlxvjqlhbhw.supabase.co'}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block mb-0.5 font-medium">Khóa API (Anon Key):</span>
                  <span className="font-mono text-emerald-700 font-semibold break-all">
                    {status?.hasAnonKey ? 'Đã nạp khóa API thành công' : 'Chưa có khóa API'}
                  </span>
                </div>
              </div>
            )}

            {/* Database Tables and Storage status */}
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Trạng thái các bảng và Storage trên Supabase:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                    status?.tables.folders
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <FolderTree className="w-3.5 h-3.5" />
                      folders
                    </span>
                    {status?.tables.folders ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <span className="text-[11px] opacity-80">
                    {status?.tables.folders ? 'Đã tạo bảng' : 'Chưa có bảng'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                    status?.tables.files
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      files
                    </span>
                    {status?.tables.files ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <span className="text-[11px] opacity-80">
                    {status?.tables.files ? 'Đã tạo bảng' : 'Chưa có bảng'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                    status?.tables.user_profile
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      user_profile
                    </span>
                    {status?.tables.user_profile ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <span className="text-[11px] opacity-80">
                    {status?.tables.user_profile ? 'Đã tạo bảng' : 'Chưa có bảng'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                    status?.storage.bucketExists
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      documents
                    </span>
                    {status?.storage.bucketExists ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <span className="text-[11px] opacity-80">
                    {status?.storage.bucketExists ? 'Storage sẵn sàng' : 'Chưa có bucket'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sync notification message */}
          {syncMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                syncMessage.success
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-100 text-rose-900 border border-rose-200'
              }`}
            >
              {syncMessage.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{syncMessage.text}</span>
            </div>
          )}

          {/* Step 1: SQL Script if tables are not fully ready */}
          {!isReady && (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      1
                    </span>
                    Khởi tạo bảng trên Supabase (Chỉ mất 10 giây)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Để Supabase nhận diện dữ liệu thư mục và file, Thầy sao chép đoạn mã SQL bên dưới, mở mục{' '}
                    <strong>SQL Editor</strong> trên Supabase và bấm <strong>Run</strong>.
                  </p>
                </div>
                {status?.url && (
                  <a
                    href={`https://supabase.com/dashboard/project/${status.url.replace('https://', '').replace('.supabase.co', '')}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap shadow-sm"
                  >
                    Mở Supabase SQL <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã sao chép mã SQL vào bộ nhớ!' : 'Sao chép đoạn mã SQL (Copy SQL)'}
                </button>

                <button
                  onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="text-xs text-slate-600 hover:text-slate-800 underline font-medium px-2 py-1"
                >
                  {showSqlPreview ? 'Ẩn mã SQL' : 'Xem trước nội dung SQL'}
                </button>
              </div>

              {showSqlPreview && (
                <div className="mt-3 bg-slate-950 text-slate-100 p-3 rounded-xl font-mono text-[11px] max-h-52 overflow-y-auto border border-slate-800">
                  <pre>{SUPABASE_SQL_SCRIPT}</pre>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Sync data bidirectional */}
          <div className="border border-slate-200 bg-white rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                {isReady ? '✓' : '2'}
              </span>
              Đồng bộ dữ liệu hai chiều với Supabase Cloud
            </h3>
            <p className="text-xs text-slate-600">
              Thầy có thể đồng bộ hai chiều linh hoạt: đẩy toàn bộ thư mục và tài liệu lên đám mây Supabase để lưu trữ an toàn, hoặc kéo toàn bộ dữ liệu từ Supabase về ứng dụng khi chuyển thiết bị.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleSyncData}
                disabled={syncing || !isConnected}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Đang đồng bộ...' : 'Đẩy dữ liệu lên Supabase (Push)'}
              </button>

              <button
                onClick={handlePullData}
                disabled={syncing || !isConnected}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowRight className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Đang tải về...' : 'Tải dữ liệu từ Supabase về máy (Pull)'}
              </button>
            </div>
          </div>

          {/* Benefits Info Box */}
          <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100 text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-blue-800">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Lợi ích khi dùng Supabase cho Thầy Từ Văn Gọn:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800/90 text-[11px] pl-1">
              <li>Lưu trữ điện toán đám mây thời gian thực (Real-time), dữ liệu không bao giờ bị mất khi đổi máy tính.</li>
              <li>Tự động sao lưu và đồng bộ khi Thầy thêm, sửa, xóa hoặc tải giáo án mới.</li>
              <li>Hỗ trợ phân quyền an toàn, tốc độ tải và xem trước tài liệu cực nhanh.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
