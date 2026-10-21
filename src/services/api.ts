import { FileItem, FolderItem, StatsData, UserProfile, SharedConfig, SupabaseStatus } from '../types';
import { DEFAULT_FILES } from './defaultFiles';
import { DEFAULT_FOLDERS } from './defaultFolders';
import { supabase, updateClientSupabaseConfig, SUPABASE_CONFIG } from './supabaseClient';

export { DEFAULT_FILES, DEFAULT_FOLDERS };

export function enrichFoldersWithFiles(folderList: FolderItem[], fileList: FileItem[]): FolderItem[] {
  const activeFiles = (fileList || []).filter((f) => !f.isDeleted);
  const getDescendantFolderIds = (folderId: string): string[] => {
    const directChildren = folderList.filter((f) => f.parentId === folderId);
    let ids: string[] = [];
    for (const child of directChildren) {
      ids.push(child.id);
      ids = ids.concat(getDescendantFolderIds(child.id));
    }
    return ids;
  };

  return folderList.map((folder) => {
    const descendantIds = [folder.id, ...getDescendantFolderIds(folder.id)];
    const filesInTree = activeFiles.filter((f) => descendantIds.includes(f.folderId));
    const directFiles = activeFiles.filter((f) => f.folderId === folder.id);
    const directChildren = folderList.filter((f) => f.parentId === folder.id);
    const size = filesInTree.reduce((acc, f) => acc + (f.size || 0), 0);

    return {
      ...folder,
      fileCount: filesInTree.length,
      directFileCount: directFiles.length,
      subfolderCount: directChildren.length,
      subfolderNames: directChildren.map((c) => c.name),
      totalSize: size,
    };
  });
}

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

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const options: RequestInit = {
    ...init,
    credentials: 'include',
  };
  return fetch(input, options);
}

export function mapSupabaseFolderToFolderItem(row: any): FolderItem {
  return {
    id: row.id,
    name: row.name,
    code: row.code || '',
    parentId: row.parent_id || null,
    color: row.color || '#0866E8',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    fileCount: 0,
    directFileCount: 0,
    subfolderCount: 0,
    subfolderNames: [],
    totalSize: 0,
  };
}

export function mapSupabaseFileToFileItem(row: any): FileItem {
  return {
    id: row.id,
    name: row.name,
    originalName: row.original_name || row.name,
    mimeType: row.mime_type || 'application/octet-stream',
    extension: row.extension || '',
    category: row.category || 'other',
    size: Number(row.size) || 0,
    folderId: row.folder_id,
    folderName: row.folder_name || '',
    filename: row.filename || row.name,
    uploadDate: row.upload_date || new Date().toISOString(),
    updatedDate: row.updated_date || new Date().toISOString(),
    isFavorite: Boolean(row.is_favorite),
    isDeleted: Boolean(row.is_deleted),
    deletedAt: row.deleted_at || undefined,
    versions: Array.isArray(row.versions) ? row.versions : [],
    shareConfig: row.share_config || undefined,
    previewContent: row.preview_content || '',
  };
}

