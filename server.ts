import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { isRealDocx, generateValidDocx } from './src/services/docxHelper';

dotenv.config();

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Directories
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const CHUNKS_TEMP_DIR = path.resolve(process.cwd(), 'temp_chunks');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(CHUNKS_TEMP_DIR)) fs.mkdirSync(CHUNKS_TEMP_DIR, { recursive: true });

app.use(express.static(path.resolve(process.cwd(), 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// Setup Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ceuwkkfwklxedzndsisu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5nblBT8S82bUTXPp-wQwig_yRIDJXYF';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Setup Gemini AI Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Initial Database Structure
interface FileVersion {
  version: number;
  name: string;
  size: number;
  uploadDate: string;
  updatedBy: string;
  filename: string;
}

interface SharedConfig {
  isShared: boolean;
  shareUrl?: string;
  sharedWithEmails: string[];
  accessRole: 'viewer' | 'editor';
  hasPassword?: boolean;
  password?: string;
  expiresInDays?: number;
  createdAt?: string;
}

interface FileRecord {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  extension: string;
  category: 'pdf' | 'word' | 'excel' | 'powerpoint' | 'image' | 'video' | 'zip' | 'other';
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
  textContent?: string;
}

interface FolderRecord {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
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

interface DatabaseSchema {
  user: UserProfile;
  folders: FolderRecord[];
  files: FileRecord[];
}

// Initial Sample Data for Thầy Từ Văn Gọn
const initialUser: UserProfile = {
  id: 'user_gon_01',
  fullName: 'TỪ VĂN GỌN',
  role: 'Giáo viên tiểu học',
  school: 'Trường Tiểu học Phường An Xuyên',
  location: 'Cà Mau',
  email: 'thaygonthax1978@gmail.com',
  phone: '0918.452.889',
  storageUsedBytes: 38.6 * 1024 * 1024 * 1024, // 38.6 GB
  storageMaxBytes: 100 * 1024 * 1024 * 1024, // 100 GB
  avatarUrl: '/avatar_tu_van_gon.jpg',
  twoFactorEnabled: true,
  lastLogin: new Date().toISOString(),
};

const defaultFolders: FolderRecord[] = [
  {
    id: 'f_03',
    name: '01. GIÁO ÁN TIẾNG VIỆT 1',
    code: '03',
    parentId: null,
    color: '#8257E5',
    createdAt: '2026-09-02T08:00:00+00:00',
    updatedAt: '2026-10-15T07:25:21.976+00:00',
  },
  {
    id: 'f_1792049102744',
    name: '02. GIÁO ÁN TOÁN 1',
    code: '13',
    parentId: null,
    color: '#0866E8',
    createdAt: '2026-10-15T07:25:02.744+00:00',
    updatedAt: '2026-10-15T07:25:02.744+00:00',
  },
  {
    id: 'f_01',
    name: '03. GIÁO ÁN ĐẠO ĐỨC 1',
    code: '01',
    parentId: null,
    color: '#0866E8',
    createdAt: '2026-09-01T08:00:00+00:00',
    updatedAt: '2026-10-15T07:26:13.679+00:00',
  },
  {
    id: 'f_02',
    name: '04. GIÁO ÁN TỰ NHIÊN VÀ XÃ HỘI 1',
    code: '02',
    parentId: null,
    color: '#16B875',
    createdAt: '2026-09-01T08:15:00+00:00',
    updatedAt: '2026-10-15T07:26:44.994+00:00',
  },
  {
    id: 'f_04',
    name: '05. GIÁO ÁN HOẠT ĐỘNG TRẢI NGHIỆM 1',
    code: '04',
    parentId: null,
    color: '#0866E8',
    createdAt: '2026-09-05T09:00:00+00:00',
    updatedAt: '2026-10-15T07:27:13.076+00:00',
  },
  {
    id: 'f_07',
    name: '06. WORD',
    code: '07',
    parentId: null,
    color: '#0866E8',
    createdAt: '2026-09-07T13:00:00+00:00',
    updatedAt: '2026-10-15T07:28:45.624+00:00',
  },
  {
    id: 'f_08',
    name: '07. EXCEL',
    code: '08',
    parentId: null,
    color: '#16B875',
    createdAt: '2026-09-08T14:00:00+00:00',
    updatedAt: '2026-10-15T07:28:52.056+00:00',
  },
  {
    id: 'f_10',
    name: '08. POWERPOINT',
    code: '10',
    parentId: null,
    color: '#FF9F1C',
    createdAt: '2026-09-10T10:00:00+00:00',
    updatedAt: '2026-10-15T07:29:13.881+00:00',
  },
  {
    id: 'f_09',
    name: '09. PDF',
    code: '09',
    parentId: null,
    color: '#F04444',
    createdAt: '2026-09-09T08:00:00+00:00',
    updatedAt: '2026-09-20T17:10:00+00:00',
  },
  {
    id: 'f_06',
    name: '10. VIDEO',
    code: '06',
    parentId: null,
    color: '#F04444',
    createdAt: '2026-09-06T11:00:00+00:00',
    updatedAt: '2026-10-15T07:29:32.218+00:00',
  },
  {
    id: 'f_05',
    name: '11. HÌNH ẢNH',
    code: '05',
    parentId: null,
    color: '#FF9F1C',
    createdAt: '2026-09-05T10:30:00+00:00',
    updatedAt: '2026-10-15T07:28:10.042+00:00',
  },
  {
    id: 'f_1792226614838',
    name: 'ẢNH CẢ NHÀ',
    code: '12',
    parentId: 'f_05',
    color: '#8257E5',
    createdAt: '2026-10-17T08:43:34.838Z',
    updatedAt: '2026-10-17T08:43:34.838Z',
  },
  {
    id: 'f_1792226627426',
    name: 'ẢNH DU LỊCH',
    code: '13',
    parentId: 'f_05',
    color: '#8257E5',
    createdAt: '2026-10-17T08:43:47.426Z',
    updatedAt: '2026-10-17T08:43:47.426Z',
  },
];

function seedInitialFiles(): FileRecord[] {
  if (fs.existsSync(DB_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (Array.isArray(existing.files) && existing.files.length > 0) {
        return existing.files;
      }
    } catch {}
  }

  const sampleFiles: FileRecord[] = [
    {
      id: 'file_1792141493684_gq72s',
      name: 'HĐTN TUẦN 2.docx',
      originalName: 'HĐTN TUẦN 2.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 368593,
      folderId: 'f_1792136874703',
      folderName: 'HOẠT ĐỘNG TRẢI NGHIỆM',
      filename: '1792141493683-863214162.docx',
      uploadDate: '2026-10-16T09:04:53.684Z',
      updatedDate: '2026-10-16T09:04:53.684Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'HĐTN TUẦN 2.docx',
          size: 368593,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792141493683-863214162.docx',
        },
      ],
      previewContent: 'Tài liệu: HĐTN TUẦN 2.docx\nĐịnh dạng: DOCX\nKích thước: 0.35 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792141483069_2o3bh',
      name: 'TNXH TUẦN 2.docx',
      originalName: 'TNXH TUẦN 2.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 856628,
      folderId: 'f_1792136866375',
      folderName: 'TỰ NHIÊN VÀ XÃ HỘI',
      filename: '1792141483068-955081297.docx',
      uploadDate: '2026-10-16T09:04:43.069Z',
      updatedDate: '2026-10-16T09:04:43.069Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'TNXH TUẦN 2.docx',
          size: 856628,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792141483068-955081297.docx',
        },
      ],
      previewContent: 'Tài liệu: TNXH TUẦN 2.docx\nĐịnh dạng: DOCX\nKích thước: 0.82 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792141467817_sy12j',
      name: 'ĐẠO ĐỨC TUẦN 2.docx',
      originalName: 'ĐẠO ĐỨC TUẦN 2.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 1540502,
      folderId: 'f_1792136843359',
      folderName: 'ĐẠO ĐỨC',
      filename: '1792141467815-634987161.docx',
      uploadDate: '2026-10-16T09:04:27.817Z',
      updatedDate: '2026-10-16T09:04:27.817Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'ĐẠO ĐỨC TUẦN 2.docx',
          size: 1540502,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792141467815-634987161.docx',
        },
      ],
      previewContent: 'Tài liệu: ĐẠO ĐỨC TUẦN 2.docx\nĐịnh dạng: DOCX\nKích thước: 1.47 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792141450887_pq6co',
      name: 'TOÁN TUẦN 2.docx',
      originalName: 'TOÁN TUẦN 2.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 12434541,
      folderId: 'f_1792136833788',
      folderName: 'TOÁN',
      filename: '1792141450844-454700370.docx',
      uploadDate: '2026-10-16T09:04:10.887Z',
      updatedDate: '2026-10-16T09:04:10.887Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'TOÁN TUẦN 2.docx',
          size: 12434541,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792141450844-454700370.docx',
        },
      ],
      previewContent: 'Tài liệu: TOÁN TUẦN 2.docx\nĐịnh dạng: DOCX\nKích thước: 11.86 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792141426726_iajp0',
      name: 'TV TUẦN 2.docx',
      originalName: 'TV TUẦN 2.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 1918116,
      folderId: 'f_1792136755685',
      folderName: 'TIẾNG VIỆT',
      filename: '1792141426723-860286402.docx',
      uploadDate: '2026-10-16T09:03:46.726Z',
      updatedDate: '2026-10-16T09:03:46.726Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'TV TUẦN 2.docx',
          size: 1918116,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792141426723-860286402.docx',
        },
      ],
      previewContent: 'Tài liệu: TV TUẦN 2.docx\nĐịnh dạng: DOCX\nKích thước: 1.83 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792141405422_ca42h',
      name: 'TV TUẦN 1.docx',
      originalName: 'TV TUẦN 1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 1728151,
      folderId: 'f_1792136755685',
      folderName: 'TIẾNG VIỆT',
      filename: '1792141405419-935678625.docx',
      uploadDate: '2026-10-16T09:03:25.422Z',
      updatedDate: '2026-10-16T09:03:25.422Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'TV TUẦN 1.docx',
          size: 1728151,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792141405419-935678625.docx',
        },
      ],
      previewContent: 'Tài liệu: TV TUẦN 1.docx\nĐịnh dạng: DOCX\nKích thước: 1.65 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792136919534_v18a2',
      name: 'HĐTN TUẦN 1.docx',
      originalName: 'HĐTN TUẦN 1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 840439,
      folderId: 'f_1792136874703',
      folderName: 'HOẠT ĐỘNG TRẢI NGHIỆM',
      filename: '1792136919533-408359090.docx',
      uploadDate: '2026-10-16T07:48:39.534Z',
      updatedDate: '2026-10-16T07:48:39.534Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'HĐTN TUẦN 1.docx',
          size: 840439,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792136919533-408359090.docx',
        },
      ],
      previewContent: 'Tài liệu: HĐTN TUẦN 1.docx\nĐịnh dạng: DOCX\nKích thước: 0.80 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792136909738_bkxjo',
      name: 'TNXH TUẦN 1.docx',
      originalName: 'TNXH TUẦN 1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 573509,
      folderId: 'f_1792136866375',
      folderName: 'TỰ NHIÊN VÀ XÃ HỘI',
      filename: '1792136909738-412497441.docx',
      uploadDate: '2026-10-16T07:48:29.738Z',
      updatedDate: '2026-10-16T07:48:29.738Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'TNXH TUẦN 1.docx',
          size: 573509,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792136909738-412497441.docx',
        },
      ],
      previewContent: 'Tài liệu: TNXH TUẦN 1.docx\nĐịnh dạng: DOCX\nKích thước: 0.55 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792136899003_2oz7s',
      name: 'ĐẠO ĐỨC TUẦN 1.docx',
      originalName: 'ĐẠO ĐỨC TUẦN 1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 1496953,
      folderId: 'f_1792136843359',
      folderName: 'ĐẠO ĐỨC',
      filename: '1792136899002-179801982.docx',
      uploadDate: '2026-10-16T07:48:19.003Z',
      updatedDate: '2026-10-16T07:48:19.003Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'ĐẠO ĐỨC TUẦN 1.docx',
          size: 1496953,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792136899002-179801982.docx',
        },
      ],
      previewContent: 'Tài liệu: ĐẠO ĐỨC TUẦN 1.docx\nĐịnh dạng: DOCX\nKích thước: 1.43 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792136886697_4jp4r',
      name: 'TOÁN TUẦN 1.docx',
      originalName: 'TOÁN TUẦN 1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 6812855,
      folderId: 'f_1792136833788',
      folderName: 'TOÁN',
      filename: '1792136886679-350314422.docx',
      uploadDate: '2026-10-16T07:48:06.697Z',
      updatedDate: '2026-10-16T07:48:06.697Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: 'TOÁN TUẦN 1.docx',
          size: 6812855,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792136886679-350314422.docx',
        },
      ],
      previewContent: 'Tài liệu: TOÁN TUẦN 1.docx\nĐịnh dạng: DOCX\nKích thước: 6.50 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
    {
      id: 'file_1792136795091_1g9hf',
      name: 'TV TUẦN 1.docx',
      originalName: 'TV TUẦN 1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word',
      size: 1728151,
      folderId: 'f_1792136755685',
      folderName: 'TIẾNG VIỆT',
      filename: '1792136795089-61064879.docx',
      uploadDate: '2026-10-16T07:46:35.091Z',
      updatedDate: '2026-10-16T07:46:35.092Z',
      isFavorite: false,
      isDeleted: true,
      deletedAt: '2026-10-16T09:03:38.675Z',
      versions: [
        {
          version: 1,
          name: 'TV TUẦN 1.docx',
          size: 1728151,
          uploadDate: '2026-10-16',
          updatedBy: 'TỪ VĂN GỌN',
          filename: '1792136795089-61064879.docx',
        },
      ],
      previewContent: 'Tài liệu: TV TUẦN 1.docx\nĐịnh dạng: DOCX\nKích thước: 1.65 MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.',
    },
  ];

  // Write physical file representations in uploads directory if missing
  sampleFiles.forEach((file) => {
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, file.previewContent || `Tài liệu: ${file.name}\nChủ sở hữu: Thầy Từ Văn Gọn - TH Phường An Xuyên, Cà Mau.`);
    }
  });

  return sampleFiles;
}

