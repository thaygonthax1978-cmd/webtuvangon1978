export type ViewTab =
  | 'home'
  | 'my-files'
  | 'folders'
  | 'share'
  | 'favorites'
  | 'trash'
  | 'ai-assistant'
  | 'stats'
  | 'settings';

export type FileCategory =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'video'
  | 'zip'
  | 'other';

export interface FileVersion {
  version: number;
  name: string;
  size: number;
  uploadDate: string;
  updatedBy: string;
  filename: string;
}

export interface SharedConfig {
  isShared: boolean;
  shareUrl?: string;
  sharedWithEmails: string[];
  email?: string;
  accessRole: 'viewer' | 'editor';
  hasPassword?: boolean;
  password?: string;
  expiresInDays?: number;
  createdAt?: string;
}

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  extension: string;
  category: FileCategory;
  size: number;
  folderId: string;
  folderName: string;
  filename: string;
  uploadDate: string;
  updatedDate: string;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  versions: FileVersion[];
  shareConfig?: SharedConfig;
  previewContent?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
  fileCount?: number;
  totalSize?: number;
}

export interface UserProfile {
  id: string;
  fullName: string;
  role: string;
  school: string;
  location: string;
  email: string;
  phone: string;
  storageUsedBytes: number;
  storageMaxBytes: number;
  avatarUrl: string;
  twoFactorEnabled: boolean;
  lastLogin: string;
}

export interface StatsData {
  totalDocuments: number;
  totalStorageBytes: number;
  maxStorageBytes: number;
  usedPercentage: number;
  counts: Record<FileCategory, number>;
  sizes: Record<FileCategory, number>;
  percentages: Record<FileCategory, number>;
  totalFolders: number;
  trashCount: number;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'paused';
  errorMessage?: string;
  targetFolderId?: string;
  relativePath?: string;
}
