-- ==============================================================================
-- KHO DỮ LIỆU CÁ NHÂN – TỪ VĂN GỌN – THỨ NHẤT
-- SUPABASE POSTGRESQL DATABASE INITIALIZATION & SCHEMA SCRIPT
-- ==============================================================================
-- Hướng dẫn:
-- 1. Đăng nhập vào trang quản trị Supabase (https://supabase.com/dashboard)
-- 2. Chọn dự án của Thầy Gọn -> Vào mục "SQL Editor" ở thanh bên trái
-- 3. Bấm "New Query", dán toàn bộ đoạn mã SQL bên dưới vào rồi bấm "RUN" (Chạy)
-- ==============================================================================

-- 1. BẢNG THƯ MỤC (FOLDERS)
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    parent_id TEXT REFERENCES public.folders(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#0866E8',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo chỉ mục tìm kiếm nhanh cho thư mục
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_name ON public.folders(name);

-- 2. BẢNG TẬP TIN & TÀI LIỆU (FILES)
CREATE TABLE IF NOT EXISTS public.files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    extension TEXT,
    category TEXT DEFAULT 'other',
    size NUMERIC DEFAULT 0,
    folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
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

-- Tạo chỉ mục tìm kiếm nhanh cho tệp
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_category ON public.files(category);
CREATE INDEX IF NOT EXISTS idx_files_is_deleted ON public.files(is_deleted);
CREATE INDEX IF NOT EXISTS idx_files_is_favorite ON public.files(is_favorite);

-- 3. BẢNG HỒ SƠ NGƯỜI DÙNG (USER PROFILE)
CREATE TABLE IF NOT EXISTS public.user_profile (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL DEFAULT 'TỪ VĂN GỌN',
    role TEXT DEFAULT 'Giáo viên tiểu học',
    school TEXT DEFAULT 'Trường Tiểu học Phường An Xuyên',
    location TEXT DEFAULT 'Cà Mau',
    email TEXT DEFAULT 'thaygonthax1978@gmail.com',
    phone TEXT DEFAULT '0918.452.889',
    storage_used_bytes NUMERIC DEFAULT 0,
    storage_max_bytes NUMERIC DEFAULT 107374182400, -- 100 GB
    avatar_url TEXT DEFAULT '/avatar_tu_van_gon.jpg',
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Chèn dữ liệu mẫu cho Thầy Gọn nếu chưa có
INSERT INTO public.user_profile (id, full_name, role, school, location, email, phone, avatar_url)
VALUES (
    'user_gon_01',
    'TỪ VĂN GỌN',
    'Giáo viên tiểu học',
    'Trường Tiểu học Phường An Xuyên',
    'Cà Mau',
    'thaygonthax1978@gmail.com',
    '0918.452.889',
    '/avatar_tu_van_gon.jpg'
)
ON CONFLICT (id) DO NOTHING;

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

-- 5. TẠO STORAGE BUCKET CHO TẬP TIN TẢI LÊN (DOCUMENTS)
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
