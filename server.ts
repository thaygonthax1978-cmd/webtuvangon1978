import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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
  avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
  twoFactorEnabled: true,
  lastLogin: new Date().toISOString(),
};

const defaultFolders: FolderRecord[] = [
  { id: 'f_01', name: '01. GIÁO DỤC', code: '01', parentId: null, color: '#0866E8', createdAt: '2026-09-01T08:00:00Z', updatedAt: '2026-09-28T09:30:00Z' },
  { id: 'f_02', name: '02. LỚP 1C', code: '02', parentId: null, color: '#16B875', createdAt: '2026-09-01T08:15:00Z', updatedAt: '2026-09-27T10:00:00Z' },
  { id: 'f_03', name: '03. GIÁO ÁN', code: '03', parentId: null, color: '#8257E5', createdAt: '2026-09-02T08:00:00Z', updatedAt: '2026-09-26T14:20:00Z' },
  { id: 'f_04', name: '04. TÀI LIỆU AI', code: '04', parentId: null, color: '#0866E8', createdAt: '2026-09-05T09:00:00Z', updatedAt: '2026-09-25T11:15:00Z' },
  { id: 'f_05', name: '05. HÌNH ẢNH', code: '05', parentId: null, color: '#FF9F1C', createdAt: '2026-09-05T10:30:00Z', updatedAt: '2026-09-24T16:00:00Z' },
  { id: 'f_06', name: '06. VIDEO', code: '06', parentId: null, color: '#F04444', createdAt: '2026-09-06T11:00:00Z', updatedAt: '2026-09-23T15:45:00Z' },
  { id: 'f_07', name: '07. WORD', code: '07', parentId: null, color: '#0866E8', createdAt: '2026-09-07T13:00:00Z', updatedAt: '2026-09-22T08:30:00Z' },
  { id: 'f_08', name: '08. EXCEL', code: '08', parentId: null, color: '#16B875', createdAt: '2026-09-08T14:00:00Z', updatedAt: '2026-09-21T09:00:00Z' },
  { id: 'f_09', name: '09. PDF', code: '09', parentId: null, color: '#F04444', createdAt: '2026-09-09T08:00:00Z', updatedAt: '2026-09-20T17:10:00Z' },
  { id: 'f_10', name: '10. POWERPOINT', code: '10', parentId: null, color: '#FF9F1C', createdAt: '2026-09-10T10:00:00Z', updatedAt: '2026-09-19T13:00:00Z' },
  { id: 'f_11', name: '11. HỒ SƠ CÁ NHÂN', code: '11', parentId: null, color: '#064AA8', createdAt: '2026-09-11T11:00:00Z', updatedAt: '2026-09-18T10:00:00Z' },
  { id: 'f_12', name: '12. TÀI LIỆU KHÁC', code: '12', parentId: null, color: '#64748B', createdAt: '2026-09-12T15:00:00Z', updatedAt: '2026-09-17T11:20:00Z' },
];