// Database helper
function getDB(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const initialFiles = seedInitialFiles();
    const db: DatabaseSchema = {
      user: initialUser,
      folders: defaultFolders,
      files: initialFiles,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed: DatabaseSchema = JSON.parse(content);
    let changed = false;
    if (!parsed.folders || parsed.folders.length === 0) {
      parsed.folders = defaultFolders;
      changed = true;
    }
    if (!parsed.files || parsed.files.length === 0) {
      parsed.files = seedInitialFiles();
      changed = true;
    }
    if (changed) {
      saveDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, re-initializing', err);
    const initialFiles = seedInitialFiles();
    const db: DatabaseSchema = {
      user: initialUser,
      folders: defaultFolders,
      files: initialFiles,
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }
}

function saveDB(db: DatabaseSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
});

const chunkUpload = multer({
  dest: CHUNKS_TEMP_DIR,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB max per chunk
});

// Determine category by extension
function categorizeFile(filename: string): 'pdf' | 'word' | 'excel' | 'powerpoint' | 'image' | 'video' | 'zip' | 'other' {
  const ext = path.extname(filename).toLowerCase().replace('.', '');
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return 'video';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'zip';
  return 'other';
}

// ================= SUPABASE SYNC HELPERS =================
async function syncFolderToSupabase(folder: FolderRecord, action: 'upsert' | 'delete') {
  try {
    if (action === 'delete') {
      await supabase.from('folders').delete().eq('id', folder.id);
    } else {
      await supabase.from('folders').upsert({
        id: folder.id,
        name: folder.name,
        code: folder.code,
        parent_id: folder.parentId || null,
        color: folder.color,
        created_at: folder.createdAt,
        updated_at: folder.updatedAt,
      });
    }
  } catch (e) {
    // Graceful fallback if tables not yet created
  }
}

async function syncFileToSupabase(file: FileRecord, action: 'upsert' | 'delete') {
  try {
    if (action === 'delete') {
      await supabase.from('files').delete().eq('id', file.id);
    } else {
      await supabase.from('files').upsert({
        id: file.id,
        name: file.name,
        original_name: file.originalName,
        mime_type: file.mimeType,
        extension: file.extension,
        category: file.category,
        size: file.size,
        folder_id: file.folderId,
        folder_name: file.folderName,
        filename: file.filename,
        upload_date: file.uploadDate,
        updated_date: file.updatedDate,
        is_favorite: file.isFavorite,
        is_deleted: file.isDeleted,
        deleted_at: file.deletedAt || null,
        versions: file.versions || [],
        share_config: file.shareConfig || null,
        preview_content: file.previewContent || null,
      });
    }
  } catch (e) {
    // Graceful fallback if tables not yet created
  }
}

async function syncUserToSupabase(user: UserProfile) {
  try {
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
      last_login: user.lastLogin || new Date().toISOString(),
    });
  } catch (e) {
    // Graceful fallback
  }
}

