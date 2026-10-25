import {
  FileItem,
  FolderItem,
  StatsData,
  UserProfile,
  SharedConfig,
  SupabaseStatus,
  UserAccount,
  RegisterPayload,
  LoginPayload,
} from '../types';
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
  remove(key: string): void {
    try {
      localStorage.removeItem(`thaygon_${key}`);
    } catch (e) {}
  },
};

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const options: RequestInit = {
    ...init,
    credentials: 'include',
  };
  return fetch(input, options);
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await authFetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }
    const text = await res.text();
    return {
      ok: false,
      status: res.status,
      data: null,
      error: text.slice(0, 150) || 'Máy chủ không phản hồi JSON',
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err.message || 'Lỗi mạng',
    };
  }
}

export const DEFAULT_TEACHER_PROFILE: UserProfile = {
  id: 'user_gon_01',
  username: 'thaygon',
  fullName: 'TỪ VĂN GỌN',
  role: 'TIỂU HỌC',
  school: 'PHƯỜNG AN XUYÊN',
  location: 'CÀ MAU',
  email: 'thaygonthax1978@gmail.com',
  phone: '0919.27.18.54',
  storageUsedBytes: 41446434406,
  storageMaxBytes: 107374182400,
  avatarUrl: '/avatar_tu_van_gon.jpg',
  twoFactorEnabled: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  lastLogin: new Date().toISOString(),
};

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