function seedInitialFiles(): FileRecord[] {
  // Create sample physical files on disk for realistic download and preview
  const sampleFiles = [
    {
      id: 'file_01',
      name: 'Giáo án Toán lớp 1 - Tuần 5.docx',
      originalName: 'Giáo án Toán lớp 1 - Tuần 5.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word' as const,
      size: 2.4 * 1024 * 1024,
      folderId: 'f_03',
      folderName: '03. GIÁO ÁN',
      filename: 'giao_an_toan_lop_1_tuan_5.docx',
      uploadDate: '2026-09-28T08:15:00Z',
      updatedDate: '2026-09-28T08:15:00Z',
      isFavorite: true,
      isDeleted: false,
      versions: [
        { version: 4, name: 'Giáo án Toán lớp 1 - Tuần 5 (v4).docx', size: 2.4 * 1024 * 1024, uploadDate: '2026-09-28', updatedBy: 'Từ Văn Gọn', filename: 'giao_an_toan_lop_1_tuan_5.docx' },
        { version: 3, name: 'Giáo án Toán lớp 1 - Tuần 5 (v3).docx', size: 2.1 * 1024 * 1024, uploadDate: '2026-09-25', updatedBy: 'Từ Văn Gọn', filename: 'giao_an_toan_lop_1_tuan_5_v3.docx' },
        { version: 2, name: 'Giáo án Toán lớp 1 - Tuần 5 (v2).docx', size: 1.8 * 1024 * 1024, uploadDate: '2026-09-20', updatedBy: 'Từ Văn Gọn', filename: 'giao_an_toan_lop_1_tuan_5_v2.docx' },
        { version: 1, name: 'Giáo án Toán lớp 1 - Tuần 5 (v1).docx', size: 1.6 * 1024 * 1024, uploadDate: '2026-09-15', updatedBy: 'Từ Văn Gọn', filename: 'giao_an_toan_lop_1_tuan_5_v1.docx' },
      ],
      shareConfig: {
        isShared: true,
        shareUrl: 'https://khotailieu.thaygon.vn/s/abc123xyz',
        sharedWithEmails: ['toantieuhoctaynam@gmail.com'],
        accessRole: 'viewer' as const,
        hasPassword: true,
        expiresInDays: 7,
      },
      previewContent: 'GIÁO ÁN MÔN TOÁN LỚP 1 - TUẦN 5\nBÀI HỌC: PHÉP CỘNG TRONG PHẠM VI 10 (TIẾT 1)\nGiáo viên thực hiện: Thầy Từ Văn Gọn\nĐơn vị: Trường Tiểu học Phường An Xuyên, TP. Cà Mau\nI. YÊU CẦU CẦN ĐẠT:\n1. Năng lực toán học:\n- Nhận biết ý nghĩa thực tế của phép cộng thông qua việc gộp hai nhóm đối tượng.\n- Thực hiện đúng các phép tính cộng trong phạm vi 10 bằng trực quan hình ảnh que tính, hình khối.\n2. Phẩm chất: Chăm chỉ, hào hứng tương tác trong giờ học, tinh thần hợp tác nhóm.\nII. ĐỒ DÙNG DẠY HỌC:\n- Bộ đồ dùng Toán 1, màn chiếu máy tính, tranh minh họa các chú ếch trên lá sen.\nIII. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU:\n1. Khởi động (5 phút): Hát bài "Một con vịt xòe ra hai cái cánh", đố vui số đếm.\n2. Khám phá (15 phút): Cho học sinh quan sát trên cành có 3 con chim, thêm 2 con chim bay tới. Hỏi có tất cả bao nhiêu con chim? Hướng dẫn hình thành phép tính 3 + 2 = 5.',
    },
    {
      id: 'file_02',
      name: 'Bài giảng điện tử Tiếng Việt.pptx',
      originalName: 'Bài giảng điện tử Tiếng Việt.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
      category: 'powerpoint' as const,
      size: 12.5 * 1024 * 1024,
      folderId: 'f_02',
      folderName: '02. LỚP 1C',
      filename: 'bai_giang_tieng_viet_lop_1c.pptx',
      uploadDate: '2026-09-27T09:20:00Z',
      updatedDate: '2026-09-27T09:20:00Z',
      isFavorite: true,
      isDeleted: false,
      versions: [
        { version: 1, name: 'Bài giảng điện tử Tiếng Việt.pptx', size: 12.5 * 1024 * 1024, uploadDate: '2026-09-27', updatedBy: 'Từ Văn Gọn', filename: 'bai_giang_tieng_viet_lop_1c.pptx' },
      ],
      previewContent: 'BÀI GIẢNG ĐIỆN TỬ TIẾNG VIỆT 1 - BỘ SÁCH CÁNH DIỀU / CHÂN TRỜI SÁNG TẠO\nLỚP 1C - TH PHƯỜNG AN XUYÊN - THẦY TỪ VĂN GỌN\nSlide 1: Tiêu đề bài học: ÂM A - CHỮ A\nSlide 2: Khởi động với bài hát Chữ cái vui nhộn\nSlide 3: Quan sát tranh và nhận biết: Bức tranh vẽ cảnh buổi sáng có con gà gáy o o, bạn nhỏ chào mẹ đi học.\nSlide 4: Luyện đọc âm A. Chữ A in hoa, chữ a in thường.\nSlide 5: Trò chơi tìm đồ vật có tiếng chứa âm a trong lớp học.',
    },
    {
      id: 'file_03',
      name: 'Thông tư 27.pdf',
      originalName: 'Thông tư 27-2020-TT-BGDDT.pdf',
      mimeType: 'application/pdf',
      extension: 'pdf',
      category: 'pdf' as const,
      size: 3.8 * 1024 * 1024,
      folderId: 'f_01',
      folderName: '01. GIÁO DỤC',
      filename: 'thong_tu_27_bgddt.pdf',
      uploadDate: '2026-09-26T14:00:00Z',
      updatedDate: '2026-09-26T14:00:00Z',
      isFavorite: true,
      isDeleted: false,
      versions: [
        { version: 1, name: 'Thông tư 27.pdf', size: 3.8 * 1024 * 1024, uploadDate: '2026-09-26', updatedBy: 'Từ Văn Gọn', filename: 'thong_tu_27_bgddt.pdf' },
      ],
      previewContent: 'BỘ GIÁO DỤC VÀ ĐÀO TẠO\nSố: 27/2020/TT-BGDĐT\nCỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nQUY ĐỊNH ĐÁNH GIÁ HỌC SINH TIỂU HỌC\n\nChương I: NHỮNG QUY ĐỊNH CHUNG\nĐiều 1. Phạm vi điều chỉnh và đối tượng áp dụng\n1. Thông tư này quy định đánh giá học sinh tiểu học bao gồm: tổ chức đánh giá; sử dụng kết quả đánh giá; hồ sơ đánh giá và trách nhiệm của cơ quan, tổ chức, cá nhân.\n2. Thông tư này áp dụng đối với trường tiểu học, trường phổ thông có nhiều cấp học trong đó có cấp tiểu học.\n\nĐiều 5. Nội dung đánh giá\n1. Đánh giá quá trình học tập, sự tiến bộ và kết quả học tập của học sinh đáp ứng yêu cầu cần đạt và biểu hiện cụ thể về các thành phần năng lực của từng môn học, hoạt động giáo dục theo chương trình giáo dục phổ thông cấp tiểu học.\n2. Đánh giá sự hình thành và phát triển phẩm chất, năng lực của học sinh:\na) Phẩm chất chủ yếu: yêu nước, nhân ái, chăm chỉ, trung thực, trách nhiệm.\nb) Năng lực cốt lõi: Năng lực chung (tự chủ và tự học, giao tiếp và hợp tác, giải quyết vấn đề và sáng tạo); Năng lực đặc thù.',
    },
    {
      id: 'file_04',
      name: 'Hình ảnh hoạt động lớp 1C.zip',
      originalName: 'Hinh_anh_hoat_dong_lop_1C.zip',
      mimeType: 'application/zip',
      extension: 'zip',
      category: 'zip' as const,
      size: 25.6 * 1024 * 1024,
      folderId: 'f_05',
      folderName: '05. HÌNH ẢNH',
      filename: 'hinh_anh_hoat_dong_lop_1c.zip',
      uploadDate: '2026-09-25T16:30:00Z',
      updatedDate: '2026-09-25T16:30:00Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        { version: 1, name: 'Hình ảnh hoạt động lớp 1C.zip', size: 25.6 * 1024 * 1024, uploadDate: '2026-09-25', updatedBy: 'Từ Văn Gọn', filename: 'hinh_anh_hoat_dong_lop_1c.zip' },
      ],
      previewContent: 'Gói nén gồm 45 hình ảnh chất lượng cao chụp các hoạt động:\n- Lễ Khai giảng năm học mới Trường Tiểu học Phường An Xuyên\n- Giờ sinh hoạt lớp 1C\n- Hoạt động trải nghiệm làm chậu hoa tái chế tại sân trường\n- Buổi nhận xét đánh giá giữa học kì 1',
    },
    {
      id: 'file_05',
      name: 'Danh sách học sinh lớp 1C.xlsx',
      originalName: 'Danh_sach_hoc_sinh_lop_1C.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      category: 'excel' as const,
      size: 1.2 * 1024 * 1024,
      folderId: 'f_02',
      folderName: '02. LỚP 1C',
      filename: 'danh_sach_hoc_sinh_lop_1c.xlsx',
      uploadDate: '2026-09-24T11:00:00Z',
      updatedDate: '2026-09-24T11:00:00Z',
      isFavorite: true,
      isDeleted: false,
      versions: [
        { version: 1, name: 'Danh sách học sinh lớp 1C.xlsx', size: 1.2 * 1024 * 1024, uploadDate: '2026-09-24', updatedBy: 'Từ Văn Gọn', filename: 'danh_sach_hoc_sinh_lop_1c.xlsx' },
      ],
      previewContent: 'TRƯỜNG TIỂU HỌC PHƯỜNG AN XUYÊN - NĂM HỌC 2026-2027\nDANH SÁCH HỌC SINH LỚP 1C (Chủ nhiệm: Thầy Từ Văn Gọn)\nSĩ số: 32 học sinh (Nam: 17, Nữ: 15)\n1. Nguyễn Hoàng An - Nam - 12/03/2020 - Phường An Xuyên, Cà Mau\n2. Trần Bảo Châu - Nữ - 05/05/2020 - Ấp 1, Xã An Xuyên, Cà Mau\n3. Lê Minh Đăng - Nam - 22/08/2020 - Phường An Xuyên, Cà Mau\n4. Phạm Quỳnh Giang - Nữ - 14/01/2020 - TP. Cà Mau\n5. Võ Văn Hưng - Nam - 03/09/2020 - Phường An Xuyên, Cà Mau\n6. Huỳnh Ngọc Mai - Nữ - 19/11/2020 - Phường An Xuyên, Cà Mau\n...\n(Đã cập nhật BHYT, thông tin phụ huynh và sổ liên lạc điện tử)',
    },
    {
      id: 'file_06',
      name: 'Video tiết dạy mẫu môn Toán.mp4',
      originalName: 'Video_tiet_day_mau_mon_toan.mp4',
      mimeType: 'video/mp4',
      extension: 'mp4',
      category: 'video' as const,
      size: 450 * 1024 * 1024,
      folderId: 'f_06',
      folderName: '06. VIDEO',
      filename: 'video_tiet_day_mau.mp4',
      uploadDate: '2026-09-23T15:00:00Z',
      updatedDate: '2026-09-23T15:00:00Z',
      isFavorite: false,
      isDeleted: true,
      deletedAt: '2026-09-29T10:15:00Z',
      versions: [
        { version: 1, name: 'Video tiết dạy mẫu môn Toán.mp4', size: 450 * 1024 * 1024, uploadDate: '2026-09-23', updatedBy: 'Từ Văn Gọn', filename: 'video_tiet_day_mau.mp4' },
      ],
      previewContent: 'Video bài giảng thực nghiệm môn Toán 1 - Dạy học tích hợp STEM và phương pháp dạy học tích cực.',
    },
    {
      id: 'file_07',
      name: 'Ma trận đề kiểm tra Toán 1.xlsx',
      originalName: 'Ma_tran_de_kiem_tra_Toan_1.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      category: 'excel' as const,
      size: 1.2 * 1024 * 1024,
      folderId: 'f_03',
      folderName: '03. GIÁO ÁN',
      filename: 'ma_tran_de_kiem_tra_toan_1.xlsx',
      uploadDate: '2026-09-10T09:00:00Z',
      updatedDate: '2026-09-10T09:00:00Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        { version: 1, name: 'Ma trận đề kiểm tra Toán 1.xlsx', size: 1.2 * 1024 * 1024, uploadDate: '2026-09-10', updatedBy: 'Từ Văn Gọn', filename: 'ma_tran_de_kiem_tra_toan_1.xlsx' },
      ],
      previewContent: 'BẢNG MA TRẬN ĐỀ KIỂM TRA ĐỊNH KỲ MÔN TOÁN LỚP 1\nTheo Thông tư 27/2020/TT-BGDĐT\n- Mức 1 (Nhận biết): 40%\n- Mức 2 (Thông hiểu): 30%\n- Mức 3 (Vận dụng): 30%',
    },
    {
      id: 'file_08',
      name: 'Đề kiểm tra Toán lớp 1 - HK1.docx',
      originalName: 'De_kiem_tra_Toan_lop_1_HK1.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
      category: 'word' as const,
      size: 1.8 * 1024 * 1024,
      folderId: 'f_03',
      folderName: '03. GIÁO ÁN',
      filename: 'de_kiem_tra_toan_lop_1_hk1.docx',
      uploadDate: '2026-09-18T14:30:00Z',
      updatedDate: '2026-09-18T14:30:00Z',
      isFavorite: false,
      isDeleted: false,
      versions: [
        { version: 1, name: 'Đề kiểm tra Toán lớp 1 - HK1.docx', size: 1.8 * 1024 * 1024, uploadDate: '2026-09-18', updatedBy: 'Từ Văn Gọn', filename: 'de_kiem_tra_toan_lop_1_hk1.docx' },
      ],
      previewContent: 'TRƯỜNG TIỂU HỌC PHƯỜNG AN XUYÊN\nĐỀ KIỂM TRA ĐỊNH KỲ CUỐI HỌC KỲ I - NĂM HỌC 2026-2027\nMÔN: TOÁN - LỚP 1\nThời gian làm bài: 40 phút\nHọ và tên học sinh: ....................................... Lớp 1C\nĐiểm số: ........... Lời nhận xét của Thầy Gọn: ............................\nPhần 1: Trắc nghiệm khách quan\nCâu 1: Số lớn nhất có một chữ số là số nào?',
    },
    {
      id: 'file_09',
      name: 'Ảnh thẻ hồ sơ viên chức Thầy Gọn.jpg',
      originalName: 'Anh_the_ho_so_vien_chuc.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      category: 'image' as const,
      size: 1.5 * 1024 * 1024,
      folderId: 'f_11',
      folderName: '11. HỒ SƠ CÁ NHÂN',
      filename: 'anh_the_thay_gon.jpg',
      uploadDate: '2026-09-15T10:00:00Z',
      updatedDate: '2026-09-15T10:00:00Z',
      isFavorite: true,
      isDeleted: false,
      versions: [
        { version: 1, name: 'Ảnh thẻ hồ sơ viên chức Thầy Gọn.jpg', size: 1.5 * 1024 * 1024, uploadDate: '2026-09-15', updatedBy: 'Từ Văn Gọn', filename: 'anh_the_thay_gon.jpg' },
      ],
      previewContent: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80',
    },
  ];

  // Write physical file representations in uploads directory
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
    return JSON.parse(content);
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