// ================= API ROUTES =================

// 0. Supabase Integration Endpoints
app.get('/api/supabase/status', async (_req, res) => {
  const status = {
    connected: false,
    url: SUPABASE_URL,
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
    tables: {
      folders: false,
      files: false,
      user_profile: false,
    },
    storage: {
      bucketExists: false,
    },
    isFullyReady: false,
    message: '',
  };

  try {
    // Check tables
    const [foldersRes, filesRes, userRes, storageRes] = await Promise.all([
      supabase.from('folders').select('id').limit(1),
      supabase.from('files').select('id').limit(1),
      supabase.from('user_profile').select('id').limit(1),
      supabase.storage.listBuckets().catch(() => ({ data: [], error: null })),
    ]);

    status.tables.folders = !foldersRes.error;
    status.tables.files = !filesRes.error;
    status.tables.user_profile = !userRes.error;

    if (storageRes && Array.isArray(storageRes.data)) {
      status.storage.bucketExists = storageRes.data.some((b) => b.name === 'documents' || b.id === 'documents');
    }

    status.connected = true;
    status.isFullyReady = status.tables.folders && status.tables.files && status.tables.user_profile;
    status.message = status.isFullyReady
      ? 'Đã kết nối và các bảng dữ liệu trên Supabase đã sẵn sàng hoạt động!'
      : 'Đã kết nối tới URL Supabase. Cần chạy mã lệnh SQL trong Supabase SQL Editor để khởi tạo các bảng và Storage.';

    res.json({ success: true, status });
  } catch (err: any) {
    res.json({
      success: false,
      status: {
        ...status,
        message: 'Lỗi kiểm tra Supabase: ' + err.message,
      },
    });
  }
});

app.post('/api/supabase/sync', async (_req, res) => {
  try {
    const db = getDB();

    // 1. Sync User Profile
    const { error: userErr } = await supabase.from('user_profile').upsert({
      id: db.user.id || 'user_gon_01',
      full_name: db.user.fullName,
      role: db.user.role,
      school: db.user.school,
      location: db.user.location,
      email: db.user.email,
      phone: db.user.phone,
      storage_used_bytes: db.user.storageUsedBytes,
      storage_max_bytes: db.user.storageMaxBytes,
      avatar_url: db.user.avatarUrl,
      two_factor_enabled: db.user.twoFactorEnabled,
      last_login: db.user.lastLogin || new Date().toISOString(),
    });

    // 2. Sync Folders
    const folderPayloads = db.folders.map((f) => ({
      id: f.id,
      name: f.name,
      code: f.code,
      parent_id: f.parentId || null,
      color: f.color || '#0866E8',
      created_at: f.createdAt,
      updated_at: f.updatedAt,
    }));
    const { error: folderErr } = await supabase.from('folders').upsert(folderPayloads);

    // 3. Sync Files
    const filePayloads = db.files.map((f) => ({
      id: f.id,
      name: f.name,
      original_name: f.originalName,
      mime_type: f.mimeType,
      extension: f.extension,
      category: f.category,
      size: f.size,
      folder_id: f.folderId,
      folder_name: f.folderName,
      filename: f.filename,
      upload_date: f.uploadDate,
      updated_date: f.updatedDate,
      is_favorite: f.isFavorite,
      is_deleted: f.isDeleted,
      deleted_at: f.deletedAt || null,
      versions: f.versions || [],
      share_config: f.shareConfig || null,
      preview_content: f.previewContent || null,
    }));
    const { error: fileErr } = await supabase.from('files').upsert(filePayloads);

    if (userErr || folderErr || fileErr) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi khi đồng bộ lên Supabase: ' + (userErr?.message || folderErr?.message || fileErr?.message),
        errors: { userErr, folderErr, fileErr },
      });
    }

    res.json({
      success: true,
      message: `Đã đồng bộ thành công ${folderPayloads.length} thư mục và ${filePayloads.length} tài liệu lên Supabase!`,
      syncedFolders: folderPayloads.length,
      syncedFiles: filePayloads.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi xử lý đồng bộ: ' + err.message });
  }
});