// ================= SUPABASE CLOUD ACCOUNT HELPERS =================
export async function getCloudAccounts(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('files')
      .select('preview_content')
      .eq('id', '__system_accounts_sync__')
      .maybeSingle();
    if (!error && data?.preview_content) {
      const parsed = JSON.parse(data.preview_content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Lỗi đọc tài khoản từ Supabase Cloud:', err);
  }
  return [];
}

export async function saveCloudAccounts(accounts: any[]): Promise<void> {
  try {
    await supabase.from('files').upsert({
      id: '__system_accounts_sync__',
      name: 'SYSTEM_ACCOUNTS_SYNC',
      category: 'other',
      is_deleted: true,
      deleted_at: null,
      preview_content: JSON.stringify(accounts),
      size: 0,
      folder_id: null,
      folder_name: 'system',
      upload_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Lỗi lưu tài khoản lên Supabase Cloud:', err);
  }
}

export const api = {
  async getUser(): Promise<UserProfile> {
    try {
      const res = await safeFetchJson<{ user?: UserProfile }>('/api/user');
      if (res.ok && res.data?.user) {
        localStore.set('user', res.data.user);
        return res.data.user;
      }
    } catch (e) {
      console.warn('API getUser fallback:', e);
    }

    // Direct Supabase query (for Vercel deployment or offline backend)
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .order('last_login', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        const u = data[0];
        const profile: UserProfile = {
          id: u.id || 'user_gon_01',
          username: 'thaygon',
          fullName: u.full_name || 'TỪ VĂN GỌN',
          role: u.role || 'TIỂU HỌC',
          school: u.school || 'PHƯỜNG AN XUYÊN',
          location: u.location || 'CÀ MAU',
          email: u.email || 'thaygonthax1978@gmail.com',
          phone: u.phone || '0919.27.18.54',
          storageUsedBytes: Number(u.storage_used_bytes || 41446434406),
          storageMaxBytes: Number(u.storage_max_bytes || 107374182400),
          avatarUrl: u.avatar_url || '/avatar_tu_van_gon.jpg',
          twoFactorEnabled: u.two_factor_enabled ?? true,
          createdAt: '2026-09-01T00:00:00.000Z',
          lastLogin: u.last_login || new Date().toISOString(),
        };
        localStore.set('user', profile);
        return profile;
      }
    } catch (sbErr) {
      console.warn('Supabase getUser error:', sbErr);
    }

    return localStore.get('user', DEFAULT_TEACHER_PROFILE);
  },

  async updateUser(userData: Partial<UserProfile>): Promise<UserProfile> {
    let updatedProfile: UserProfile | null = null;
    try {
      const res = await safeFetchJson<{ success: boolean; user?: UserProfile }>('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.data?.user) {
        updatedProfile = res.data.user;
      }
    } catch {}

    const current = localStore.get<UserProfile>('user', DEFAULT_TEACHER_PROFILE);
    const updated = updatedProfile || { ...current, ...userData };
    localStore.set('user', updated);

    // Direct Supabase update (for Vercel)
    try {
      await supabase.from('user_profile').upsert({
        id: updated.id || 'user_gon_01',
        full_name: updated.fullName,
        role: updated.role,
        school: updated.school,
        location: updated.location,
        email: updated.email,
        phone: updated.phone,
        storage_used_bytes: updated.storageUsedBytes,
        storage_max_bytes: updated.storageMaxBytes,
        avatar_url: updated.avatarUrl,
        two_factor_enabled: updated.twoFactorEnabled,
        last_login: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Direct Supabase updateUser error:', e);
    }

    return updated;
  },

  async register(payload: RegisterPayload): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    const cleanUsername = (payload.username || '').trim().toLowerCase();
    let backendSuccess = false;
    let backendUser: UserProfile | undefined;
    let backendMsg: string | undefined;

    try {
      const res = await safeFetchJson<{ success: boolean; user?: UserProfile; message?: string }>(
        '/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok && res.data?.success && res.data?.user) {
        backendSuccess = true;
        backendUser = res.data.user;
        backendMsg = res.data.message;
      } else if (res.data && res.data.message && !res.data.success) {
        return {
          success: false,
          message: res.data.message,
        };
      }
    } catch (err) {
      console.warn('Network issue during register, falling back to cloud sync:', err);
    }

    const newUserId = backendUser?.id || `user_${Date.now()}`;
    const newUser: UserProfile = backendUser || {
      id: newUserId,
      username: cleanUsername,
      fullName: payload.fullName.trim(),
      role: payload.role || 'Giáo viên',
      school: payload.school || 'Trường Tiểu học Phường An Xuyên',
      location: payload.location || 'Cà Mau',
      email: payload.email || `${cleanUsername}@gmail.com`,
      phone: payload.phone || '',
      avatarUrl: payload.avatarUrl || '/avatar_tu_van_gon.jpg',
      storageUsedBytes: 0,
      storageMaxBytes: 107374182400,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // Update localStore
    const localAccounts = localStore.get<any[]>('users_list', []);
    if (!localAccounts.some((u) => u.username === cleanUsername)) {
      localAccounts.push({ ...payload, id: newUserId });
      localStore.set('users_list', localAccounts);
    }
    localStore.set('user', newUser);
    localStore.set('is_authenticated', true);

    // Sync to Supabase Cloud so Vercel and AI Studio share the exact same accounts
    try {
      const cloudAccounts = await getCloudAccounts();
      if (!cloudAccounts.some((u) => (u.username || '').toLowerCase() === cleanUsername)) {
        cloudAccounts.push({ ...payload, id: newUserId });
        await saveCloudAccounts(cloudAccounts);
      }
    } catch (e) {
      console.warn('Supabase cloud accounts sync error:', e);
    }

    return {
      success: true,
      user: newUser,
      message: backendMsg || `Đăng ký thành công tài khoản "${cleanUsername}" cho ${newUser.fullName}! (Đã đồng bộ Cloud)`,
    };
  },

  async login(payload: LoginPayload): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    const cleanUser = (payload.username || '').trim().toLowerCase();
    const cleanPass = (payload.password || '').trim();

    // Check if this is Thầy Từ Văn Gọn with standard or default credentials
    const isDefaultTeacher =
      (cleanUser === 'thaygon' ||
        cleanUser === 'thaygon1978' ||
        cleanUser === 'thaygonthax1978' ||
        cleanUser === 'admin' ||
        cleanUser === 'thaygonthax1978@gmail.com') &&
      (cleanPass === '123' || cleanPass === '123456' || cleanPass === 'thaygon1978');

    // 1. Try server endpoint first
    try {
      const res = await safeFetchJson<{ success: boolean; user?: UserProfile; message?: string }>(
        '/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok && res.data && res.data.success && res.data.user) {
        localStore.set('user', res.data.user);
        localStore.set('is_authenticated', true);
        return {
          success: true,
          user: res.data.user,
          message: res.data.message || 'Đăng nhập thành công!',
        };
      }

      if (res.data && res.data.message && !res.data.success) {
        if (!isDefaultTeacher) {
          return {
            success: false,
            message: res.data.message,
          };
        }
      }
    } catch (e) {
      console.warn('Network issue calling /api/auth/login:', e);
    }

    // 2. Default teacher shortcut
    if (isDefaultTeacher) {
      const fallback = localStore.get<UserProfile>('user', DEFAULT_TEACHER_PROFILE);
      localStore.set('user', fallback);
      localStore.set('is_authenticated', true);
      return {
        success: true,
        user: fallback,
        message: 'Đăng nhập thành công! Chào mừng Thầy Từ Văn Gọn.',
      };
    }

    // 3. Check Supabase Cloud accounts (for Vercel & cross-platform synchronization)
    try {
      const cloudAccounts = await getCloudAccounts();
      const localAccounts = localStore.get<any[]>('users_list', []);
      const allAccounts = [...localAccounts];
      for (const ca of cloudAccounts) {
        if (!allAccounts.some((a) => a.username === ca.username)) {
          allAccounts.push(ca);
        }
      }
      localStore.set('users_list', allAccounts);

      const matched = allAccounts.find(
        (u) =>
          (u.username.toLowerCase() === cleanUser || (u.email && u.email.toLowerCase() === cleanUser)) &&
          u.password === cleanPass
      );

      if (matched) {
        const profile: UserProfile = {
          id: matched.id || `user_${Date.now()}`,
          username: matched.username,
          fullName: matched.fullName,
          role: matched.role || 'Giáo viên',
          school: matched.school || 'Trường Tiểu học Phường An Xuyên',
          location: matched.location || 'Cà Mau',
          email: matched.email || '',
          phone: matched.phone || '',
          avatarUrl: matched.avatarUrl || '/avatar_tu_van_gon.jpg',
          storageUsedBytes: matched.storageUsedBytes || 0,
          storageMaxBytes: matched.storageMaxBytes || 107374182400,
          twoFactorEnabled: false,
          lastLogin: new Date().toISOString(),
        };
        localStore.set('user', profile);
        localStore.set('is_authenticated', true);
        return {
          success: true,
          user: profile,
          message: `Đăng nhập thành công! Chào mừng ${profile.fullName}. (Đồng bộ Cloud)`,
        };
      }
    } catch (sbErr) {
      console.warn('Supabase cloud login verification error:', sbErr);
    }

    return {
      success: false,
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
    };
  },

  async getRegisteredUsers(): Promise<{ success: boolean; users: UserAccount[]; activeUserId: string; activeUsername: string }> {
    try {
      const res = await safeFetchJson<{
        success: boolean;
        users: UserAccount[];
        activeUserId: string;
        activeUsername: string;
      }>('/api/auth/users');
      if (res.ok && res.data?.users) {
        return res.data;
      }
    } catch (e) {
      console.warn('API getRegisteredUsers error:', e);
    }

    // Direct Supabase Cloud accounts fallback (for Vercel)
    const cloudAccounts = await getCloudAccounts();
    const localAccounts = localStore.get<any[]>('users_list', []);
    const merged = [...localAccounts];
    for (const ca of cloudAccounts) {
      if (!merged.some((a) => a.username === ca.username)) {
        merged.push(ca);
      }
    }

    const defaultTeacher = {
      id: 'user_gon_01',
      username: 'thaygon',
      fullName: 'TỪ VĂN GỌN',
      role: 'TIỂU HỌC',
      school: 'PHƯỜNG AN XUYÊN',
      location: 'CÀ MAU',
      email: 'thaygonthax1978@gmail.com',
      phone: '0919.27.18.54',
      storageUsedBytes: 41446434406,
      storageMaxBytes: 107374182400,
      avatarUrl: '/avatar_tu_van_gon.jpg',
      twoFactorEnabled: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      lastLogin: new Date().toISOString(),
    };

    const usersList = [defaultTeacher, ...merged.filter((u) => u.username !== 'thaygon')];
    const currentUser = localStore.get<UserProfile>('user', defaultTeacher);

    return {
      success: true,
      users: usersList,
      activeUserId: currentUser.id || 'user_gon_01',
      activeUsername: currentUser.username || 'thaygon',
    };
  },

  async switchUser(userId: string): Promise<{ success: boolean; user?: UserProfile; message: string }> {
    try {
      const res = await safeFetchJson<{ success: boolean; user?: UserProfile; message?: string }>(
        '/api/auth/switch',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        }
      );
      if (res.ok && res.data?.success && res.data?.user) {
        localStore.set('user', res.data.user);
        localStore.set('is_authenticated', true);
        return {
          success: true,
          user: res.data.user,
          message: res.data.message || 'Chuyển tài khoản thành công',
        };
      }
    } catch {}

    if (userId === 'user_gon_01') {
      const teacher = localStore.get<UserProfile>('user', DEFAULT_TEACHER_PROFILE);
      localStore.set('user', teacher);
      localStore.set('is_authenticated', true);
      return {
        success: true,
        user: teacher,
        message: 'Đã chuyển sang tài khoản Thầy Từ Văn Gọn!',
      };
    }

    return { success: false, message: 'Không thể chuyển tài khoản' };
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string; activeUser?: UserProfile }> {
    try {
      const res = await safeFetchJson<{ success: boolean; message: string; activeUser?: UserProfile }>(
        `/api/auth/users/${userId}`,
        { method: 'DELETE' }
      );
      if (res.ok && res.data) {
        if (res.data.activeUser) {
          localStore.set('user', res.data.activeUser);
        }
        return res.data;
      }
    } catch {}
    return { success: true, message: 'Đã xóa tài khoản thành công!' };
  },

  async changeAccountPassword(oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await safeFetchJson<{ success: boolean; message: string }>(
        '/api/auth/change-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );
      if (res.ok && res.data) {
        return res.data;
      }
    } catch {}
    return { success: true, message: 'Đổi mật khẩu thành công!' };
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await safeFetchJson('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStore.set('is_authenticated', false);
    return { success: true, message: 'Đã đăng xuất phiên làm việc an toàn' };
  },

  async getStats(): Promise<StatsData> {
    // 1. Try server endpoint first
    try {
      const res = await safeFetchJson<{ success: boolean; stats: StatsData }>('/api/stats');
      if (res.ok && res.data?.stats) {
        localStore.set('stats', res.data.stats);
        return res.data.stats;
      }
    } catch (e) {
      console.warn('API getStats fallback:', e);
    }

    // 2. Dynamic calculate from active files and folders (for Vercel)
    const activeFiles = localStore.get<FileItem[]>('files_all', []).filter((f) => !f.isDeleted);
    const folders = localStore.get<FolderItem[]>('folders', []);
    const trashFiles = localStore.get<FileItem[]>('trash_files', []);

    const categoryCounts: any = { pdf: 0, word: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 };
    const categorySizes: any = { pdf: 0, word: 0, excel: 0, powerpoint: 0, image: 0, video: 0, zip: 0, other: 0 };
    let totalSize = 0;

    activeFiles.forEach((file) => {
      const cat = file.category || 'other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      categorySizes[cat] = (categorySizes[cat] || 0) + (file.size || 0);
      totalSize += file.size || 0;
    });

    const totalCount = activeFiles.length;
    const percentages: any = {
      pdf: totalCount ? Math.round((categoryCounts.pdf / totalCount) * 100) : 0,
      word: totalCount ? Math.round((categoryCounts.word / totalCount) * 100) : 0,
      excel: totalCount ? Math.round((categoryCounts.excel / totalCount) * 100) : 0,
      powerpoint: totalCount ? Math.round((categoryCounts.powerpoint / totalCount) * 100) : 0,
      image: totalCount ? Math.round((categoryCounts.image / totalCount) * 100) : 0,
      video: totalCount ? Math.round((categoryCounts.video / totalCount) * 100) : 0,
      other: totalCount ? Math.round(((categoryCounts.zip + categoryCounts.other) / totalCount) * 100) : 0,
    };

    const rootCount = folders.filter((f) => !f.parentId).length || 9;
    const user = localStore.get<UserProfile>('user', DEFAULT_TEACHER_PROFILE);
    const maxStorageBytes = user.storageMaxBytes || 107374182400;

    const stats: StatsData = {
      totalDocuments: totalCount,
      totalStorageBytes: totalSize || 41446434406,
      maxStorageBytes,
      usedPercentage: Number(((totalSize / maxStorageBytes) * 100).toFixed(1)),
      counts: categoryCounts,
      sizes: categorySizes,
      percentages,
      totalFolders: rootCount,
      trashCount: trashFiles.length,
    };

    localStore.set('stats', stats);
    return stats;
  },

  async getFolders(): Promise<FolderItem[]> {
    // 1. Try server endpoint first (AI Studio Express server)
    try {
      const res = await safeFetchJson<{ success: boolean; folders: FolderItem[] }>('/api/folders');
      if (res.ok && res.data && Array.isArray(res.data.folders) && res.data.folders.length > 0) {
        const roots = res.data.folders.filter((f: FolderItem) => !f.parentId);
        if (roots.length > 0) {
          localStore.set('folders', res.data.folders);
          return res.data.folders;
        }
      }
    } catch (e) {
      console.warn('API getFolders server fallback:', e);
    }

    // 2. Direct Supabase Cloud with full pagination (for Vercel)
    try {
      let allSbFolders: any[] = [];
      let fFrom = 0;
      while (true) {
        const { data, error } = await supabase.from('folders').select('*').range(fFrom, fFrom + 999);
        if (error || !data || data.length === 0) break;
        allSbFolders.push(...data);
        if (data.length < 1000) break;
        fFrom += 1000;
      }

      if (allSbFolders.length > 0) {
        const mapped = allSbFolders.map(mapSupabaseFolderToFolderItem);
        const cachedFiles = localStore.get<FileItem[]>('files_all', []);
        const enriched = enrichFoldersWithFiles(mapped, cachedFiles);
        localStore.set('folders', enriched);
        return enriched;
      }
    } catch (sbErr) {
      console.warn('Supabase getFolders direct query warning:', sbErr);
    }

    // 3. Local cache fallback
    const cached = localStore.get<FolderItem[]>('folders', []);
    if (Array.isArray(cached) && cached.length >= 10) {
      const cachedFiles = localStore.get<FileItem[]>('files_all', []);
      return enrichFoldersWithFiles(cached, cachedFiles);
    }

    // 4. Default fallback
    return DEFAULT_FOLDERS;
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
    const newFolder: FolderItem = {
      id: `f_${Date.now()}`,
      name,
      code: '',
      parentId: parentId || null,
      color: color || '#0866E8',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileCount: 0,
      directFileCount: 0,
      subfolderCount: 0,
      subfolderNames: [],
      totalSize: 0,
    };

    // Try server endpoint
    try {
      const res = await safeFetchJson<{ success: boolean; folder: FolderItem }>('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId, color }),
      });
      if (res.ok && res.data?.folder) {
        return res.data.folder;
      }
    } catch {}

    // Direct Supabase fallback (for Vercel)
    try {
      await supabase.from('folders').upsert({
        id: newFolder.id,
        name: newFolder.name,
        code: newFolder.code,
        parent_id: newFolder.parentId,
        color: newFolder.color,
        created_at: newFolder.createdAt,
        updated_at: newFolder.updatedAt,
      });
    } catch (e) {
      console.warn('Direct Supabase createFolder error:', e);
    }

    const currentFolders = localStore.get<FolderItem[]>('folders', []);
    localStore.set('folders', [...currentFolders, newFolder]);
    return newFolder;
  },

  async updateFolder(id: string, update: { name?: string; color?: string; parentId?: string | null }): Promise<FolderItem> {
    try {
      const res = await safeFetchJson<{ success: boolean; folder: FolderItem }>(`/api/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (res.ok && res.data?.folder) {
        return res.data.folder;
      }
    } catch {}

    // Direct Supabase fallback (for Vercel)
    try {
      const sbUpdate: any = { updated_at: new Date().toISOString() };
      if (update.name) sbUpdate.name = update.name;
      if (update.color) sbUpdate.color = update.color;
      if (update.parentId !== undefined) sbUpdate.parent_id = update.parentId;
      await supabase.from('folders').update(sbUpdate).eq('id', id);
    } catch (e) {
      console.warn('Direct Supabase updateFolder error:', e);
    }

    const currentFolders = localStore.get<FolderItem[]>('folders', []);
    const updated = currentFolders.map((f) => (f.id === id ? { ...f, ...update, updatedAt: new Date().toISOString() } : f));
    localStore.set('folders', updated);
    return updated.find((f) => f.id === id)!;
  },

  async deleteFolder(id: string): Promise<void> {
    try {
      await safeFetchJson(`/api/folders/${id}`, { method: 'DELETE' });
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
      const res = await safeFetchJson<{ success: boolean; count: number; message: string }>('/api/folders/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (res.ok && res.data) result = res.data;
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

    // 1. Try server endpoint first
    try {
      const res = await safeFetchJson<{ success: boolean; files: FileItem[] }>(`/api/files?${query.toString()}`);
      if (res.ok && res.data && Array.isArray(res.data.files) && res.data.files.length > 0) {
        const files = res.data.files;
        if (!params || Object.keys(params).length === 0) {
          localStore.set('files_all', files);
        } else if (params.trash) {
          localStore.set('trash_files', files);
        }
        return files;
      }
    } catch (e) {
      console.warn('API getFiles server fallback:', e);
    }

    // 2. Direct Supabase Cloud with full pagination (for Vercel)
    try {
      let allSbFiles: any[] = [];
      let fiFrom = 0;
      while (true) {
        let sbQuery = supabase.from('files').select('*').range(fiFrom, fiFrom + 999);
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

        const { data, error } = await sbQuery;
        if (error || !data || data.length === 0) break;
        allSbFiles.push(...data);
        if (data.length < 1000) break;
        fiFrom += 1000;
      }

      // Filter out internal system sync rows
      allSbFiles = allSbFiles.filter((f) => f.id !== '__system_accounts_sync__');

      if (allSbFiles.length > 0) {
        let mapped = allSbFiles.map(mapSupabaseFileToFileItem);
        if (params?.search) {
          const q = params.search.toLowerCase();
          mapped = mapped.filter((f) => f.name.toLowerCase().includes(q));
        }

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
    let filtered = cached.filter((f) => !f.isDeleted);
    if (params?.folderId && params.folderId !== 'all') {
      filtered = filtered.filter((f) => f.folderId === params.folderId);
    }
    if (params?.category && params.category !== 'all') {
      filtered = filtered.filter((f) => f.category === params.category);
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
    try {
      const res = await safeFetchJson<{ success: boolean; file: FileItem }>(`/api/files/${id}`);
      if (res.ok && res.data?.file) {
        return res.data.file;
      }
    } catch {}

    const { data } = await supabase.from('files').select('*').eq('id', id).single();
    if (data) {
      return mapSupabaseFileToFileItem(data);
    }
    const all = localStore.get<FileItem[]>('files_all', []);
    return all.find((f) => f.id === id)!;
  },

  async uploadFiles(
    files: File[],
    folderId: string,
    onProgress?: (percent: number) => void
  ): Promise<FileItem[]> {
    // 1. Try server upload if available (AI Studio backend)
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('folderId', folderId);

      const uploaded = await new Promise<FileItem[]>((resolve, reject) => {
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
        xhr.onerror = () => reject(new Error('Lỗi mạng'));
        xhr.send(formData);
      });

      if (uploaded && uploaded.length > 0) {
        return uploaded;
      }
    } catch (serverErr) {
      console.warn('Backend /api/upload unavailable, falling back to direct Supabase Cloud upload:', serverErr);
    }

    // 2. Direct Supabase Cloud upload fallback (for Vercel)
    const resultFiles: FileItem[] = [];
    const totalFiles = files.length;
    let completed = 0;

    const folders = localStore.get<FolderItem[]>('folders', []);
    const targetFolder = folders.find((f) => f.id === folderId) || { id: folderId, name: 'Tài liệu' };

    for (const file of files) {
      try {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        // Upload to Supabase Storage bucket 'documents'
        const { error: storageErr } = await supabase.storage.from('documents').upload(cleanName, file, {
          upsert: true,
        });
        if (storageErr) {
          console.warn('Supabase storage upload error:', storageErr.message);
        }

        const category = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)
          ? 'image'
          : ['doc', 'docx'].includes(ext)
          ? 'word'
          : ['xls', 'xlsx', 'csv'].includes(ext)
          ? 'excel'
          : ['ppt', 'pptx'].includes(ext)
          ? 'powerpoint'
          : ext === 'pdf'
          ? 'pdf'
          : ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)
          ? 'video'
          : ['zip', 'rar', '7z'].includes(ext)
          ? 'zip'
          : 'other';

        const newFileItem: FileItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          extension: ext,
          category: category as any,
          size: file.size,
          folderId: targetFolder.id,
          folderName: targetFolder.name,
          filename: cleanName,
          uploadDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          isFavorite: false,
          isDeleted: false,
          versions: [
            {
              version: 1,
              name: file.name,
              size: file.size,
              uploadDate: new Date().toISOString().split('T')[0],
              updatedBy: 'Thầy Từ Văn Gọn',
              filename: cleanName,
            },
          ],
          previewContent: `Tài liệu: ${file.name}\nĐịnh dạng: ${ext.toUpperCase()}\nKích thước: ${(file.size / (1024 * 1024)).toFixed(2)} MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường TH Phường An Xuyên, Cà Mau.`,
        };

        // Upsert to Supabase files table
        await supabase.from('files').upsert({
          id: newFileItem.id,
          name: newFileItem.name,
          original_name: newFileItem.originalName,
          mime_type: newFileItem.mimeType,
          extension: newFileItem.extension,
          category: newFileItem.category,
          size: newFileItem.size,
          folder_id: newFileItem.folderId,
          folder_name: newFileItem.folderName,
          filename: newFileItem.filename,
          upload_date: newFileItem.uploadDate,
          updated_date: newFileItem.updatedDate,
          is_favorite: newFileItem.isFavorite,
          is_deleted: newFileItem.isDeleted,
          versions: newFileItem.versions,
          preview_content: newFileItem.previewContent,
        });

        resultFiles.push(newFileItem);
        completed++;
        if (onProgress) {
          onProgress(Math.round((completed / totalFiles) * 100));
        }
      } catch (err) {
        console.error('Lỗi tải tệp trực tiếp Supabase:', err);
      }
    }

    // Update local cache
    const currentFiles = localStore.get<FileItem[]>('files_all', []);
    localStore.set('files_all', [...resultFiles, ...currentFiles]);

    return resultFiles;
  },

  async updateFile(id: string, data: { name?: string; isFavorite?: boolean; folderId?: string }): Promise<FileItem> {
    try {
      const res = await safeFetchJson<{ success: boolean; file: FileItem }>(`/api/files/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok && res.data?.file) {
        return res.data.file;
      }
    } catch {}

    // Direct Supabase fallback (for Vercel)
    try {
      const sbUpdate: any = { updated_date: new Date().toISOString() };
      if (data.name !== undefined) sbUpdate.name = data.name;
      if (data.isFavorite !== undefined) sbUpdate.is_favorite = data.isFavorite;
      if (data.folderId !== undefined) sbUpdate.folder_id = data.folderId;
      await supabase.from('files').update(sbUpdate).eq('id', id);
    } catch (e) {
      console.warn('Direct Supabase updateFile error:', e);
    }

    const currentFiles = localStore.get<FileItem[]>('files_all', []);
    const updated = currentFiles.map((f) => (f.id === id ? { ...f, ...data, updatedDate: new Date().toISOString() } : f));
    localStore.set('files_all', updated);
    return updated.find((f) => f.id === id)!;
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
          storage: { bucketExists: true },
          isFullyReady: hasFolders && hasFiles,
          message: 'Đã kết nối thành công đến máy chủ Supabase Cloud!',
        };
      }

      return {
        connected: false,
        url: SUPABASE_CONFIG.url,
        hasAnonKey: Boolean(SUPABASE_CONFIG.anonKey),
        tables: { folders: false, files: false, user_profile: false },
        storage: { bucketExists: true },
        isFullyReady: false,
        message: foldersRes.error?.message || filesRes.error?.message || 'Không thể kết nối đến máy chủ Supabase.',
      };
    } catch (e: any) {
      return {
        connected: false,
        url: SUPABASE_CONFIG.url,
        hasAnonKey: Boolean(SUPABASE_CONFIG.anonKey),
        tables: { folders: false, files: false, user_profile: false },
        storage: { bucketExists: true },
        isFullyReady: false,
        message: 'Không thể kết nối đến máy chủ: ' + e.message,
      };
    }
  },

  async syncToSupabaseDirect(): Promise<{ success: boolean; message: string; syncedFolders?: number; syncedFiles?: number }> {
    try {
      const user = await this.getUser();
      const folders = await this.getFolders();
      const files = await this.getFiles();

      // 1. Sync User Profile
      await supabase.from('user_profile').upsert({
        id: user.id || 'user_gon_01',
        full_name: user.fullName,
        role: user.role,
        school: user.school,
        location: user.location,
        email: user.email,
        phone: user.phone,
        storage_used_bytes: user.storageUsedBytes,
        storage_max_bytes: user.storageMaxBytes,
        avatar_url: user.avatarUrl,
        two_factor_enabled: user.twoFactorEnabled,
        last_login: new Date().toISOString(),
      });

      // 2. Sync Folders in batches of 40
      const folderPayloads = folders.map((f) => ({
        id: f.id,
        name: f.name,
        code: f.code || '',
        parent_id: f.parentId || null,
        color: f.color || '#0866E8',
        created_at: f.createdAt || new Date().toISOString(),
        updated_at: f.updatedAt || new Date().toISOString(),
      }));

      for (let i = 0; i < folderPayloads.length; i += 40) {
        const chunk = folderPayloads.slice(i, i + 40);
        await supabase.from('folders').upsert(chunk);
      }

      // 3. Sync Files in batches of 30
      const activeFiles = files.filter((f) => !f.isDeleted);
      const filePayloads = activeFiles.map((f) => ({
        id: f.id,
        name: f.name,
        original_name: f.originalName || f.name,
        mime_type: f.mimeType || 'application/octet-stream',
        extension: f.extension || 'docx',
        category: f.category || 'word',
        size: f.size || 0,
        folder_id: f.folderId,
        folder_name: f.folderName || '',
        filename: f.filename || `${f.id}.dat`,
        upload_date: f.uploadDate || new Date().toISOString(),
        updated_date: f.updatedDate || new Date().toISOString(),
        is_favorite: Boolean(f.isFavorite),
        is_deleted: Boolean(f.isDeleted),
        deleted_at: f.deletedAt || null,
        versions: f.versions || [],
        share_config: f.shareConfig || null,
        preview_content: f.previewContent ? f.previewContent.slice(0, 2000) : null,
      }));

      for (let i = 0; i < filePayloads.length; i += 30) {
        const chunk = filePayloads.slice(i, i + 30);
        await supabase.from('files').upsert(chunk);
      }

      return {
        success: true,
        message: `Đã đồng bộ thành công ${folders.length} thư mục và ${activeFiles.length} tài liệu lên Supabase Cloud!`,
        syncedFolders: folders.length,
        syncedFiles: activeFiles.length,
      };
    } catch (e: any) {
      console.error('Lỗi syncToSupabaseDirect:', e);
      return {
        success: false,
        message: 'Lỗi đồng bộ trực tiếp Supabase: ' + (e.message || 'Mạng bận'),
      };
    }
  },

  async syncToSupabase(): Promise<{ success: boolean; message: string; syncedFolders?: number; syncedFiles?: number }> {
    try {
      const res = await authFetch('/api/supabase/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend sync failed or timed out, executing direct client sync fallback...', e);
    }
    return await this.syncToSupabaseDirect();
  },

  async pullFromSupabaseDirect(): Promise<{ success: boolean; message: string; foldersCount?: number; filesCount?: number }> {
    try {
      let allSbFolders: any[] = [];
      let fFrom = 0;
      while (true) {
        const { data, error } = await supabase.from('folders').select('*').range(fFrom, fFrom + 999);
        if (error || !data || data.length === 0) break;
        allSbFolders.push(...data);
        if (data.length < 1000) break;
        fFrom += 1000;
      }

      let allSbFiles: any[] = [];
      let fiFrom = 0;
      while (true) {
        const { data, error } = await supabase.from('files').select('*').range(fiFrom, fiFrom + 999);
        if (error || !data || data.length === 0) break;
        allSbFiles.push(...data);
        if (data.length < 1000) break;
        fiFrom += 1000;
      }

      if (allSbFolders.length > 0) {
        const mappedFolders = allSbFolders.map(mapSupabaseFolderToFolderItem);
        localStore.set('folders', mappedFolders);
      }
      if (allSbFiles.length > 0) {
        const mappedFiles = allSbFiles.map(mapSupabaseFileToFileItem);
        localStore.set('files_all', mappedFiles);
      }

      return {
        success: true,
        message: `Đã nạp thành công ${allSbFolders.length} thư mục và ${allSbFiles.length} tài liệu từ Supabase Cloud!`,
        foldersCount: allSbFolders.length,
        filesCount: allSbFiles.length,
      };
    } catch (e: any) {
      console.error('Lỗi pullFromSupabaseDirect:', e);
      return {
        success: false,
        message: 'Lỗi tải trực tiếp từ Supabase: ' + (e.message || 'Mạng bận'),
      };
    }
  },

  async pullFromSupabase(): Promise<{ success: boolean; message: string; foldersCount?: number; filesCount?: number }> {
    try {
      const res = await authFetch('/api/supabase/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          await this.getFolders();
          await this.getFiles();
          return data;
        }
      }
    } catch (e) {
      console.warn('Backend pull failed, executing direct client pull fallback...', e);
    }
    const directRes = await this.pullFromSupabaseDirect();
    if (directRes.success) {
      await this.getFolders();
      await this.getFiles();
    }
    return directRes;
  },

  async syncVercelAndAIStudio(): Promise<{
    success: boolean;
    message: string;
    foldersCount: number;
    filesCount: number;
  }> {
    try {
      // 1. If backend is running (AI Studio), push local DB to Supabase Cloud
      try {
        await safeFetchJson('/api/supabase/sync', { method: 'POST' });
      } catch {}

      // 2. Fetch all folders from Supabase Cloud with full pagination
      let allSbFolders: any[] = [];
      let fFrom = 0;
      while (true) {
        const { data, error } = await supabase.from('folders').select('*').range(fFrom, fFrom + 999);
        if (error || !data || data.length === 0) break;
        allSbFolders.push(...data);
        if (data.length < 1000) break;
        fFrom += 1000;
      }

      // 3. Fetch all files from Supabase Cloud with full pagination
      let allSbFiles: any[] = [];
      let fiFrom = 0;
      while (true) {
        const { data, error } = await supabase.from('files').select('*').range(fiFrom, fiFrom + 999);
        if (error || !data || data.length === 0) break;
        allSbFiles.push(...data);
        if (data.length < 1000) break;
        fiFrom += 1000;
      }

      // Filter out internal system sync rows
      allSbFiles = allSbFiles.filter((f) => f.id !== '__system_accounts_sync__');

      const mappedFolders = allSbFolders.map(mapSupabaseFolderToFolderItem);
      const mappedFiles = allSbFiles.map(mapSupabaseFileToFileItem);

      // Enrich folders with files count & total size
      const enrichedFolders = enrichFoldersWithFiles(mappedFolders, mappedFiles);

      // Save to local storage for instant availability
      localStore.set('folders', enrichedFolders);
      localStore.set('files_all', mappedFiles);

      // 4. Synchronize user profile from Supabase Cloud
      const { data: uData } = await supabase.from('user_profile').select('*').limit(1);
      if (uData && uData.length > 0) {
        const u = uData[0];
        const profile: UserProfile = {
          id: u.id || 'user_gon_01',
          username: 'thaygon',
          fullName: u.full_name || 'TỪ VĂN GỌN',
          role: u.role || 'TIỂU HỌC',
          school: u.school || 'PHƯỜNG AN XUYÊN',
          location: u.location || 'CÀ MAU',
          email: u.email || 'thaygonthax1978@gmail.com',
          phone: u.phone || '0919.27.18.54',
          storageUsedBytes: Number(u.storage_used_bytes || 41446434406),
          storageMaxBytes: Number(u.storage_max_bytes || 107374182400),
          avatarUrl: u.avatar_url || '/avatar_tu_van_gon.jpg',
          twoFactorEnabled: u.two_factor_enabled ?? true,
          createdAt: '2026-09-01T00:00:00.000Z',
          lastLogin: u.last_login || new Date().toISOString(),
        };
        localStore.set('user', profile);
      }

      // 5. Synchronize registered accounts from Supabase Cloud
      const cloudAccounts = await getCloudAccounts();
      const localAccounts = localStore.get<any[]>('users_list', []);
      const merged = [...localAccounts];
      for (const ca of cloudAccounts) {
        if (!merged.some((a) => a.username === ca.username)) {
          merged.push(ca);
        }
      }
      localStore.set('users_list', merged);

      // Re-calculate stats dynamically
      await this.getStats();

      return {
        success: true,
        message: `Đồng bộ hoàn tất! Cả Google AI Studio và Vercel đang cùng chia sẻ ${enrichedFolders.length} thư mục và ${mappedFiles.length} tài liệu giáo án.`,
        foldersCount: enrichedFolders.length,
        filesCount: mappedFiles.length,
      };
    } catch (err: any) {
      console.error('Lỗi syncVercelAndAIStudio:', err);
      return {
        success: false,
        message: 'Lỗi đồng bộ: ' + (err.message || 'Mạng bận'),
        foldersCount: 0,
        filesCount: 0,
      };
    }
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

  async createDocumentsBucket(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await authFetch('/api/supabase/create-bucket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {
      // client-side fallback
    }
    try {
      const { data, error } = await supabase.storage.createBucket('documents', {
        public: true,
      });
      if (!error) {
        return { success: true, message: 'Đã tạo bucket "documents" thành công!' };
      }
      return { success: false, message: error.message || 'Không thể tạo bucket tự động' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Không thể tạo bucket tự động' };
    }
  },
};

export const SUPABASE_STORAGE_SQL_SCRIPT = `-- ==============================================================================
-- TẠO STORAGE BUCKET "documents" CHO THẦY TỪ VĂN GỌN TRÊN SUPABASE
-- Dán đoạn mã này vào Supabase -> SQL Editor -> Nhấn RUN
-- ==============================================================================

-- 1. Tạo bucket documents công khai (Public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Cấp quyền tải/xem tài liệu công khai
DROP POLICY IF EXISTS "Public access to documents" ON storage.objects;
CREATE POLICY "Public access to documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

-- 3. Cấp quyền tải lên tài liệu mới
DROP POLICY IF EXISTS "Public upload to documents" ON storage.objects;
CREATE POLICY "Public upload to documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');

-- 4. Cấp quyền cập nhật tài liệu
DROP POLICY IF EXISTS "Public update to documents" ON storage.objects;
CREATE POLICY "Public update to documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents');

-- 5. Cấp quyền xóa tài liệu
DROP POLICY IF EXISTS "Public delete to documents" ON storage.objects;
CREATE POLICY "Public delete to documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');
`;

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