// ================= API ROUTES =================

// 1. User Profile & Settings
app.get('/api/user', (_req, res) => {
  const db = getDB();
  res.json({ success: true, user: db.user });
});

app.put('/api/user', (req, res) => {
  const db = getDB();
  db.user = { ...db.user, ...req.body };
  saveDB(db);
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
      totalFolders: db.folders.length,
      trashCount: db.files.filter((f) => f.isDeleted).length,
    },
  });
});

// 3. Folders Management
app.get('/api/folders', (_req, res) => {
  const db = getDB();
  const activeFiles = db.files.filter((f) => !f.isDeleted);

  // Compute folder item count & total size
  const foldersWithMeta = db.folders.map((folder) => {
    const filesInFolder = activeFiles.filter((f) => f.folderId === folder.id);
    const size = filesInFolder.reduce((acc, f) => acc + (f.size || 0), 0);
    return {
      ...folder,
      fileCount: filesInFolder.length,
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
      if (file.folderId === id) file.folderName = name;
    });
  }

  saveDB(db);
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
    }
  });

  saveDB(db);
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

  // Sort descending by updatedDate
  results.sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime());

  res.json({ success: true, files: results });
});

// 5. File Upload (Supports multi-file)
app.post('/api/upload', upload.array('files', 20), (req, res) => {
  const uploadedFiles = req.files as Express.Multer.File[];
  const folderId = req.body.folderId || 'f_01';

  if (!uploadedFiles || uploadedFiles.length === 0) {
    return res.status(400).json({ success: false, message: 'Không có tệp nào được tải lên' });
  }

  const db = getDB();
  const targetFolder = db.folders.find((f) => f.id === folderId) || db.folders[0];

  const addedFiles: FileRecord[] = [];

  for (const file of uploadedFiles) {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const category = categorizeFile(file.originalname);

    let previewContent = '';
    // If text / markdown / csv / json, read content
    if (['txt', 'md', 'csv', 'json'].includes(ext)) {
      try {
        previewContent = fs.readFileSync(file.path, 'utf-8').slice(0, 5000);
      } catch (err) {
        console.error(err);
      }
    } else {
      previewContent = `Tài liệu: ${file.originalname}\nĐịnh dạng: ${ext.toUpperCase()}\nKích thước: ${(file.size / (1024 * 1024)).toFixed(2)} MB\nChủ sở hữu: Thầy Từ Văn Gọn - Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.`;
    }

    const newFile: FileRecord = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: file.originalname,
      originalName: file.originalname,
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
          name: file.originalname,
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
  }

  saveDB(db);
  res.json({
    success: true,
    message: `Đã tải lên thành công ${addedFiles.length} tệp`,
    files: addedFiles,
  });
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
  res.json({ success: true, file: db.files[idx] });
});