// Pull all data from Supabase to local DB
app.post('/api/supabase/pull', async (_req, res) => {
  try {
    const [foldersRes, filesRes, userRes] = await Promise.all([
      supabase.from('folders').select('*'),
      supabase.from('files').select('*'),
      supabase.from('user_profile').select('*').limit(1),
    ]);

    if (foldersRes.error || filesRes.error) {
      return res.status(400).json({
        success: false,
        message: 'Lỗi tải dữ liệu từ Supabase: ' + (foldersRes.error?.message || filesRes.error?.message),
      });
    }

    const db = getDB();

    if (userRes.data && userRes.data.length > 0) {
      const u = userRes.data[0];
      db.user = {
        id: u.id || db.user.id,
        fullName: u.full_name || db.user.fullName,
        role: u.role || db.user.role,
        school: u.school || db.user.school,
        location: u.location || db.user.location,
        email: u.email || db.user.email,
        phone: u.phone || db.user.phone,
        storageUsedBytes: Number(u.storage_used_bytes || db.user.storageUsedBytes),
        storageMaxBytes: Number(u.storage_max_bytes || db.user.storageMaxBytes),
        avatarUrl: u.avatar_url || db.user.avatarUrl,
        twoFactorEnabled: u.two_factor_enabled ?? db.user.twoFactorEnabled,
        lastLogin: u.last_login || db.user.lastLogin,
      };
    }

    if (Array.isArray(foldersRes.data) && foldersRes.data.length > 0) {
      for (const row of foldersRes.data) {
        const item: FolderRecord = {
          id: row.id,
          name: row.name,
          code: row.code || '',
          parentId: row.parent_id || null,
          color: row.color || '#0866E8',
          createdAt: row.created_at || new Date().toISOString(),
          updatedAt: row.updated_at || new Date().toISOString(),
        };
        const idx = db.folders.findIndex((f) => f.id === row.id);
        if (idx >= 0) {
          db.folders[idx] = item;
        } else {
          db.folders.push(item);
        }
      }
    }

    if (Array.isArray(filesRes.data) && filesRes.data.length > 0) {
      for (const row of filesRes.data) {
        const item: FileRecord = {
          id: row.id,
          name: row.name,
          originalName: row.original_name || row.name,
          mimeType: row.mime_type || 'application/octet-stream',
          extension: row.extension || 'docx',
          category: row.category || 'word',
          size: Number(row.size || 0),
          folderId: row.folder_id,
          folderName: row.folder_name,
          filename: row.filename || `${row.id}.dat`,
          uploadDate: row.upload_date || new Date().toISOString(),
          updatedDate: row.updated_date || new Date().toISOString(),
          isFavorite: Boolean(row.is_favorite),
          isDeleted: Boolean(row.is_deleted),
          deletedAt: row.deleted_at || undefined,
          versions: row.versions || [],
          shareConfig: row.share_config || undefined,
          previewContent: row.preview_content || undefined,
        };
        const idx = db.files.findIndex((f) => f.id === row.id);
        if (idx >= 0) {
          db.files[idx] = item;
        } else {
          db.files.unshift(item);
        }
      }
    }

    saveDB(db);

    res.json({
      success: true,
      message: `Đã nạp thành công ${foldersRes.data?.length || 0} thư mục và ${filesRes.data?.length || 0} tài liệu từ Supabase!`,
      foldersCount: db.folders.length,
      filesCount: db.files.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi tải dữ liệu: ' + err.message });
  }
});


// Restore database with lesson plans and all folders
app.post('/api/database/restore', (_req, res) => {
  let existingUser = initialUser;
  let existingFiles: FileRecord[] = [];
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (parsed.user) existingUser = parsed.user;
      if (Array.isArray(parsed.files) && parsed.files.length > 0) existingFiles = parsed.files;
    } catch {}
  }

  const db: DatabaseSchema = {
    user: existingUser,
    folders: defaultFolders,
    files: existingFiles.length > 0 ? existingFiles : seedInitialFiles(),
  };
  saveDB(db);
  res.json({
    success: true,
    message: 'Đã khôi phục toàn bộ hệ thống 11 thư mục giáo án và tài liệu của Thầy Gọn!',
    folders: db.folders,
    files: db.files,
  });
});

// 1. User Profile & Settings
app.get('/api/user', (_req, res) => {
  const db = getDB();
  res.json({ success: true, user: db.user });
});

app.put('/api/user', (req, res) => {
  const db = getDB();
  db.user = { ...db.user, ...req.body };
  saveDB(db);
  syncUserToSupabase(db.user);
  res.json({ success: true, user: db.user });
});

// 2. Stats Dashboard
app.get('/api/stats', (_req, res) => {
  const db = getDB();
  const activeFiles = db.files.filter((f) => !f.isDeleted);
  
  const categoryCounts = {
    pdf: 0,
    word: 0,
    excel: 0,
    powerpoint: 0,
    image: 0,
    video: 0,
    zip: 0,
    other: 0,
  };

  const categorySizes = {
    pdf: 0,
    word: 0,
    excel: 0,
    powerpoint: 0,
    image: 0,
    video: 0,
    zip: 0,
    other: 0,
  };

  let totalSize = 0;
  activeFiles.forEach((file) => {
    const cat = file.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    categorySizes[cat] = (categorySizes[cat] || 0) + (file.size || 0);
    totalSize += file.size || 0;
  });

  // Calculate percentages
  const totalCount = activeFiles.length;
  const percentages = {
    pdf: totalCount ? Math.round((categoryCounts.pdf / totalCount) * 100) : 0,
    word: totalCount ? Math.round((categoryCounts.word / totalCount) * 100) : 0,
    excel: totalCount ? Math.round((categoryCounts.excel / totalCount) * 100) : 0,
    powerpoint: totalCount ? Math.round((categoryCounts.powerpoint / totalCount) * 100) : 0,
    image: totalCount ? Math.round((categoryCounts.image / totalCount) * 100) : 0,
    video: totalCount ? Math.round((categoryCounts.video / totalCount) * 100) : 0,
    other: totalCount ? Math.round(((categoryCounts.zip + categoryCounts.other) / totalCount) * 100) : 0,
  };

  res.json({
    success: true,
    stats: {
      totalDocuments: totalCount,
      totalStorageBytes: totalSize,
      maxStorageBytes: db.user.storageMaxBytes,
      usedPercentage: Number(((totalSize / db.user.storageMaxBytes) * 100).toFixed(1)),
      counts: categoryCounts,
      sizes: categorySizes,
      percentages,
      totalFolders: db.folders.filter((f) => !f.parentId).length,
      trashCount: db.files.filter((f) => f.isDeleted).length,
    },
  });
});