export const api = {
  async getUser(): Promise<UserProfile> {
    try {
      const res = await authFetch('/api/user');
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
      avatarUrl: '/avatar_tu_van_gon.jpg',
      twoFactorEnabled: true,
      lastLogin: new Date().toISOString(),
    });
  },

  async updateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
    const res = await authFetch('/api/user', {
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
      const res = await authFetch('/api/stats');
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
    const currentFolders = localStore.get<FolderItem[]>('folders', DEFAULT_FOLDERS);
    const rootCount = (currentFolders.filter((f) => !f.parentId).length) || 8;
    return localStore.get('stats', {
      totalDocuments: 0,
      totalStorageBytes: 0,
      maxStorageBytes: 107374182400,
      usedPercentage: 0,
      counts: { word: 0, pdf: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 },
      sizes: { word: 0, pdf: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 },
      percentages: { word: 0, pdf: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 },
      totalFolders: rootCount,
      trashCount: 0,
    });
  },

  async getFolders(): Promise<FolderItem[]> {
    // 1. Try server endpoint first
    try {
      const res = await authFetch('/api/folders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.folders) && data.folders.length > 0) {
          const roots = data.folders.filter((f: FolderItem) => !f.parentId);
          if (roots.length > 0) {
            localStore.set('folders', data.folders);
            return data.folders;
          }
        }
      }
    } catch (e) {
      console.warn('API getFolders server fallback:', e);
    }

    // 2. Direct Supabase fallback
    try {
      const { data: sbFolders, error } = await supabase.from('folders').select('*');
      if (!error && Array.isArray(sbFolders) && sbFolders.length > 0) {
        const mapped = sbFolders.map(mapSupabaseFolderToFolderItem);
        const cachedFiles = localStore.get<FileItem[]>('files_all', DEFAULT_FILES);
        const enriched = enrichFoldersWithFiles(mapped, cachedFiles);
        localStore.set('folders', enriched);
        return enriched;
      }
    } catch (sbErr) {
      console.warn('Supabase getFolders direct query warning:', sbErr);
    }

    // 3. Local cache fallback (must have full folder tree, not just 8 empty folders)
    const cached = localStore.get<FolderItem[]>('folders', []);
    if (Array.isArray(cached) && cached.length >= 100) {
      const cachedFiles = localStore.get<FileItem[]>('files_all', DEFAULT_FILES);
      return enrichFoldersWithFiles(cached, cachedFiles);
    }

    // 4. Default folders fallback
    const cachedFiles = localStore.get<FileItem[]>('files_all', DEFAULT_FILES);
    const enrichedDefaults = enrichFoldersWithFiles(DEFAULT_FOLDERS, cachedFiles);
    localStore.set('folders', enrichedDefaults);
    return enrichedDefaults;
  },

  async restoreDatabase(): Promise<{ success: boolean; message: string; folders: FolderItem[]; files: FileItem[] }> {
    try {
      const res = await authFetch('/api/database/restore', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.folders) localStore.set('folders', data.folders);
        if (data.files) localStore.set('files_all', data.files);
        return data;
      }
    } catch (e) {
      console.warn('API restoreDatabase fallback:', e);
    }
    localStore.set('folders', DEFAULT_FOLDERS);
    return {
      success: true,
      message: 'Đã khôi phục toàn bộ hệ thống 12 thư mục giáo án và tài liệu của Thầy Gọn!',
      folders: DEFAULT_FOLDERS,
      files: localStore.get('files_all', []),
    };
  },

  async createFolder(name: string, parentId?: string | null, color?: string): Promise<FolderItem> {
    const res = await authFetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId, color }),
    });
    const data = await res.json();
    return data.folder;
  },

  async updateFolder(id: string, update: { name?: string; color?: string; parentId?: string | null }): Promise<FolderItem> {
    const res = await authFetch(`/api/folders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const data = await res.json();
    return data.folder;
  },

  async deleteFolder(id: string): Promise<void> {
    try {
      await authFetch(`/api/folders/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API deleteFolder error:', e);
    }
    try {
      await supabase.from('folders').delete().eq('id', id);
    } catch {}
    const folders = localStore.get<FolderItem[]>('folders', []);
    localStore.set('folders', folders.filter((f) => f.id !== id));
  },

  async batchDeleteFolders(options: {
    ids?: string[];
    all?: boolean;
    deleteFiles?: boolean;
    permanent?: boolean;
  }): Promise<{ success: boolean; count: number; message: string }> {
    let result = { success: true, count: 0, message: '' };
    try {
      const res = await authFetch('/api/folders/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      result = await res.json();
    } catch (e) {
      console.warn('API batchDeleteFolders error:', e);
    }

    try {
      if (options.all) {
        await supabase.from('folders').delete().neq('id', '');
      } else if (options.ids && options.ids.length > 0) {
        await supabase.from('folders').delete().in('id', options.ids);
      }
    } catch {}

    const folders = localStore.get<FolderItem[]>('folders', []);
    if (options.all) {
      localStore.set('folders', []);
    } else if (options.ids && options.ids.length > 0) {
      const idSet = new Set(options.ids);
      localStore.set('folders', folders.filter((f) => !idSet.has(f.id)));
    }

    return result;
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

    // 1. Try server endpoint
    try {
      const res = await authFetch(`/api/files?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const files = data.files || [];
        if (files.length > 0) {
          if (!params || Object.keys(params).length === 0) {
            localStore.set('files_all', files);
          } else if (params.trash) {
            localStore.set('trash_files', files);
          }
          return files;
        }
      }
    } catch (e) {
      console.warn('API getFiles server fallback:', e);
    }

    // 2. Direct Supabase fallback
    try {
      let sbQuery = supabase.from('files').select('*');
      if (params?.trash) {
        sbQuery = sbQuery.eq('is_deleted', true);
      } else {
        sbQuery = sbQuery.eq('is_deleted', false);
      }
      if (params?.folderId && params.folderId !== 'all') {
        sbQuery = sbQuery.eq('folder_id', params.folderId);
      }
      if (params?.category && params.category !== 'all') {
        sbQuery = sbQuery.eq('category', params.category);
      }
      if (params?.favorite) {
        sbQuery = sbQuery.eq('is_favorite', true);
      }
      const { data: sbFiles, error } = await sbQuery;
      if (!error && Array.isArray(sbFiles) && sbFiles.length > 0) {
        const mapped = sbFiles.map(mapSupabaseFileToFileItem);
        if (!params || Object.keys(params).length === 0) {
          localStore.set('files_all', mapped);
        } else if (params.trash) {
          localStore.set('trash_files', mapped);
        }
        return mapped;
      }
    } catch (sbErr) {
      console.warn('Supabase getFiles direct query warning:', sbErr);
    }

    // 3. Local storage fallback
    if (params?.trash) {
      return localStore.get<FileItem[]>('trash_files', []);
    }
    const cached = localStore.get<FileItem[]>('files_all', []);
    const all = (cached && cached.length > 0) ? cached : DEFAULT_FILES;
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

  clearLocalCache(): void {
    try {
      localStorage.removeItem('thaygon_files_all');
      localStorage.removeItem('thaygon_trash_files');
      localStorage.removeItem('thaygon_stats');
      localStorage.removeItem('thaygon_folders');
    } catch (e) {}
  },

  async getFile(id: string): Promise<FileItem> {
    const res = await authFetch(`/api/files/${id}`);
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
      xhr.withCredentials = true;
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
    const res = await authFetch(`/api/files/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    return resData.file;
  },

  async deleteFile(id: string, permanent: boolean = false): Promise<void> {
    try {
      await authFetch(`/api/files/${id}?permanent=${permanent}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('API deleteFile error:', e);
    }

    try {
      if (permanent) {
        await supabase.from('files').delete().eq('id', id);
      } else {
        await supabase.from('files').update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        }).eq('id', id);
      }
    } catch (e) {
      console.warn('Supabase client deleteFile error:', e);
    }

    // Update localStore
    const all = localStore.get<FileItem[]>('files_all', []);
    if (permanent) {
      localStore.set('files_all', all.filter((f) => f.id !== id));
      const trash = localStore.get<FileItem[]>('trash_files', []);
      localStore.set('trash_files', trash.filter((f) => f.id !== id));
    } else {
      const now = new Date().toISOString();
      const updatedAll = all.map((f) => (f.id === id ? { ...f, isDeleted: true, deletedAt: now } : f));
      localStore.set('files_all', updatedAll);
      const target = all.find((f) => f.id === id);
      if (target) {
        const trash = localStore.get<FileItem[]>('trash_files', []);
        localStore.set('trash_files', [{ ...target, isDeleted: true, deletedAt: now }, ...trash.filter((f) => f.id !== id)]);
      }
    }
  },

  async batchDeleteFiles(options: {
    ids?: string[];
    folderId?: string;
    all?: boolean;
    permanent?: boolean;
  }): Promise<{ success: boolean; count: number; message: string }> {
    let result = { success: true, count: 0, message: '' };
    try {
      const res = await authFetch('/api/files/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      result = await res.json();
    } catch (e) {
      console.warn('API batchDeleteFiles error:', e);
    }

    const ids = options.ids || [];
    const idSet = new Set(ids);
    const now = new Date().toISOString();

    try {
      if (ids.length > 0) {
        if (options.permanent) {
          await supabase.from('files').delete().in('id', ids);
        } else {
          await supabase.from('files').update({
            is_deleted: true,
            deleted_at: now,
          }).in('id', ids);
        }
      }
    } catch (e) {
      console.warn('Supabase client batchDeleteFiles error:', e);
    }

    // Update localStore
    const all = localStore.get<FileItem[]>('files_all', []);
    if (options.permanent) {
      localStore.set('files_all', all.filter((f) => !idSet.has(f.id)));
      const trash = localStore.get<FileItem[]>('trash_files', []);
      localStore.set('trash_files', trash.filter((f) => !idSet.has(f.id)));
    } else {
      localStore.set('files_all', all.map((f) => (idSet.has(f.id) ? { ...f, isDeleted: true, deletedAt: now } : f)));
    }

    return result;
  },

  async batchRestoreFiles(options: {
    ids?: string[];
    all?: boolean;
  }): Promise<{ success: boolean; count: number; message: string }> {
    const res = await authFetch('/api/files/batch-restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    return res.json();
  },

  async restoreFile(id: string): Promise<FileItem> {
    let restoredFile: FileItem | null = null;
    try {
      const res = await authFetch(`/api/files/${id}/restore`, { method: 'POST' });
      const data = await res.json();
      restoredFile = data.file;
    } catch (e) {
      console.warn('API restoreFile error:', e);
    }

    try {
      await supabase.from('files').update({
        is_deleted: false,
        deleted_at: null,
      }).eq('id', id);
    } catch (e) {
      console.warn('Supabase client restore error:', e);
    }

    const all = localStore.get<FileItem[]>('files_all', []);
    const updatedAll = all.map((f) => (f.id === id ? { ...f, isDeleted: false, deletedAt: undefined } : f));
    localStore.set('files_all', updatedAll);
    const trash = localStore.get<FileItem[]>('trash_files', []);
    localStore.set('trash_files', trash.filter((f) => f.id !== id));

    return restoredFile || updatedAll.find((f) => f.id === id)!;
  },

  async emptyTrash(): Promise<void> {
    try {
      await authFetch('/api/trash/empty', { method: 'DELETE' });
    } catch (e) {
      console.warn('API emptyTrash error:', e);
    }

    try {
      await supabase.from('files').delete().eq('is_deleted', true);
    } catch (e) {
      console.warn('Supabase client emptyTrash error:', e);
    }

    localStore.set('trash_files', []);
    const all = localStore.get<FileItem[]>('files_all', []);
    localStore.set('files_all', all.filter((f) => !f.isDeleted));
  },

  async reorderFile(id: string, position: 'start' | 'end'): Promise<void> {
    await authFetch(`/api/files/${id}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position }),
    });
  },

  async uploadNewVersion(fileId: string, file: File): Promise<FileItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch(`/api/files/${fileId}/version`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.file;
  },

  async shareFile(fileId: string, shareData: Partial<SharedConfig>): Promise<SharedConfig> {
    const res = await authFetch(`/api/files/${fileId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shareData),
    });
    const data = await res.json();
    return data.shareConfig;
  },

  async chatAI(message: string, fileContextId?: string, actionType?: string): Promise<string> {
    const res = await authFetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, fileContextId, actionType }),
    });
    const data = await res.json();
    return data.reply;
  },

  async analyzeFileAI(fileId: string): Promise<string> {
    const res = await authFetch('/api/ai/analyze-file', {
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

  getFolderDownloadUrl(folderId: string): string {
    return `/api/folders/${folderId}/download-zip`;
  },

  getBatchFoldersDownloadUrl(folderIds: string[]): string {
    return `/api/folders-download-batch?ids=${folderIds.map(encodeURIComponent).join(',')}`;
  },

  downloadFolder(folderId: string, folderName?: string): void {
    const cleanName = (folderName || 'thu_muc').replace(/[/\\?%*:|"<>]/g, '_').trim();
    const link = document.createElement('a');
    link.href = `/api/folders/${folderId}/download-zip`;
    link.setAttribute('download', `${cleanName}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  downloadBatchFolders(folderIds: string[], zipName?: string): void {
    if (folderIds.length === 0) return;
    const cleanName = (zipName || (folderIds.length === 1 ? 'thu_muc' : `thu_muc_da_chon_${folderIds.length}`)).replace(/[/\\?%*:|"<>]/g, '_').trim();
    const link = document.createElement('a');
    link.href = `/api/folders-download-batch?ids=${folderIds.map(encodeURIComponent).join(',')}`;
    link.setAttribute('download', `${cleanName}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  async getSupabaseStatus(): Promise<SupabaseStatus> {
    // 1. Try server-side status check first
    try {
      const res = await authFetch('/api/supabase/status');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.status) {
          return data.status;
        }
      }
    } catch (e: any) {
      console.warn('Backend /api/supabase/status check failed, verifying directly via Supabase client...', e);
    }

    // 2. Direct client-side ping to Supabase in case backend is busy or returning HTML proxy response
    try {
      const [foldersRes, filesRes, userRes] = await Promise.all([
        supabase.from('folders').select('id').limit(1),
        supabase.from('files').select('id').limit(1),
        supabase.from('user_profile').select('id').limit(1),
      ]);

      const hasFolders = !foldersRes.error;
      const hasFiles = !filesRes.error;
      const hasUser = !userRes.error;
      const isConnected = hasFolders || hasFiles;

      if (isConnected) {
        return {
          connected: true,
          url: SUPABASE_CONFIG.url,
          hasAnonKey: Boolean(SUPABASE_CONFIG.anonKey),
          tables: {
            folders: hasFolders,
            files: hasFiles,
            user_profile: hasUser,
          },
          storage: { bucketExists: false },
          isFullyReady: hasFolders && hasFiles,
          message: 'Đã kết nối thành công đến máy chủ Supabase Cloud!',
        };
      }

      return {
        connected: false,
        url: SUPABASE_CONFIG.url,
        hasAnonKey: Boolean(SUPABASE_CONFIG.anonKey),
        tables: { folders: false, files: false, user_profile: false },
        storage: { bucketExists: false },
        isFullyReady: false,
        message: foldersRes.error?.message || filesRes.error?.message || 'Không thể kết nối đến máy chủ Supabase.',
      };
    } catch (e: any) {
      return {
        connected: false,
        url: SUPABASE_CONFIG.url,
        hasAnonKey: Boolean(SUPABASE_CONFIG.anonKey),
        tables: { folders: false, files: false, user_profile: false },
        storage: { bucketExists: false },
        isFullyReady: false,
        message: 'Không thể kết nối đến máy chủ: ' + e.message,
      };
    }
  },

  async syncToSupabase(): Promise<{ success: boolean; message: string; syncedFolders?: number; syncedFiles?: number }> {
    const res = await authFetch('/api/supabase/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async pullFromSupabase(): Promise<{ success: boolean; message: string; foldersCount?: number; filesCount?: number }> {
    const res = await authFetch('/api/supabase/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  async updateSupabaseConfig(url: string, anonKey: string): Promise<{ success: boolean; message: string; url?: string }> {
    updateClientSupabaseConfig(url, anonKey);
    try {
      const res = await authFetch('/api/supabase/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, anonKey }),
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: true,
        message: 'Đã cập nhật cấu hình Supabase trên máy khách thành công!',
        url,
      };
    }
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
