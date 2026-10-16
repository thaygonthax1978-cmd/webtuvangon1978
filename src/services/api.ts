import { FileItem, FolderItem, StatsData, UserProfile, SharedConfig, SupabaseStatus } from '../types';

export const localStore = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(`thaygon_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set(key: string, val: any): void {
    try {
      localStorage.setItem(`thaygon_${key}`, JSON.stringify(val));
    } catch (e) {
      // quota or private browsing
    }
  },
};

export const api = {
  async getUser(): Promise<UserProfile> {
    try {
      const res = await fetch('/api/user');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStore.set('user', data.user);
          return data.user;
        }
      }
    } catch (e) {
      console.warn('API getUser fallback:', e);
    }
    return localStore.get('user', {
      id: 'user_gon_01',
      fullName: 'TỪ VĂN GỌN',
      role: 'Giáo viên tiểu học',
      school: 'Trường Tiểu học Phường An Xuyên',
      location: 'Cà Mau',
      email: 'thaygonthax1978@gmail.com',
      phone: '0918.452.889',
      storageUsedBytes: 41446434406,
      storageMaxBytes: 107374182400,
      avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      twoFactorEnabled: true,
      lastLogin: new Date().toISOString(),
    });
  },

  async updateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/user', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (data.user) localStore.set('user', data.user);
    return data.user;
  },

  async getStats(): Promise<StatsData> {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          localStore.set('stats', data.stats);
          return data.stats;
        }
      }
    } catch (e) {
      console.warn('API getStats fallback:', e);
    }
    return localStore.get('stats', {
      totalDocuments: 10,
      totalStorageBytes: 34800000,
      maxStorageBytes: 107374182400,
      usedPercentage: 0.1,
      counts: { word: 10, pdf: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 },
      sizes: { word: 34800000, pdf: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 },
      percentages: { word: 100, pdf: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 },
      totalFolders: 11,
      trashCount: 1,
    });
  },

  async getFolders(): Promise<FolderItem[]> {
    try {
      const res = await fetch('/api/folders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.folders) && data.folders.length > 0) {
          localStore.set('folders', data.folders);
          return data.folders;
        }
      }
    } catch (e) {
      console.warn('API getFolders fallback:', e);
    }

    const cached = localStore.get<FolderItem[]>('folders', []);
    if (cached && cached.length > 0) return cached;

    // Auto-restore seed if completely empty
    try {
      const restoreRes = await fetch('/api/database/restore', { method: 'POST' });
      const restoreData = await restoreRes.json();
      if (restoreData.folders && restoreData.folders.length > 0) {
        localStore.set('folders', restoreData.folders);
        return restoreData.folders;
      }
    } catch {}

    return cached;
  },

  async restoreDatabase(): Promise<{ success: boolean; message: string; folders: FolderItem[]; files: FileItem[] }> {
    const res = await fetch('/api/database/restore', { method: 'POST' });
    const data = await res.json();
    if (data.folders) localStore.set('folders', data.folders);
    if (data.files) localStore.set('files_all', data.files);
    return data;
  },

  async createFolder(name: string, parentId?: string | null, color?: string): Promise<FolderItem> {
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId, color }),
    });
    const data = await res.json();
    return data.folder;
  },

  async updateFolder(id: string, update: { name?: string; color?: string; parentId?: string | null }): Promise<FolderItem> {
    const res = await fetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    return data.folder;
  },

  async deleteFolder(id: string): Promise<void> {
    await fetch(`/api/folders/${id}`, { method: 'DELETE' });
  },

  async getFiles(params?: {
    folderId?: string;
    category?: string;
    search?: string;
    favorite?: boolean;
    trash?: boolean;
  }): Promise<FileItem[]> {
    const query = new URLSearchParams();
    if (params?.folderId) query.set('folderId', params.folderId);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.favorite) query.set('favorite', 'true');
    if (params?.trash) query.set('trash', 'true');

    try {
      const res = await fetch(`/api/files?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const files = data.files || [];
        if (!params || Object.keys(params).length === 0) {
          localStore.set('files_all', files);
        } else if (params.trash) {
          localStore.set('trash_files', files);
        }
        return files;
      }
    } catch (e) {
      console.warn('API getFiles fallback:', e);
    }

    if (params?.trash) {
      return localStore.get<FileItem[]>('trash_files', []);
    }
    const all = localStore.get<FileItem[]>('files_all', []);
    let filtered = all.filter((f) => !f.isDeleted);
    if (params?.folderId) {
      filtered = filtered.filter((f) => f.folderId === params.folderId);
    }
    if (params?.favorite) {
      filtered = filtered.filter((f) => f.isFavorite);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(q));
    }
    return filtered;
  },

  async getFile(id: string): Promise<FileItem> {
    const res = await fetch(`/api/files/${id}`);
    const data = await res.json();
    return data.file;
  },

  async uploadFiles(
    files: File[],
    folderId: string,
    onProgress?: (percent: number) => void
  ): Promise<FileItem[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('folderId', folderId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.files || []);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(xhr.statusText || 'Lỗi tải lên'));
        }
      };

      xhr.onerror = () => reject(new Error('Mạng bị lỗi'));
      xhr.send(formData);
    });
  },

  async updateFile(id: string, data: { name?: string; isFavorite?: boolean; folderId?: string }): Promise<FileItem> {
    const res = await fetch(`/api/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    return resData.file;
  },

  async deleteFile(id: string, permanent: boolean = false): Promise<void> {
    await fetch(`/api/files/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  async batchDeleteFiles(options: {
    ids?: string[];
    folderId?: string;
    all?: boolean;
    permanent?: boolean;
  }): Promise<{ success: boolean; count: number; message: string }> {
    const res = await fetch('/api/files/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return res.json();
  },

  async batchRestoreFiles(options: {
    ids?: string[];
    all?: boolean;
  }): Promise<{ success: boolean; count: number; message: string }> {
    const res = await fetch('/api/files/batch-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return res.json();
  },

  async restoreFile(id: string): Promise<FileItem> {
    const res = await fetch(`/api/files/${id}/restore`, { method: 'POST' });
    const data = await res.json();
    return data.file;
  },

  async emptyTrash(): Promise<void> {
    await fetch('/api/trash/empty', { method: 'DELETE' });
  },

  async reorderFile(id: string, position: 'start' | 'end'): Promise<void> {
    await fetch(`/api/files/${id}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position }),
    });
  },

  async uploadNewVersion(fileId: string, file: File): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`/api/files/${fileId}/version`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.file;
  },

  async shareFile(fileId: string, shareData: Partial<SharedConfig>): Promise<SharedConfig> {
    const res = await fetch(`/api/files/${fileId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shareData),
    });
    const data = await res.json();
    return data.shareConfig;
  },

  async chatAI(message: string, fileContextId?: string, actionType?: string): Promise<string> {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, fileContextId, actionType }),
    });
    const data = await res.json();
    return data.reply;
  },

  async analyzeFileAI(fileId: string): Promise<string> {
    const res = await fetch('/api/ai/analyze-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
    });
    const data = await res.json();
    return data.analysis;
  },

  getDownloadUrl(fileId: string): string {
    return `/api/files/${fileId}/download`;
  },

  async getSupabaseStatus(): Promise<SupabaseStatus> {
    try {
      const res = await fetch('/api/supabase/status');
      const data = await res.json();
      return data.status;
    } catch (e: any) {
      return {
        connected: false,
        url: 'https://ceuwkkfwklxedzndsisu.supabase.co',
        hasAnonKey: true,
        tables: { folders: false, files: false, user_profile: false },
        storage: { bucketExists: false },
        isFullyReady: false,
        message: 'Không thể kết nối đến máy chủ: ' + e.message,
      };
    }
  },

  async syncToSupabase(): Promise<{ success: boolean; message: string; syncedFolders?: number; syncedFiles?: number }> {
    const res = await fetch('/api/supabase/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};

export const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- KHO DỮ LIỆU CÁ NHÂN THẦY TỪ VĂN GỌN - SUPABASE DATABASE INITIALIZATION SCRIPT
-- Dán đoạn mã này vào Supabase -> SQL Editor -> Nhấn RUN để tạo bảng và Storage
-- ==============================================================================

-- 1. BẢNG THƯ MỤC (FOLDERS)
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    parent_id TEXT,
    color TEXT DEFAULT '#0866E8',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG TẬP TIN (FILES)
CREATE TABLE IF NOT EXISTS public.files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    extension TEXT,
    category TEXT,
    size NUMERIC DEFAULT 0,
    folder_id TEXT,
    folder_name TEXT,
    filename TEXT,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    updated_date TIMESTAMPTZ DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    versions JSONB DEFAULT '[]'::jsonb,
    share_config JSONB,
    preview_content TEXT
);

-- 3. BẢNG HỒ SƠ NGƯỜI DÙNG (USER PROFILE)
CREATE TABLE IF NOT EXISTS public.user_profile (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT,
    school TEXT,
    location TEXT,
    email TEXT,
    phone TEXT,
    storage_used_bytes NUMERIC DEFAULT 0,
    storage_max_bytes NUMERIC DEFAULT 107374182400,
    avatar_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẬT ROW LEVEL SECURITY (RLS) & CẤP QUYỀN TOÀN DIỆN CHO ANON KEY
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cho phep tat ca thao tac tren folders" ON public.folders;
CREATE POLICY "Cho phep tat ca thao tac tren folders" ON public.folders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep tat ca thao tac tren files" ON public.files;
CREATE POLICY "Cho phep tat ca thao tac tren files" ON public.files FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Cho phep tat ca thao tac tren user_profile" ON public.user_profile;
CREATE POLICY "Cho phep tat ca thao tac tren user_profile" ON public.user_profile FOR ALL USING (true) WITH CHECK (true);

-- 5. TẠO STORAGE BUCKET CHO TẬP TIN UPLOAD (DOCUMENTS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public access to documents" ON storage.objects;
CREATE POLICY "Public access to documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Public upload to documents" ON storage.objects;
CREATE POLICY "Public upload to documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Public update to documents" ON storage.objects;
CREATE POLICY "Public update to documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Public delete to documents" ON storage.objects;
CREATE POLICY "Public delete to documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
`;

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface HierarchicalFolderOption {
  id: string;
  name: string;
  depth: number;
  label: string;
  folder: FolderItem;
}

export function buildFolderTreeOptions(folderList: FolderItem[]): HierarchicalFolderOption[] {
  const result: HierarchicalFolderOption[] = [];

  const addChildren = (parentId: string | null, depth: number) => {
    const children = folderList.filter((f) => (f.parentId || null) === parentId);
    children.sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }));

    for (const child of children) {
      const indent = depth === 0 ? '' : '—'.repeat(depth) + ' ↳ ';
      result.push({
        id: child.id,
        name: child.name,
        depth,
        label: `${indent}${child.name}`,
        folder: child,
      });
      addChildren(child.id, depth + 1);
    }
  };

  addChildren(null, 0);

  const addedIds = new Set(result.map((r) => r.id));
  const orphans = folderList.filter((f) => !addedIds.has(f.id));
  orphans.sort((a, b) => a.name.localeCompare(b.name, 'vi', { numeric: true }));
  for (const orphan of orphans) {
    result.push({
      id: orphan.id,
      name: orphan.name,
      depth: 0,
      label: orphan.name,
      folder: orphan,
    });
  }

  return result;
}