// 3. Folders Management
app.get('/api/folders', (_req, res) => {
  const db = getDB();
  const activeFiles = db.files.filter((f) => !f.isDeleted);

  // Helper to find all descendant folder IDs recursively
  const getDescendantFolderIds = (folderId: string): string[] => {
    const directChildren = db.folders.filter((f) => f.parentId === folderId);
    let ids: string[] = [];
    for (const child of directChildren) {
      ids.push(child.id);
      ids = ids.concat(getDescendantFolderIds(child.id));
    }
    return ids;
  };

  // Compute folder item count & total size (direct + recursive)
  const foldersWithMeta = db.folders.map((folder) => {
    const descendantIds = [folder.id, ...getDescendantFolderIds(folder.id)];
    const filesInTree = activeFiles.filter((f) => descendantIds.includes(f.folderId));
    const directFiles = activeFiles.filter((f) => f.folderId === folder.id);
    const directChildren = db.folders.filter((f) => f.parentId === folder.id);
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

  res.json({ success: true, folders: foldersWithMeta });
});

app.post('/api/folders', (req, res) => {
  const { name, parentId, color } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Tên thư mục không được để trống' });

  const db = getDB();
  const nextNum = db.folders.length + 1;
  const code = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;

  const newFolder: FolderRecord = {
    id: `f_${Date.now()}`,
    name,
    code,
    parentId: parentId || null,
    color: color || '#0866E8',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.folders.push(newFolder);
  saveDB(db);
  syncFolderToSupabase(newFolder, 'upsert');
  res.json({ success: true, folder: newFolder });
});

app.put('/api/folders/:id', (req, res) => {
  const { id } = req.params;
  const { name, color, parentId } = req.body;
  const db = getDB();

  const idx = db.folders.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Thư mục không tồn tại' });

  if (name) db.folders[idx].name = name;
  if (color) db.folders[idx].color = color;
  if (parentId !== undefined) db.folders[idx].parentId = parentId;
  db.folders[idx].updatedAt = new Date().toISOString();

  // If name changed, update folderName in files
  if (name) {
    db.files.forEach((file) => {
      if (file.folderId === id) {
        file.folderName = name;
        syncFileToSupabase(file, 'upsert');
      }
    });
  }

  saveDB(db);
  syncFolderToSupabase(db.folders[idx], 'upsert');
  res.json({ success: true, folder: db.folders[idx] });
});

app.delete('/api/folders/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();

  const idx = db.folders.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Thư mục không tồn tại' });

  // Move all files in this folder to Trash
  const deletedFolder = db.folders.splice(idx, 1)[0];
  db.files.forEach((file) => {
    if (file.folderId === id) {
      file.isDeleted = true;
      file.deletedAt = new Date().toISOString();
      syncFileToSupabase(file, 'upsert');
    }
  });

  saveDB(db);
  syncFolderToSupabase(deletedFolder, 'delete');
  res.json({ success: true, message: `Đã xóa thư mục ${deletedFolder.name} và chuyển các tệp vào thùng rác` });
});

// 4. Files Management
app.get('/api/files', (req, res) => {
  const { folderId, category, search, favorite, trash } = req.query;
  const db = getDB();

  let results = db.files;

  if (trash === 'true') {
    results = results.filter((f) => f.isDeleted);
  } else {
    results = results.filter((f) => !f.isDeleted);
  }

  if (folderId && folderId !== 'all') {
    results = results.filter((f) => f.folderId === folderId);
  }

  if (category && category !== 'all') {
    results = results.filter((f) => f.category === category);
  }

  if (favorite === 'true') {
    results = results.filter((f) => f.isFavorite);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.folderName && f.folderName.toLowerCase().includes(q)) ||
        (f.previewContent && f.previewContent.toLowerCase().includes(q))
    );
  }

  // Sorting: Default to natural sort by name ascending (Tuần 1 -> Tuần 35, where Tuần 35 is at the end)
  const sortBy = req.query.sortBy as string | undefined;
  const order = (req.query.order as string) || 'asc';

  if (sortBy === 'date') {
    results.sort((a, b) =>
      order === 'desc'
        ? new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime()
        : new Date(a.updatedDate).getTime() - new Date(b.updatedDate).getTime()
    );
  } else if (sortBy === 'size') {
    results.sort((a, b) => (order === 'desc' ? (b.size || 0) - (a.size || 0) : (a.size || 0) - (b.size || 0)));
  } else if (sortBy === 'date_desc') {
    results.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());
  } else {
    // Default: natural Vietnamese sort (e.g. TV TUẦN 1 -> TV TUẦN 35 at the bottom)
    results.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'vi', { numeric: true, sensitivity: 'base' });
      return order === 'desc' ? -cmp : cmp;
    });
  }

  res.json({ success: true, files: results });
});

// Reorder file (move to start or move to end)
app.post('/api/files/:id/reorder', (req, res) => {
  const { id } = req.params;
  const { position } = req.body;
  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });

  const targetFile = db.files.splice(idx, 1)[0];
  if (position === 'start') {
    db.files.unshift(targetFile);
  } else {
    db.files.push(targetFile);
  }
  targetFile.updatedDate = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, message: position === 'end' ? 'Đã chuyển tệp xuống cuối cùng' : 'Đã chuyển tệp lên đầu tiên', file: targetFile });
});

// 5. File Upload (Supports multi-file)
app.post('/api/upload', upload.array('files', 20), (req, res) => {
  try {
    const uploadedFiles = req.files as Express.Multer.File[];
    const folderId = req.body.folderId || 'f_01';

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có tệp nào được tải lên' });
    }

    const db = getDB();
    const targetFolder =
      (db.folders && db.folders.find((f) => f.id === folderId)) ||
      (db.folders && db.folders[0]) || { id: 'f_01', name: 'Tài liệu' };

    const addedFiles: FileRecord[] = [];

    for (const file of uploadedFiles) {
      let cleanOriginalName = file.originalname;
      try {
        cleanOriginalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      } catch (e) {}

      const ext = path.extname(cleanOriginalName).toLowerCase().replace('.', '');
      const category = categorizeFile(cleanOriginalName);

      let previewContent = '';
      if (['txt', 'md', 'csv', 'json'].includes(ext)) {
        try {
          previewContent = fs.readFileSync(file.path, 'utf-8').slice(0, 5000);
        } catch (err) {
          console.error(err);
        }
      } else {
        previewContent = `Tài liệu: ${cleanOriginalName}\nĐịnh dạng: ${ext.toUpperCase()}\nKích thước: ${(file.size / (1024 * 1024)).toFixed(2)} MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.`;
      }

      const newFile: FileRecord = {
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanOriginalName,
        originalName: cleanOriginalName,
        mimeType: file.mimetype || 'application/octet-stream',
        extension: ext,
        category,
        size: file.size,
        folderId: targetFolder.id,
        folderName: targetFolder.name,
        filename: file.filename,
        uploadDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        isFavorite: false,
        isDeleted: false,
        versions: [
          {
            version: 1,
            name: cleanOriginalName,
            size: file.size,
            uploadDate: new Date().toISOString().split('T')[0],
            updatedBy: db.user.fullName,
            filename: file.filename,
          },
        ],
        previewContent,
      };

      db.files.unshift(newFile);
      addedFiles.push(newFile);
      syncFileToSupabase(newFile, 'upsert');
    }

    saveDB(db);
    res.json({
      success: true,
      message: `Đã tải lên thành công ${addedFiles.length} tệp`,
      files: addedFiles,
    });
  } catch (err: any) {
    console.error('Lỗi tải tệp /api/upload:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tải tệp: ' + err.message });
  }
});

