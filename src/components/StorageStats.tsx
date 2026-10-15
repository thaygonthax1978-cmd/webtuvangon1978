import React from 'react';
import {
  HardDrive,
  FileCode,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image,
  Video,
  File,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  CloudLightning,
} from 'lucide-react';
import { StatsData } from '../types';
import { formatBytes } from '../services/api';

interface StorageStatsProps {
  stats: StatsData | null;
}

export const StorageStats: React.FC<StorageStatsProps> = ({ stats }) => {
  const usedBytes = stats?.totalStorageBytes || 38.6 * 1024 * 1024 * 1024;
  const maxBytes = stats?.maxStorageBytes || 100 * 1024 * 1024 * 1024;
  const usedPercent = stats?.usedPercentage || 38.6;
  const remainingBytes = Math.max(0, maxBytes - usedBytes);
  const totalDocs = stats?.totalDocuments || 1256;

  // Breakdown data matching Mockup #9
  const barData = [
    { label: 'PDF', size: '14.2 GB', height: 95, color: '#F04444', icon: FileCode },
    { label: 'Word', size: '6.8 GB', height: 48, color: '#0866E8', icon: FileText },
    { label: 'Excel', size: '2.6 GB', height: 22, color: '#16B875', icon: FileSpreadsheet },
    { label: 'PowerPoint', size: '2.1 GB', height: 18, color: '#FF9F1C', icon: Presentation },
    { label: 'Hình ảnh', size: '9.8 GB', height: 70, color: '#8257E5', icon: Image },
    { label: 'Video', size: '3.9 GB', height: 30, color: '#38BDF8', icon: Video },
    { label: 'Khác', size: '1.2 GB', height: 12, color: '#94A3B8', icon: File },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <span>Thống kê dung lượng lưu trữ đám mây</span>
          </h2>
          <p className="text-xs text-slate-500">
            Giám sát mức tiêu hao tài nguyên và tối ưu hóa không gian lưu trữ cho giáo viên
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Hệ thống bảo vệ lưu trữ hoạt động bình thường</span>
        </div>
      </div>

      {/* Main Chart Box matching Mockup #9 */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-900">
            Thống kê dung lượng theo loại tệp
          </h3>
          <span className="text-xs text-slate-500 font-medium">Đơn vị: Gigabytes (GB)</span>
        </div>

        {/* Bar Chart Visualization */}
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-6 pt-8 pb-4 border-b border-slate-200 px-2 sm:px-6">
          {barData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[11px] font-bold text-slate-700 mb-1.5 opacity-90 group-hover:scale-110 transition-transform whitespace-nowrap">
                  {item.size}
                </span>

                {/* Animated bar */}
                <div className="w-full max-w-[50px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-t-xl transition-all duration-700 group-hover:brightness-110 shadow-xs"
                    style={{
                      height: `${item.height}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white mb-1 shadow-2xs"
                    style={{ backgroundColor: item.color }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 truncate max-w-[65px] text-center">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Quota Overview matching Mockup #9 */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                Dung lượng lưu trữ: Đã dùng {formatBytes(usedBytes)} / {formatBytes(maxBytes)} ({usedPercent}%)
              </span>
              <span className="text-emerald-600 font-extrabold">{formatBytes(remainingBytes)} còn lại</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
              <span>0 GB</span>
              <span>25 GB</span>
              <span>50 GB</span>
              <span>75 GB</span>
              <span>100 GB (Tối đa)</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">
                Tổng tài liệu lưu trữ
              </span>
              <p className="text-2xl font-extrabold text-blue-900 mt-0.5">
                {totalDocs.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-blue-600">tệp</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