// Soft Delete (Move to Trash)
app.delete('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const { permanent } = req.query;
  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });

  if (permanent === 'true') {
    const removed = db.files.splice(idx, 1)[0];
    const physicalPath = path.join(UPLOADS_DIR, removed.filename);
    if (fs.existsSync(physicalPath)) {
      try { fs.unlinkSync(physicalPath); } catch (e) { console.error(e); }
    }
    saveDB(db);
    return res.json({ success: true, message: 'Đã xóa vĩnh viễn tệp' });
  }

  db.files[idx].isDeleted = true;
  db.files[idx].deletedAt = new Date().toISOString();
  saveDB(db);
  res.json({ success: true, message: 'Đã chuyển tệp vào thùng rác' });
});

// Restore from Trash
app.post('/api/files/:id/restore', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const idx = db.files.findIndex((f) => f.id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Không tìm thấy tệp' });

  db.files[idx].isDeleted = false;
  db.files[idx].deletedAt = undefined;
  saveDB(db);
  res.json({ success: true, message: 'Đã khôi phục tệp thành công', file: db.files[idx] });
});

// Empty Trash
app.delete('/api/trash/empty', (_req, res) => {
  const db = getDB();
  const trashFiles = db.files.filter((f) => f.isDeleted);
  trashFiles.forEach((file) => {
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error(e); }
    }
  });

  db.files = db.files.filter((f) => !f.isDeleted);
  saveDB(db);
  res.json({ success: true, message: `Đã dọn sạch ${trashFiles.length} tệp trong thùng rác` });
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
app.get('/api/files/:id/download', (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const file = db.files.find((f) => f.id === id);
  if (!file) return res.status(404).send('Không tìm thấy tệp');

  const filePath = path.join(UPLOADS_DIR, file.filename);
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