// 5b. Resilient Direct Upload via JSON / Base64 (Preserves UTF-8)
app.post('/api/upload-json', (req, res) => {
  try {
    const { name, size, mimeType, folderId, base64Content } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Thiếu tên tệp' });
    }

    const db = getDB();
    const targetFolder =
      (db.folders && db.folders.find((f) => f.id === folderId)) ||
      (db.folders && db.folders[0]) || { id: 'f_01', name: 'Tài liệu' };

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(name).toLowerCase().replace('.', '');
    const physicalFilename = `${uniqueSuffix}.${ext || 'dat'}`;
    const filePath = path.join(UPLOADS_DIR, physicalFilename);

    let previewContent = '';
    if (base64Content) {
      const buffer = Buffer.from(base64Content.replace(/^data:.*?;base64,/, ''), 'base64');
      fs.writeFileSync(filePath, buffer);

      if (['txt', 'md', 'csv', 'json'].includes(ext)) {
        try {
          previewContent = buffer.toString('utf-8').slice(0, 5000);
        } catch (e) {}
      }
    } else {
      fs.writeFileSync(filePath, Buffer.from(`Tài liệu: ${name}\nThầy Từ Văn Gọn - Trường TH Phường An Xuyên`));
    }

    if (!previewContent) {
      previewContent = `Tài liệu: ${name}\nĐịnh dạng: ${ext.toUpperCase()}\nKích thước: ${(size ? size / (1024 * 1024) : 0).toFixed(2)} MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.`;
    }

    const category = categorizeFile(name);
    const newFile: FileRecord = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      originalName: name,
      mimeType: mimeType || 'application/octet-stream',
      extension: ext,
      category,
      size: size || (fs.existsSync(filePath) ? fs.statSync(filePath).size : 0),
      folderId: targetFolder.id,
      folderName: targetFolder.name,
      filename: physicalFilename,
      uploadDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name,
          size: size || 0,
          uploadDate: new Date().toISOString().split('T')[0],
          updatedBy: db.user.fullName,
          filename: physicalFilename,
        },
      ],
      previewContent,
    };

    db.files.unshift(newFile);
    saveDB(db);
    syncFileToSupabase(newFile, 'upsert');

    res.json({
      success: true,
      message: 'Tải lên tệp thành công',
      files: [newFile],
    });
  } catch (err: any) {
    console.error('Lỗi tải tệp /api/upload-json:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu tệp: ' + err.message });
  }
});

// 5c. Chunked File Upload (Solves Cloud Run 32MB payload limit for large files like 47.7MB GeoGebra up to 2GB)
app.post('/api/upload-chunk', chunkUpload.single('chunk'), async (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks, filename, fileSize, mimeType, folderId } = req.body;
    const chunkFile = req.file;

    if (!uploadId || chunkIndex === undefined || !totalChunks || !filename) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin phân đoạn tải lên' });
    }

    const cIndex = parseInt(chunkIndex, 10);
    const tChunks = parseInt(totalChunks, 10);
    const uploadSessionDir = path.join(CHUNKS_TEMP_DIR, uploadId);

    if (!fs.existsSync(uploadSessionDir)) {
      fs.mkdirSync(uploadSessionDir, { recursive: true });
    }

    if (chunkFile) {
      const chunkTarget = path.join(uploadSessionDir, `part_${cIndex}`);
      fs.renameSync(chunkFile.path, chunkTarget);
    }

    // Check if all chunks have arrived
    let isComplete = true;
    for (let i = 0; i < tChunks; i++) {
      if (!fs.existsSync(path.join(uploadSessionDir, `part_${i}`))) {
        isComplete = false;
        break;
      }
    }

    if (!isComplete) {
      return res.json({
        success: true,
        isComplete: false,
        chunkIndex: cIndex,
        totalChunks: tChunks,
        message: `Đã nhận phân đoạn ${cIndex + 1}/${tChunks}`,
      });
    }

    // All chunks arrived: Assemble into final file in UPLOADS_DIR
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    const physicalFilename = `${uniqueSuffix}.${ext || 'dat'}`;
    const finalFilePath = path.join(UPLOADS_DIR, physicalFilename);

    const writeStream = fs.createWriteStream(finalFilePath);
    for (let i = 0; i < tChunks; i++) {
      const partPath = path.join(uploadSessionDir, `part_${i}`);
      const partData = fs.readFileSync(partPath);
      writeStream.write(partData);
      try {
        fs.unlinkSync(partPath);
      } catch (e) {}
    }
    writeStream.end();

    // Clean up session directory
    try {
      fs.rmdirSync(uploadSessionDir);
    } catch (e) {}

    const db = getDB();
    const targetFolder =
      (db.folders && db.folders.find((f) => f.id === folderId)) ||
      (db.folders && db.folders[0]) || { id: 'f_01', name: 'Tài liệu' };

    const parsedSize = parseInt(fileSize, 10) || (fs.existsSync(finalFilePath) ? fs.statSync(finalFilePath).size : 0);
    let previewContent = '';
    if (['txt', 'md', 'csv', 'json'].includes(ext)) {
      try {
        previewContent = fs.readFileSync(finalFilePath, 'utf-8').slice(0, 5000);
      } catch (e) {}
    }
    if (!previewContent) {
      previewContent = `Tài liệu: ${filename}\nĐịnh dạng: ${ext.toUpperCase()}\nKích thước: ${(parsedSize / (1024 * 1024)).toFixed(2)} MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.`;
    }

    const category = categorizeFile(filename);
    const newFile: FileRecord = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: filename,
      originalName: filename,
      mimeType: mimeType || 'application/octet-stream',
      extension: ext,
      category,
      size: parsedSize,
      folderId: targetFolder.id,
      folderName: targetFolder.name,
      filename: physicalFilename,
      uploadDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      isFavorite: false,
      isDeleted: false,
      versions: [
        {
          version: 1,
          name: filename,
          size: parsedSize,
          uploadDate: new Date().toISOString().split('T')[0],
          updatedBy: db.user.fullName,
          filename: physicalFilename,
        },
      ],
      previewContent,
    };

    db.files.unshift(newFile);
    saveDB(db);
    syncFileToSupabase(newFile, 'upsert');

    return res.json({
      success: true,
      isComplete: true,
      message: 'Tải lên tệp thành công!',
      files: [newFile],
    });
  } catch (err: any) {
    console.error('Lỗi tải tệp phân đoạn /api/upload-chunk:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi ghép tệp: ' + err.message });
  }
});

// 6. File Details, Update, Delete & Restore
app.get('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const file = db.files.find((f) => f.id === id);
  if (!file) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });
  res.json({ success: true, file });
});

app.put('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });

  const { name, isFavorite, folderId } = req.body;
  if (name !== undefined) db.files[idx].name = name;
  if (isFavorite !== undefined) db.files[idx].isFavorite = isFavorite;
  if (folderId !== undefined) {
    const fld = db.folders.find((f) => f.id === folderId);
    if (fld) {
      db.files[idx].folderId = fld.id;
      db.files[idx].folderName = fld.name;
    }
  }
  db.files[idx].updatedDate = new Date().toISOString();

  saveDB(db);
  syncFileToSupabase(db.files[idx], 'upsert');
  res.json({ success: true, file: db.files[idx] });
});

// Soft Delete (Move to Trash)
app.delete('/api/files/:id', async (req, res) => {
  const { id } = req.params;
  const { permanent } = req.query;
  const isPermanent = permanent === 'true';
  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);

  if (idx !== -1) {
    if (isPermanent) {
      const removed = db.files.splice(idx, 1)[0];
      const physicalPath = path.join(UPLOADS_DIR, removed.filename);
      if (fs.existsSync(physicalPath)) {
        try { fs.unlinkSync(physicalPath); } catch (e) { console.error(e); }
      }
    } else {
      db.files[idx].isDeleted = true;
      db.files[idx].deletedAt = new Date().toISOString();
    }
    saveDB(db);
  }

  // Always sync to Supabase
  try {
    if (isPermanent) {
      await supabase.from('files').delete().eq('id', id);
    } else {
      await supabase.from('files').update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      }).eq('id', id);
    }
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }

  res.json({
    success: true,
    message: isPermanent ? 'Đã xóa vĩnh viễn tệp' : 'Đã chuyển tệp vào thùng rác',
  });
});

// Restore from Trash
app.post('/api/files/:id/restore', async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);
  if (idx !== -1) {
    db.files[idx].isDeleted = false;
    db.files[idx].deletedAt = undefined;
    saveDB(db);
  }

  try {
    await supabase.from('files').update({
      is_deleted: false,
      deleted_at: null,
    }).eq('id', id);
  } catch (err) {
    console.warn('Supabase restore error:', err);
  }

  res.json({ success: true, message: 'Đã khôi phục tệp thành công' });
});

// Empty Trash
app.delete('/api/trash/empty', async (_req, res) => {
  const db = getDB();
  const trashFiles = db.files.filter((f) => f.isDeleted);
  const trashIds = trashFiles.map((f) => f.id);
  trashFiles.forEach((file) => {
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error(e); }
    }
  });

  db.files = db.files.filter((f) => !f.isDeleted);
  saveDB(db);

  try {
    if (trashIds.length > 0) {
      await supabase.from('files').delete().in('id', trashIds);
    }
    await supabase.from('files').delete().eq('is_deleted', true);
  } catch (err) {
    console.warn('Supabase empty trash error:', err);
  }

  res.json({ success: true, message: `Đã dọn sạch ${trashFiles.length} tệp trong thùng rác` });
});

// Batch Delete Files (by IDs or all in folder or all active files)
app.post('/api/files/batch-delete', async (req, res) => {
  try {
    const { ids, folderId, all, permanent } = req.body;
    const isPermanent = permanent === true || permanent === 'true';
    const db = getDB();

    let targetIds: string[] = [];
    if (Array.isArray(ids) && ids.length > 0) {
      targetIds = ids;
    } else if (all) {
      if (folderId && folderId !== 'all') {
        targetIds = db.files.filter((f) => !f.isDeleted && f.folderId === folderId).map((f) => f.id);
      } else {
        targetIds = db.files.filter((f) => !f.isDeleted).map((f) => f.id);
      }
    }

    if (targetIds.length === 0) {
      return res.json({ success: true, count: 0, message: 'Không có tài liệu nào để xóa' });
    }

    const idSet = new Set(targetIds);
    const now = new Date().toISOString();

    if (isPermanent) {
      const removedFiles = db.files.filter((f) => idSet.has(f.id));
      removedFiles.forEach((file) => {
        const filePath = path.join(UPLOADS_DIR, file.filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) { console.error(e); }
        }
      });
      db.files = db.files.filter((f) => !idSet.has(f.id));
    } else {
      db.files.forEach((file) => {
        if (idSet.has(file.id)) {
          file.isDeleted = true;
          file.deletedAt = now;
        }
      });
    }

    saveDB(db);

    // Sync to Supabase
    try {
      if (isPermanent) {
        await supabase.from('files').delete().in('id', targetIds);
      } else {
        await supabase.from('files').update({
          is_deleted: true,
          deleted_at: now,
        }).in('id', targetIds);
      }
    } catch (err) {
      console.warn('Supabase batch delete sync error:', err);
    }

    res.json({
      success: true,
      count: targetIds.length,
      message: isPermanent
        ? `Đã xóa vĩnh viễn ${targetIds.length} tài liệu`
        : `Đã chuyển ${targetIds.length} tài liệu vào thùng rác`,
    });
  } catch (err: any) {
    console.error('Batch delete error:', err);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa tài liệu: ' + err.message });
  }
});

// Batch Restore Files (restore multiple files from trash)
app.post('/api/files/batch-restore', (req, res) => {
  try {
    const { ids, all } = req.body;
    const db = getDB();

    let count = 0;
    if (all) {
      db.files.forEach((f) => {
        if (f.isDeleted) {
          f.isDeleted = false;
          f.deletedAt = undefined;
          syncFileToSupabase(f, 'upsert');
          count++;
        }
      });
    } else if (Array.isArray(ids)) {
      const set = new Set(ids);
      db.files.forEach((f) => {
        if (set.has(f.id) && f.isDeleted) {
          f.isDeleted = false;
          f.deletedAt = undefined;
          syncFileToSupabase(f, 'upsert');
          count++;
        }
      });
    }

    saveDB(db);
    res.json({ success: true, count, message: `Đã khôi phục ${count} tài liệu thành công` });
  } catch (err: any) {
    console.error('Lỗi batch-restore:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi khôi phục tệp: ' + err.message });
  }
});

// 7. Version Management
app.post('/api/files/:id/version', upload.single('file'), (req, res) => {
  const { id } = req.params;
  const newUploaded = req.file;
  if (!newUploaded) return res.status(400).json({ success: false, message: 'Chưa tải lên tệp phiên bản mới' });

  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });

  const currentFile = db.files[idx];
  const nextVer = (currentFile.versions?.length || 0) + 1;

  const newVersion: FileVersion = {
    version: nextVer,
    name: `${path.parse(currentFile.name).name} (v${nextVer})${path.extname(currentFile.name)}`,
    size: newUploaded.size,
    uploadDate: new Date().toISOString().split('T')[0],
    updatedBy: db.user.fullName,
    filename: newUploaded.filename,
  };

  currentFile.versions.unshift(newVersion);
  currentFile.size = newUploaded.size;
  currentFile.filename = newUploaded.filename;
  currentFile.updatedDate = new Date().toISOString();

  saveDB(db);
  res.json({ success: true, message: `Đã cập nhật lên phiên bản v${nextVer}`, file: currentFile });
});

// 8. Sharing
app.post('/api/files/:id/share', (req, res) => {
  const { id } = req.params;
  const { email, accessRole, hasPassword, password, expiresInDays } = req.body;
  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });

  const shareToken = Math.random().toString(36).substring(2, 10);
  const shareConfig: SharedConfig = {
    isShared: true,
    shareUrl: `${req.protocol}://${req.get('host')}/shared/${shareToken}`,
    sharedWithEmails: email ? [email] : (db.files[idx].shareConfig?.sharedWithEmails || []),
    accessRole: accessRole || 'viewer',
    hasPassword: Boolean(hasPassword),
    password: password || '',
    expiresInDays: expiresInDays || 7,
    createdAt: new Date().toISOString(),
  };

  db.files[idx].shareConfig = shareConfig;
  saveDB(db);
  res.json({ success: true, shareConfig });
});

// 9. Download File
app.get('/api/files/:id/download', async (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const file = db.files.find((f) => f.id === id);
  if (!file) return res.status(404).send('Không tìm thấy tệp');

  const filePath = path.join(UPLOADS_DIR, file.filename);
  const isDocx = (file.extension || '').toLowerCase() === 'docx' || file.name.toLowerCase().endsWith('.docx');

  // Nếu là tệp Word (.docx), đảm bảo gửi tệp chuẩn Microsoft Word (magic header PK\x03\x04)
  if (isDocx) {
    if (isRealDocx(filePath)) {
      return res.download(filePath, file.name);
    }
    try {
      const buffer = await generateValidDocx(file.name, file.folderName, file.previewContent);
      fs.writeFileSync(filePath, buffer);
      return res.download(filePath, file.name);
    } catch (docxErr) {
      console.error('Lỗi phát sinh tệp docx:', docxErr);
    }
  }

  // Nếu tệp vật lý đã có sẵn và hợp lệ
  if (fs.existsSync(filePath)) {
    return res.download(filePath, file.name);
  }

  // Fallback synthetic download if sample
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
  res.setHeader('Content-Type', file.mimeType || 'text/plain; charset=utf-8');
  res.send(file.previewContent || `Nội dung tài liệu ${file.name} - Thầy Từ Văn Gọn`);
});

// 10. AI Assistant with Gemini 3.8 Flash
app.post('/api/ai/chat', async (req, res) => {
  const { message, fileContextId, actionType } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });

  const db = getDB();
  const activeFiles = db.files.filter((f) => !f.isDeleted);

  let docContext = '';
  if (fileContextId) {
    const targetFile = activeFiles.find((f) => f.id === fileContextId);
    if (targetFile) {
      docContext = `\nTÀI LIỆU ĐANG ĐƯỢC CHỌN:\n- Tên: ${targetFile.name}\n- Thư mục: ${targetFile.folderName}\n- Loại: ${targetFile.category}\n- Nội dung trích xuất/Tóm tắt: ${targetFile.previewContent || 'Không có sẵn văn bản trích xuất'}\n`;
    }
  }

  // System prompt tailored for Thầy Từ Văn Gọn - Tiểu học Phường An Xuyên, Cà Mau
  const systemInstruction = `
Bạn là "Trợ lý AI của Thầy Gọn" (Thầy Từ Văn Gọn - Giáo viên Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau).
Bạn am hiểu sâu sắc về:
1. Chương trình Giáo dục Phổ thông 2018 (GDPT 2018) cấp Tiểu học (đặc biệt Lớp 1, 2, 3, 4, 5).
2. Thông tư 27/2020/TT-BGDĐT quy định về đánh giá học sinh tiểu học (đánh giá thường xuyên, định kỳ, phẩm chất, năng lực).
3. Thiết kế giáo án (Kế hoạch bài dạy theo Công văn 2345/BGDĐT-GDTH), soạn đề kiểm tra ma trận, bài tập vui học, phương pháp dạy học tích cực, tích hợp STEM.
4. Quản lý kho tài liệu, gợi ý cách sắp xếp tài liệu khoa học cho giáo viên.
5. Soạn thảo nhận xét học sinh cuối kỳ chuẩn mực, nhân văn, khích lệ sự tiến bộ của từng em theo TT 27.

Danh sách các thư mục hiện có: ${db.folders.map((f) => f.name).join(', ')}.
Danh sách một số tệp tiêu biểu trong kho của thầy:
${activeFiles.slice(0, 15).map((f) => `- [${f.category.toUpperCase()}] ${f.name} (ở mục ${f.folderName})`).join('\n')}

Hãy xưng hô ấm áp, kính trọng, gọi là "Thầy Gọn" hoặc xưng "Em / Trợ lý AI của Thầy". Trả lời rõ ràng, sư phạm, chuẩn xác văn phong giáo dục Việt Nam. Có thể định dạng gạch đầu dòng, bảng biểu hoặc in đậm rõ ràng.
`;

  try {
    const promptText = `${docContext ? docContext + '\n' : ''}${message}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const aiAnswer = response.text || 'Xin lỗi Thầy Gọn, em chưa kịp xử lý yêu cầu này. Thầy vui lòng thử lại nhé!';

    res.json({
      success: true,
      reply: aiAnswer,
    });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    // Provide a helpful educational fallback if offline or no key
    const fallbackAnswers: Record<string, string> = {
      default: `Chào Thầy Từ Văn Gọn! Em đã nhận câu hỏi: "${message}".\n\nĐối với công tác giảng dạy tại Trường Tiểu học Phường An Xuyên, em gợi ý Thầy kiểm tra lại Thông tư 27/2020/TT-BGDĐT và Kế hoạch bài dạy Tuần hiện tại trong thư mục 03. GIÁO ÁN. Em luôn sẵn sàng hỗ trợ Thầy soạn giáo án, ma trận đề kiểm tra và viết nhận xét học sinh bất cứ lúc nào!`,
    };

    res.json({
      success: true,
      reply: fallbackAnswers.default,
      warning: 'Đang phản hồi từ chế độ trợ lý sư phạm dự phòng.',
    });
  }
});

// Quick Document Analysis Endpoint
app.post('/api/ai/analyze-file', async (req, res) => {
  const { fileId } = req.body;
  const db = getDB();
  const file = db.files.find((f) => f.id === fileId);

  if (!file) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });

  try {
    const prompt = `Phân tích tệp tài liệu giảng dạy của Thầy Từ Văn Gọn:
- Tên tệp: ${file.name}
- Loại: ${file.extension}
- Nội dung: ${file.previewContent || 'Tài liệu giáo dục tiểu học'}

Hãy cung cấp:
1. Tóm tắt nội dung chính (3-4 gạch đầu dòng)
2. Ý nghĩa sư phạm & Tính phù hợp với học sinh tiểu học (theo CT GDPT 2018)
3. Đề xuất hoạt động dạy học hoặc kiểm tra tương ứng
4. Gợi ý từ khóa tìm kiếm liên quan trong kho dữ liệu`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (err: any) {
    res.json({
      success: true,
      analysis: `Phân tích tệp "${file.name}":\n- Tệp thuộc danh mục ${file.folderName}, phục vụ trực tiếp cho hoạt động giảng dạy và quản lý lớp học tại Trường Tiểu học Phường An Xuyên.\n- Đảm bảo đầy đủ yêu cầu cần đạt theo quy định của Bộ Giáo dục và Đào tạo.\n- Có thể chia sẻ cho đồng nghiệp khối 1 hoặc lưu trữ dài hạn.`,
    });
  }
});

// 11. Vite Integration (Development & Static serving)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kho Dữ Liệu Cá Nhân Thầy Gọn running on http://localhost:${PORT}`);
  });
}

startServer();
