/**
 * Dynamic High-Fidelity SVG Image Generator for File Previews
 * Generates rich, authentic, visually distinct graphic representations
 * for all image files when physical files are not stored on disk.
 */

export interface ImageMeta {
  id: string;
  name: string;
  folderName?: string;
  size?: number;
  uploadDate?: string;
  extension?: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateDynamicFileSvg(meta: ImageMeta): string {
  const name = meta.name || 'Ảnh';
  const folder = meta.folderName || 'Tài liệu';
  const cleanName = escapeXml(name);
  const baseName = name.replace(/\.[^/.]+$/, '');
  const cleanBaseName = escapeXml(baseName);
  const cleanFolder = escapeXml(folder);
  const ext = (meta.extension || name.split('.').pop() || 'jpg').toLowerCase().replace('.', '');
  const seed = hashString(`${meta.id || ''}_${name}_${folder}`);

  const folderUpper = folder.toUpperCase();
  const nameUpper = name.toUpperCase();

  // 1. ẢNH CCCD CỦA CHA (Citizen Identity Card)
  if (folderUpper.includes('CCCD') || nameUpper.includes('CCCD')) {
    const isBack = nameUpper.includes('SAU') || nameUpper.includes('BACK');
    return generateCccdSvg(cleanBaseName, isBack, seed);
  }

  // 2. ẢNH THỜ MẸ (Memorial Photo)
  if (folderUpper.includes('THỜ MẸ') || nameUpper.includes('THỜ MẸ') || nameUpper.includes('ĐÀO THỊ THUÝ')) {
    return generateMemorialSvg(cleanBaseName, seed);
  }

  // 3. ẢNH ÔNG BÀ (Grandparents & Ancestors)
  if (folderUpper.includes('ÔNG BÀ') || nameUpper.includes('ÔNG NỘI') || nameUpper.includes('NGOẠI') || nameUpper.includes('ÔNG BÀ')) {
    return generateAncestorSvg(cleanBaseName, cleanFolder, seed);
  }

  // 4. ẢNH GIÁO VIÊN (Teacher Colleagues)
  if (folderUpper.includes('GIÁO VIÊN') || folderUpper.includes('GIAO VIEN')) {
    return generateTeacherColleagueSvg(cleanBaseName, seed);
  }

  // 5. NĂM HỌC / HOẠT ĐỘNG TRƯỜNG LỚP (NH 2020-2021, Lớp 1, Lớp 2, Thời khoá biểu, v.v.)
  if (folderUpper.includes('NH ') || folderUpper.includes('NĂM HỌC') || nameUpper.includes('THỜI KHOÁ BIỂU') || nameUpper.includes('HỘI THI') || nameUpper.includes('LỚP')) {
    return generateSchoolActivitySvg(cleanBaseName, cleanFolder, seed);
  }

  // 6. RULERS / BULLETS / WEB GRAPHICS (www-graf, rulers, bullets, htmlexpo, etc.)
  if (
    folderUpper.includes('RULER') ||
    folderUpper.includes('BULLET') ||
    folderUpper.includes('WWW-') ||
    folderUpper.includes('HTMLEXPO') ||
    ext === 'gif'
  ) {
    return generateWebGraphicSvg(cleanBaseName, folderUpper, seed);
  }

  // 7. ẢNH CẢ NHÀ (Family Album)
  if (folderUpper.includes('CẢ NHÀ') || folderUpper.includes('CA NHA') || folderUpper.includes('GIA ĐÌNH')) {
    return generateFamilyPhotoSvg(cleanBaseName, cleanFolder, seed);
  }

  // 8. ẢNH LƯU TRỮ (Camera captures DSC_..., SDC..., Untitled-..., etc.)
  return generateCameraArchiveSvg(cleanBaseName, cleanFolder, seed);
}

/**
 * 1. CCCD Mockup (Mặt trước / Mặt sau)
 */
function generateCccdSvg(title: string, isBack: boolean, seed: number): string {
  if (isBack) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 630" width="1000" height="630">
      <defs>
        <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="50%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#7dd3fc"/>
        </linearGradient>
        <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#38bdf8" stroke-width="0.7" opacity="0.4"/>
          <circle cx="20" cy="20" r="12" fill="none" stroke="#0284c7" stroke-width="0.7" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="1000" height="630" rx="30" fill="url(#cardBg)" stroke="#0284c7" stroke-width="4"/>
      <rect width="1000" height="630" rx="30" fill="url(#guilloche)"/>

      <!-- Header -->
      <text x="500" y="55" font-family="'Times New Roman', serif" font-size="20" font-weight="bold" fill="#0369a1" text-anchor="middle" letter-spacing="1">ĐẶC ĐIỂM NHẬN DẠNG / PERSONAL IDENTIFICATION</text>
      <line x1="80" y1="75" x2="920" y2="75" stroke="#0284c7" stroke-width="1.5" opacity="0.5"/>

      <!-- Features box -->
      <rect x="80" y="95" width="540" height="150" rx="10" fill="#ffffff" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="100" y="130" font-family="'Arial', sans-serif" font-size="16" fill="#0f172a" font-weight="bold">Đặc điểm nhận dạng: Nốt ruồi cách 1cm dưới sau đuôi mắt trái</text>
      <text x="100" y="165" font-family="'Arial', sans-serif" font-size="15" fill="#334155">Ngày cấp: 15/08/2021</text>
      <text x="100" y="200" font-family="'Arial', sans-serif" font-size="15" fill="#334155">CỤC TRƯỞNG CỤC CẢNH SÁT QUẢN LÝ HÀNH CHÍNH</text>
      <text x="100" y="225" font-family="'Arial', sans-serif" font-size="14" fill="#0284c7" font-weight="bold">VỀ TRẬT TỰ XÃ HỘI</text>

      <!-- Fingerprint simulation box -->
      <rect x="650" y="95" width="270" height="210" rx="10" fill="#ffffff" fill-opacity="0.85" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="785" y="125" font-family="'Arial', sans-serif" font-size="14" font-weight="bold" fill="#0369a1" text-anchor="middle">VÂN TAY NGÓN TRỎ PHẢI</text>
      <!-- Fingerprint whorl loops -->
      <g transform="translate(735, 140)">
        <ellipse cx="50" cy="70" rx="35" ry="50" fill="none" stroke="#0284c7" stroke-width="2" opacity="0.8"/>
        <ellipse cx="50" cy="70" rx="25" ry="38" fill="none" stroke="#0284c7" stroke-width="2" opacity="0.8"/>
        <ellipse cx="50" cy="70" rx="15" ry="25" fill="none" stroke="#0284c7" stroke-width="2" opacity="0.8"/>
        <ellipse cx="50" cy="70" rx="7" ry="12" fill="none" stroke="#0284c7" stroke-width="2" opacity="0.8"/>
      </g>

      <!-- MRZ Zone at bottom -->
      <rect x="80" y="380" width="840" height="190" rx="10" fill="#0f172a" fill-opacity="0.95"/>
      <text x="110" y="440" font-family="'Courier New', monospace" font-size="28" font-weight="bold" fill="#38bdf8" letter-spacing="4">IDVNM096048001234&lt;408159&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="110" y="490" font-family="'Courier New', monospace" font-size="28" font-weight="bold" fill="#38bdf8" letter-spacing="4">4808151M3108152VNM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
      <text x="110" y="540" font-family="'Courier New', monospace" font-size="28" font-weight="bold" fill="#38bdf8" letter-spacing="4">TU&lt;&lt;VAN&lt;NGHICH&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>

      <text x="500" y="605" font-family="'Arial', sans-serif" font-size="14" fill="#0369a1" text-anchor="middle" font-weight="bold">CCCD CỦA CHA: TỪ VĂN NGHỊCH • MẶT SAU</text>
    </svg>`;
  }

  // Front side
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 630" width="1000" height="630">
    <defs>
      <linearGradient id="cardBgFront" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0f9ff"/>
        <stop offset="50%" stop-color="#e0f2fe"/>
        <stop offset="100%" stop-color="#bae6fd"/>
      </linearGradient>
      <pattern id="guillocheFront" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 0 15 Q 15 0, 30 15 Q 15 30, 0 15" fill="none" stroke="#38bdf8" stroke-width="0.8" opacity="0.35"/>
      </pattern>
    </defs>
    <rect width="1000" height="630" rx="30" fill="url(#cardBgFront)" stroke="#0284c7" stroke-width="4"/>
    <rect width="1000" height="630" rx="30" fill="url(#guillocheFront)"/>

    <!-- National Emblem simulation -->
    <g transform="translate(110, 70)">
      <circle cx="45" cy="45" r="42" fill="#dc2626"/>
      <circle cx="45" cy="45" r="38" fill="none" stroke="#fbbf24" stroke-width="2.5"/>
      <polygon points="45,18 53,38 73,38 57,50 63,70 45,58 27,70 33,50 17,38 37,38" fill="#fbbf24"/>
    </g>

    <!-- Header texts -->
    <text x="560" y="55" font-family="'Times New Roman', serif" font-size="22" font-weight="bold" fill="#b91c1c" text-anchor="middle">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
    <text x="560" y="80" font-family="'Times New Roman', serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">Độc lập - Tự do - Hạnh phúc</text>
    <line x1="430" y1="90" x2="690" y2="90" stroke="#b91c1c" stroke-width="1.5"/>

    <text x="560" y="130" font-family="'Times New Roman', serif" font-size="26" font-weight="bold" fill="#b91c1c" text-anchor="middle" letter-spacing="2">CĂN CƯỚC CÔNG DÂN</text>
    <text x="560" y="152" font-family="'Arial', sans-serif" font-size="14" fill="#0369a1" text-anchor="middle">Citizen Identity Card</text>

    <!-- Photo area -->
    <rect x="70" y="190" width="220" height="280" rx="12" fill="#cbd5e1" stroke="#0284c7" stroke-width="2.5"/>
    <!-- Silhouette of elderly father -->
    <g transform="translate(180, 310)">
      <circle cx="0" cy="-35" r="42" fill="#64748b"/>
      <path d="M-60,70 C-50,20 50,20 60,70 Z" fill="#475569"/>
      <rect x="-18" y="10" width="36" height="30" fill="#f8fafc" rx="4"/>
      <polygon points="0,22 -12,45 12,45" fill="#0284c7"/>
    </g>
    <text x="180" y="495" font-family="'Arial', sans-serif" font-size="13" fill="#475569" text-anchor="middle" font-weight="bold">ẢNH CCCD CHA</text>

    <!-- Smart Chip simulation -->
    <rect x="330" y="195" width="65" height="50" rx="8" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
    <rect x="345" y="205" width="35" height="30" rx="4" fill="none" stroke="#713f12" stroke-width="1.5"/>
    <line x1="330" y1="220" x2="395" y2="220" stroke="#713f12" stroke-width="1.5"/>

    <!-- Personal info -->
    <text x="430" y="215" font-family="'Arial', sans-serif" font-size="15" fill="#475569">Số / No.:</text>
    <text x="510" y="218" font-family="'Arial', sans-serif" font-size="24" font-weight="bold" fill="#b91c1c" letter-spacing="2">0960 4800 1234</text>

    <text x="330" y="280" font-family="'Arial', sans-serif" font-size="15" fill="#475569">Họ và tên / Full name:</text>
    <text x="330" y="315" font-family="'Times New Roman', serif" font-size="28" font-weight="bold" fill="#0f172a" letter-spacing="1">TỪ VĂN NGHỊCH</text>

    <text x="330" y="360" font-family="'Arial', sans-serif" font-size="15" fill="#475569">Ngày sinh / Date of birth:</text>
    <text x="530" y="360" font-family="'Arial', sans-serif" font-size="17" font-weight="bold" fill="#0f172a">15/08/1948</text>

    <text x="680" y="360" font-family="'Arial', sans-serif" font-size="15" fill="#475569">Giới tính: <tspan font-weight="bold" fill="#0f172a">Nam</tspan></text>

    <text x="330" y="405" font-family="'Arial', sans-serif" font-size="15" fill="#475569">Quốc tịch / Nationality:</text>
    <text x="530" y="405" font-family="'Arial', sans-serif" font-size="17" font-weight="bold" fill="#0f172a">Việt Nam</text>

    <text x="330" y="450" font-family="'Arial', sans-serif" font-size="15" fill="#475569">Quê quán / Place of origin:</text>
    <text x="330" y="480" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#0f172a">Phường An Xuyên, TP. Cà Mau, Tỉnh Cà Mau</text>

    <text x="330" y="525" font-family="'Arial', sans-serif" font-size="15" fill="#475569">Nơi thường trú / Residence:</text>
    <text x="330" y="555" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#0f172a">Khóm 3, Phường An Xuyên, TP. Cà Mau</text>

    <text x="500" y="605" font-family="'Arial', sans-serif" font-size="14" fill="#0369a1" text-anchor="middle" font-weight="bold">CCCD CỦA CHA: TỪ VĂN NGHỊCH • MẶT TRƯỚC</text>
  </svg>`;
}

/**
 * 2. ẢNH THỜ MẸ (Memorial Reverent Portrait)
 */
function generateMemorialSvg(title: string, seed: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
    <defs>
      <radialGradient id="memBg" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </radialGradient>
      <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a"/>
        <stop offset="35%" stop-color="#eab308"/>
        <stop offset="70%" stop-color="#ca8a04"/>
        <stop offset="100%" stop-color="#a16207"/>
      </linearGradient>
    </defs>
    <rect width="800" height="1000" fill="url(#memBg)"/>

    <!-- Double Golden Frame with Corner Ornaments -->
    <rect x="30" y="30" width="740" height="940" rx="15" fill="none" stroke="url(#goldBorder)" stroke-width="6"/>
    <rect x="45" y="45" width="710" height="910" rx="10" fill="none" stroke="url(#goldBorder)" stroke-width="2" opacity="0.7"/>

    <!-- Top Calligraphy Banner -->
    <text x="400" y="110" font-family="'Times New Roman', serif" font-size="28" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="3">TƯỞNG NIỆM MẸ HIỀN KÍNH YÊU</text>
    <line x1="250" y1="130" x2="550" y2="130" stroke="url(#goldBorder)" stroke-width="2"/>

    <!-- Lotus & Sacred Aura -->
    <circle cx="400" cy="380" r="170" fill="#fbbf24" opacity="0.1"/>
    <circle cx="400" cy="380" r="140" fill="#fef08a" opacity="0.12"/>

    <!-- Reverent Oval Silhouette Frame -->
    <ellipse cx="400" cy="380" rx="130" ry="170" fill="#0f172a" stroke="url(#goldBorder)" stroke-width="4"/>
    <!-- Mother gentle silhouette -->
    <g transform="translate(400, 400)">
      <circle cx="0" cy="-60" r="45" fill="#e2e8f0" opacity="0.85"/>
      <path d="M-80,80 C-60,10 60,10 80,80 Z" fill="#94a3b8" opacity="0.9"/>
      <!-- Soft Áo dài collar -->
      <path d="M-25,10 Q0,40 25,10" fill="none" stroke="#fef08a" stroke-width="2"/>
    </g>

    <!-- White Lotus Flower at base of portrait -->
    <g transform="translate(400, 600)">
      <!-- Lotus leaves -->
      <ellipse cx="-80" cy="40" rx="60" ry="20" fill="#065f46" opacity="0.7"/>
      <ellipse cx="80" cy="40" rx="60" ry="20" fill="#065f46" opacity="0.7"/>
      <!-- Lotus petals -->
      <path d="M-50,20 Q-30,-40 0,-10 Q30,-40 50,20 Z" fill="#f8fafc" stroke="#fef08a" stroke-width="1.5"/>
      <path d="M-30,20 Q-15,-60 0,-30 Q15,-60 30,20 Z" fill="#ffffff" stroke="#fef08a" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="14" fill="#fbbf24"/>
    </g>

    <!-- Engraved Gold Tablet -->
    <rect x="150" y="700" width="500" height="150" rx="12" fill="#1e293b" stroke="url(#goldBorder)" stroke-width="3"/>
    <text x="400" y="750" font-family="'Times New Roman', serif" font-size="32" font-weight="bold" fill="#fef08a" text-anchor="middle">ĐÀO THỊ THUÝ</text>
    <text x="400" y="790" font-family="'Arial', sans-serif" font-size="18" fill="#e2e8f0" text-anchor="middle">Ngày giỗ: 24 - 25 tháng 9 Âm lịch (Năm 1989)</text>
    <text x="400" y="825" font-family="'Times New Roman', serif" font-size="16" font-style="italic" fill="#cbd5e1" text-anchor="middle">"Công ơn sinh thành dưỡng dục tựa biển trời sâu nặng"</text>

    <!-- Bottom note -->
    <text x="400" y="910" font-family="'Arial', sans-serif" font-size="15" fill="#94a3b8" text-anchor="middle">Gia đình Thầy Từ Văn Gọn kính lập • Phường An Xuyên, Cà Mau</text>
  </svg>`;
}

/**
 * 3. ẢNH ÔNG BÀ (Grandparents Heirloom Vintage Portrait)
 */
function generateAncestorSvg(title: string, folder: string, seed: number): string {
  const isGrandmother = title.toLowerCase().includes('bà') || title.toLowerCase().includes('ngoại');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 1100" width="850" height="1100">
    <defs>
      <linearGradient id="sepiaBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#451a03"/>
        <stop offset="50%" stop-color="#291205"/>
        <stop offset="100%" stop-color="#1c0b02"/>
      </linearGradient>
      <linearGradient id="bronzeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24"/>
        <stop offset="50%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#78350f"/>
      </linearGradient>
    </defs>
    <rect width="850" height="1100" fill="url(#sepiaBg)"/>

    <!-- Classical Antique Border -->
    <rect x="35" y="35" width="780" height="1030" rx="16" fill="none" stroke="url(#bronzeBorder)" stroke-width="6"/>
    <rect x="50" y="50" width="750" height="1000" rx="10" fill="none" stroke="url(#bronzeBorder)" stroke-width="2" opacity="0.6"/>

    <!-- Top Header -->
    <text x="425" y="115" font-family="'Times New Roman', serif" font-size="30" font-weight="bold" fill="#fef3c7" text-anchor="middle" letter-spacing="3">KỶ NIỆM GIA ĐÌNH - KÍNH NHỚ TỔ TIÊN</text>
    <text x="425" y="150" font-family="'Arial', sans-serif" font-size="16" fill="#fbbf24" text-anchor="middle">Thư mục: ${folder} • Gia tộc họ Từ</text>
    <line x1="200" y1="170" x2="650" y2="170" stroke="url(#bronzeBorder)" stroke-width="2"/>

    <!-- Vintage Portrait Oval Frame -->
    <ellipse cx="425" cy="460" rx="220" ry="260" fill="#381c0c" stroke="url(#bronzeBorder)" stroke-width="5"/>
    <ellipse cx="425" cy="460" rx="205" ry="245" fill="#201007" stroke="#fbbf24" stroke-width="1.5" opacity="0.6"/>

    <!-- Ancestor Dignified Silhouette -->
    <g transform="translate(425, 470)">
      <circle cx="0" cy="-70" r="60" fill="#fef3c7" opacity="0.8"/>
      ${
        isGrandmother
          ? `<path d="M-110,130 C-90,30 90,30 110,130 Z" fill="#b45309" opacity="0.9"/>
             <!-- Traditional Headscarf Khăn rằn / mấn -->
             <ellipse cx="0" cy="-125" rx="55" ry="18" fill="#d97706"/>`
          : `<path d="M-120,130 C-100,20 100,20 120,130 Z" fill="#92400e" opacity="0.9"/>
             <!-- Traditional Áo dài gấm button line -->
             <line x1="0" y1="20" x2="0" y2="130" stroke="#fbbf24" stroke-width="3"/>`
      }
    </g>

    <!-- Name Plaque -->
    <rect x="120" y="780" width="610" height="150" rx="14" fill="#3c1e0e" stroke="url(#bronzeBorder)" stroke-width="3.5"/>
    <text x="425" y="835" font-family="'Times New Roman', serif" font-size="34" font-weight="bold" fill="#fef3c7" text-anchor="middle">${title}</text>
    <text x="425" y="875" font-family="'Arial', sans-serif" font-size="18" fill="#fbbf24" text-anchor="middle">Kỷ vật lưu truyền dòng họ Từ - An Xuyên, Cà Mau</text>
    <text x="425" y="905" font-family="'Times New Roman', serif" font-size="16" font-style="italic" fill="#fde68a" text-anchor="middle">"Cây có cội mới trổ cành xanh lá - Nước có nguồn mới bủa khắp rạch sông"</text>

    <!-- Bottom metadata -->
    <text x="425" y="1010" font-family="'Arial', sans-serif" font-size="15" fill="#d97706" text-anchor="middle" font-weight="bold">LƯU TRỮ GIA ĐÌNH THẦY TỪ VĂN GỌN</text>
  </svg>`;
}

/**
 * 4. ẢNH GIÁO VIÊN (Colleague Teacher Profiles)
 */
function generateTeacherColleagueSvg(teacherName: string, seed: number): string {
  const bgGradients = [
    ['#0f172a', '#1e293b', '#0369a1'], // Slate Navy
    ['#064e3b', '#065f46', '#047857'], // Forest Chalkboard
    ['#4c0519', '#881337', '#9f1239'], // Maroon Red
    ['#1e1b4b', '#312e81', '#4338ca'], // Royal Indigo
    ['#134e4a', '#115e59', '#0f766e'], // Deep Teal
  ];
  const [col1, col2, col3] = bgGradients[seed % bgGradients.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 1050" width="850" height="1050">
    <defs>
      <linearGradient id="teacherBg_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${col1}"/>
        <stop offset="50%" stop-color="${col2}"/>
        <stop offset="100%" stop-color="${col3}"/>
      </linearGradient>
      <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#eab308"/>
        <stop offset="50%" stop-color="#fef08a"/>
        <stop offset="100%" stop-color="#ca8a04"/>
      </linearGradient>
    </defs>
    <rect width="850" height="1050" fill="url(#teacherBg_${seed})"/>

    <!-- School Header Banner -->
    <rect x="0" y="0" width="850" height="140" fill="#0f172a" fill-opacity="0.95"/>
    <rect x="0" y="136" width="850" height="4" fill="url(#goldRibbon)"/>

    <text x="425" y="50" font-family="'Arial', sans-serif" font-size="20" font-weight="bold" fill="#38bdf8" text-anchor="middle" letter-spacing="1">NGÀNH GIÁO DỤC &amp; ĐÀO TẠO TP. CÀ MAU</text>
    <text x="425" y="85" font-family="'Times New Roman', serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">TRƯỜNG TIỂU HỌC PHƯỜNG AN XUYÊN</text>
    <text x="425" y="115" font-family="'Arial', sans-serif" font-size="15" fill="#fef08a" text-anchor="middle" font-weight="bold">HỒ SƠ ĐỘI NGŨ GIÁO VIÊN - ĐỒNG NGHIỆP</text>

    <!-- Chalkboard motif background -->
    <rect x="50" y="180" width="750" height="780" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.2"/>

    <!-- Center Portrait Frame -->
    <circle cx="425" cy="380" r="160" fill="#ffffff" fill-opacity="0.1"/>
    <circle cx="425" cy="380" r="145" fill="#0f172a" stroke="url(#goldRibbon)" stroke-width="6"/>

    <!-- Teacher Professional Silhouette -->
    <g transform="translate(425, 410)">
      <circle cx="0" cy="-60" r="50" fill="#f8fafc"/>
      <path d="M-90,80 C-70,0 70,0 90,80 Z" fill="#3b82f6"/>
      <!-- White formal collar -->
      <polygon points="0,0 -20,35 0,45 20,35" fill="#ffffff"/>
      <polygon points="0,20 -7,80 7,80" fill="#dc2626"/>
    </g>

    <!-- Teacher Information Card -->
    <rect x="100" y="600" width="650" height="230" rx="16" fill="#0f172a" fill-opacity="0.85" stroke="url(#goldRibbon)" stroke-width="2.5"/>
    <text x="425" y="660" font-family="'Times New Roman', serif" font-size="34" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="1">${teacherName}</text>
    <text x="425" y="705" font-family="'Arial', sans-serif" font-size="18" font-weight="bold" fill="#38bdf8" text-anchor="middle">GIÁO VIÊN TIỂU HỌC</text>
    <text x="425" y="740" font-family="'Arial', sans-serif" font-size="16" fill="#e2e8f0" text-anchor="middle">Đơn vị: Trường Tiểu học Phường An Xuyên, TP. Cà Mau</text>
    <text x="425" y="775" font-family="'Times New Roman', serif" font-size="15" font-style="italic" fill="#94a3b8" text-anchor="middle">"Tất cả vì học sinh thân yêu • Mỗi thầy cô là một tấm gương đạo đức"</text>

    <!-- School Verification Badge -->
    <g transform="translate(130, 880)">
      <circle cx="40" cy="40" r="35" fill="none" stroke="#ef4444" stroke-width="2.5"/>
      <circle cx="40" cy="40" r="30" fill="none" stroke="#ef4444" stroke-width="1"/>
      <text x="40" y="37" font-family="'Arial', sans-serif" font-size="10" font-weight="bold" fill="#ef4444" text-anchor="middle">TIỂU HỌC</text>
      <text x="40" y="49" font-family="'Arial', sans-serif" font-size="9" font-weight="bold" fill="#ef4444" text-anchor="middle">AN XUYÊN</text>
    </g>

    <text x="425" y="990" font-family="'Arial', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Hồ sơ lưu trữ đồng nghiệp của Thầy Từ Văn Gọn</text>
  </svg>`;
}

/**
 * 5. School Activities & Classroom
 */
function generateSchoolActivitySvg(title: string, folder: string, seed: number): string {
  const isTimetable = title.toUpperCase().includes('THỜI KHOÁ') || title.toUpperCase().includes('THỜI KHÓA');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
    <defs>
      <linearGradient id="schoolBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e3a8a"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="700" fill="url(#schoolBg)"/>

    <!-- Bulletin board / Chalkboard -->
    <rect x="40" y="40" width="920" height="620" rx="16" fill="#0f172a" stroke="#fbbf24" stroke-width="5"/>

    <!-- Header -->
    <text x="500" y="100" font-family="'Times New Roman', serif" font-size="32" font-weight="bold" fill="#fef08a" text-anchor="middle">${title}</text>
    <text x="500" y="135" font-family="'Arial', sans-serif" font-size="16" fill="#93c5fd" text-anchor="middle">Thư mục: ${folder} • Năm học Tiểu học Phường An Xuyên</text>
    <line x1="150" y1="155" x2="850" y2="155" stroke="#38bdf8" stroke-width="2"/>

    ${
      isTimetable
        ? `<!-- Timetable Schedule Grid -->
        <g transform="translate(100, 180)">
          <rect width="800" height="420" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <!-- Grid Header -->
          <rect width="800" height="50" rx="8" fill="#0284c7"/>
          <text x="80" y="32" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">TIẾT</text>
          <text x="210" y="32" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">THỨ 2</text>
          <text x="340" y="32" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">THỨ 3</text>
          <text x="470" y="32" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">THỨ 4</text>
          <text x="600" y="32" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">THỨ 5</text>
          <text x="730" y="32" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">THỨ 6</text>

          <!-- Row 1 -->
          <line x1="0" y1="110" x2="800" y2="110" stroke="#334155" stroke-width="1"/>
          <text x="80" y="90" font-family="'Arial', sans-serif" font-size="15" fill="#fef08a" text-anchor="middle" font-weight="bold">Tiết 1</text>
          <text x="210" y="90" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Chào cờ</text>
          <text x="340" y="90" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Tiếng Việt</text>
          <text x="470" y="90" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Toán</text>
          <text x="600" y="90" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Tiếng Việt</text>
          <text x="730" y="90" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Toán</text>

          <!-- Row 2 -->
          <line x1="0" y1="170" x2="800" y2="170" stroke="#334155" stroke-width="1"/>
          <text x="80" y="150" font-family="'Arial', sans-serif" font-size="15" fill="#fef08a" text-anchor="middle" font-weight="bold">Tiết 2</text>
          <text x="210" y="150" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Toán</text>
          <text x="340" y="150" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Tiếng Việt</text>
          <text x="470" y="150" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Tự nhiên &amp; XH</text>
          <text x="600" y="150" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Âm nhạc</text>
          <text x="730" y="150" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Tiếng Việt</text>

          <!-- Row 3 -->
          <line x1="0" y1="230" x2="800" y2="230" stroke="#334155" stroke-width="1"/>
          <text x="80" y="210" font-family="'Arial', sans-serif" font-size="15" fill="#fef08a" text-anchor="middle" font-weight="bold">Tiết 3</text>
          <text x="210" y="210" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Tiếng Việt</text>
          <text x="340" y="210" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Toán</text>
          <text x="470" y="210" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Đạo đức</text>
          <text x="600" y="210" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Mĩ thuật</text>
          <text x="730" y="210" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">HĐTN</text>

          <!-- Row 4 -->
          <text x="80" y="270" font-family="'Arial', sans-serif" font-size="15" fill="#fef08a" text-anchor="middle" font-weight="bold">Tiết 4</text>
          <text x="210" y="270" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">HĐTN</text>
          <text x="340" y="270" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Giáo dục thể chất</text>
          <text x="470" y="270" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Tiếng Việt</text>
          <text x="600" y="270" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Hoạt động trải nghiệm</text>
          <text x="730" y="270" font-family="'Arial', sans-serif" font-size="15" fill="#ffffff" text-anchor="middle">Sinh hoạt lớp</text>
        </g>`
        : `<!-- Activity certificate / photo frame -->
        <g transform="translate(150, 200)">
          <rect width="700" height="380" rx="12" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="350" cy="140" r="70" fill="#f59e0b" opacity="0.2"/>
          <polygon points="350,85 365,125 405,125 372,150 385,190 350,165 315,190 328,150 295,125 335,125" fill="#fbbf24"/>
          <text x="350" y="240" font-family="'Times New Roman', serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
          <text x="350" y="280" font-family="'Arial', sans-serif" font-size="18" fill="#38bdf8" text-anchor="middle">Hoạt động phong trào học sinh Tiểu học An Xuyên</text>
          <text x="350" y="320" font-family="'Arial', sans-serif" font-size="15" fill="#cbd5e1" text-anchor="middle">Giáo viên chủ nhiệm: Thầy Từ Văn Gọn</text>
        </g>`
    }
  </svg>`;
}

/**
 * 6. ẢNH CẢ NHÀ (Family Album Photos with 6 distinct realistic scenery themes)
 */
function generateFamilyPhotoSvg(title: string, folder: string, seed: number): string {
  const themeIndex = seed % 6;
  const dateYears = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const year = dateYears[seed % dateYears.length];
  const month = ((seed % 12) + 1).toString().padStart(2, '0');
  const day = ((seed % 28) + 1).toString().padStart(2, '0');
  const hour = ((seed % 12) + 8).toString().padStart(2, '0');
  const minute = (seed % 60).toString().padStart(2, '0');
  const dateStamp = `${year}/${month}/${day} ${hour}:${minute}`;

  // Theme 0: Mũi Cà Mau & Bờ biển (Ocean & Beach)
  if (themeIndex === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
      <defs>
        <linearGradient id="sky0" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="55%" stop-color="#38bdf8"/>
          <stop offset="85%" stop-color="#bae6fd"/>
          <stop offset="100%" stop-color="#fef08a"/>
        </linearGradient>
        <linearGradient id="sea0" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0369a1"/>
          <stop offset="40%" stop-color="#0284c7"/>
          <stop offset="80%" stop-color="#0d9488"/>
          <stop offset="100%" stop-color="#fde047"/>
        </linearGradient>
      </defs>
      <!-- Sky -->
      <rect width="1000" height="440" fill="url(#sky0)"/>
      <!-- Sun -->
      <circle cx="820" cy="140" r="60" fill="#fef08a" opacity="0.9"/>
      <circle cx="820" cy="140" r="90" fill="#fef08a" opacity="0.25"/>
      <!-- Sea & Waves -->
      <rect y="440" width="1000" height="260" fill="url(#sea0)"/>
      <path d="M0,450 Q250,430 500,450 T1000,450 L1000,470 Q750,450 500,470 T0,470 Z" fill="#ffffff" opacity="0.4"/>
      <path d="M0,480 Q250,460 500,480 T1000,480 L1000,500 Q750,480 500,500 T0,500 Z" fill="#ffffff" opacity="0.3"/>
      <!-- Sandy Shore -->
      <path d="M0,570 Q500,530 1000,560 L1000,700 L0,700 Z" fill="#fef08a" opacity="0.85"/>
      <!-- Coconut Palm silhouette on left -->
      <path d="M-20,700 Q120,400 80,180" stroke="#78350f" stroke-width="26" fill="none"/>
      <!-- Palm fronds -->
      <path d="M80,180 Q160,110 260,150" stroke="#15803d" stroke-width="12" fill="none"/>
      <path d="M80,180 Q200,160 280,240" stroke="#16a34a" stroke-width="10" fill="none"/>
      <path d="M80,180 Q40,110 -20,130" stroke="#15803d" stroke-width="12" fill="none"/>
      <path d="M80,180 Q10,170 -40,240" stroke="#166534" stroke-width="10" fill="none"/>
      <!-- Seagulls -->
      <path d="M420,180 Q435,165 450,180 Q465,165 480,180" stroke="#ffffff" stroke-width="3" fill="none"/>
      <path d="M510,150 Q522,138 535,150 Q547,138 560,150" stroke="#ffffff" stroke-width="2.5" fill="none"/>

      <!-- Family Silhouette by the beach -->
      <g transform="translate(560, 480)">
        <!-- Father -->
        <circle cx="0" cy="-60" r="14" fill="#0f172a"/>
        <path d="M-15,10 L-10,-40 L10,-40 L15,10 Z" fill="#0f172a"/>
        <line x1="-8" y1="10" x2="-8" y2="60" stroke="#0f172a" stroke-width="6"/>
        <line x1="8" y1="10" x2="8" y2="60" stroke="#0f172a" stroke-width="6"/>
        <!-- Mother -->
        <circle cx="35" cy="-55" r="13" fill="#0f172a"/>
        <path d="M22,15 L25,-38 L45,-38 L50,15 Z" fill="#0f172a"/>
        <path d="M20,15 L50,15 L55,55 L15,55 Z" fill="#0f172a"/>
        <!-- Child holding hands -->
        <circle cx="70" cy="-35" r="10" fill="#0f172a"/>
        <path d="M62,15 L64,-22 L76,-22 L78,15 Z" fill="#0f172a"/>
        <line x1="66" y1="15" x2="66" y2="50" stroke="#0f172a" stroke-width="4"/>
        <line x1="74" y1="15" x2="74" y2="50" stroke="#0f172a" stroke-width="4"/>
      </g>

      <!-- Camera Overlay Badge & Caption -->
      <rect x="30" y="30" width="460" height="65" rx="10" fill="#0f172a" fill-opacity="0.75" stroke="#ffffff" stroke-width="1"/>
      <text x="45" y="58" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${title}</text>
      <text x="45" y="80" font-family="'Arial', sans-serif" font-size="12" fill="#38bdf8">ẢNH GIA ĐÌNH • MŨI CÀ MAU • THẦY TỪ VĂN GỌN</text>

      <!-- Digital LCD Date Stamp (Classic Orange Camera Date) -->
      <text x="960" y="665" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#f97316" text-anchor="end" letter-spacing="2">${dateStamp}</text>
    </svg>`;
  }

  // Theme 1: Hoàng hôn Sông nước Miền Tây (Sunset River)
  if (themeIndex === 1) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
      <defs>
        <linearGradient id="sunset1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#4a044e"/>
          <stop offset="35%" stop-color="#9d174d"/>
          <stop offset="65%" stop-color="#ea580c"/>
          <stop offset="100%" stop-color="#facc15"/>
        </linearGradient>
        <linearGradient id="river1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#c2410c"/>
          <stop offset="50%" stop-color="#7c2d12"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
      </defs>
      <!-- Sunset Sky -->
      <rect width="1000" height="420" fill="url(#sunset1)"/>
      <!-- Giant Sunset Sun -->
      <circle cx="500" cy="360" r="100" fill="#fef08a" opacity="0.95"/>
      <circle cx="500" cy="360" r="140" fill="#f97316" opacity="0.3"/>
      <!-- River -->
      <rect y="420" width="1000" height="280" fill="url(#river1)"/>
      <!-- Sun shimmer reflection on water -->
      <polygon points="450,420 550,420 620,700 380,700" fill="#fbbf24" opacity="0.25"/>
      <!-- Mangrove shoreline silhouette -->
      <path d="M0,420 Q120,400 240,420 Q360,395 480,420 Q600,400 720,420 Q840,395 1000,420 L1000,435 L0,435 Z" fill="#18181b"/>
      <!-- Traditional wooden sampan boat on river -->
      <g transform="translate(420, 480)">
        <path d="M-60,10 Q0,25 60,10 Q40,-5 -60,10 Z" fill="#09090b"/>
        <!-- Boater silhouette -->
        <circle cx="-10" cy="-12" r="7" fill="#09090b"/>
        <!-- Nón lá (Conical hat) silhouette -->
        <polygon points="-24,-13 4,-13 -10,-24" fill="#09090b"/>
        <line x1="-5" y1="-5" x2="15" y2="30" stroke="#09090b" stroke-width="3"/>
      </g>

      <!-- Frame & Title -->
      <rect x="30" y="30" width="460" height="65" rx="10" fill="#0f172a" fill-opacity="0.8" stroke="#fbbf24" stroke-width="1"/>
      <text x="45" y="58" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${title}</text>
      <text x="45" y="80" font-family="'Arial', sans-serif" font-size="12" fill="#fbbf24">HOÀNG HÔN SÔNG NƯỚC • KỶ NIỆM GIA ĐÌNH THẦY GỌN</text>

      <text x="960" y="665" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#f97316" text-anchor="end" letter-spacing="2">${dateStamp}</text>
    </svg>`;
  }

  // Theme 2: Khu vườn & Hoa lá tươi vui (Garden & Nature)
  if (themeIndex === 2) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
      <defs>
        <linearGradient id="garden2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="40%" stop-color="#38bdf8"/>
          <stop offset="70%" stop-color="#4ade80"/>
          <stop offset="100%" stop-color="#15803d"/>
        </linearGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#garden2)"/>
      <!-- Sun flare -->
      <circle cx="150" cy="120" r="70" fill="#fef08a" opacity="0.8"/>
      <!-- Lush green hills -->
      <path d="M0,450 Q300,320 600,450 T1000,420 L1000,700 L0,700 Z" fill="#16a34a"/>
      <path d="M0,520 Q400,420 800,530 T1000,500 L1000,700 L0,700 Z" fill="#15803d"/>

      <!-- Blooming colorful flowers -->
      <g transform="translate(180, 580)">
        <circle cx="0" cy="0" r="16" fill="#ef4444"/>
        <circle cx="0" cy="0" r="6" fill="#fde047"/>
      </g>
      <g transform="translate(320, 610)">
        <circle cx="0" cy="0" r="20" fill="#f43f5e"/>
        <circle cx="0" cy="0" r="8" fill="#fef08a"/>
      </g>
      <g transform="translate(680, 570)">
        <circle cx="0" cy="0" r="18" fill="#eab308"/>
        <circle cx="0" cy="0" r="7" fill="#ffffff"/>
      </g>
      <g transform="translate(850, 600)">
        <circle cx="0" cy="0" r="22" fill="#ec4899"/>
        <circle cx="0" cy="0" r="8" fill="#fef08a"/>
      </g>

      <!-- Frame & Title -->
      <rect x="30" y="30" width="460" height="65" rx="10" fill="#064e3b" fill-opacity="0.85" stroke="#4ade80" stroke-width="1"/>
      <text x="45" y="58" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${title}</text>
      <text x="45" y="80" font-family="'Arial', sans-serif" font-size="12" fill="#4ade80">SUM HỌP GIA ĐÌNH • KHU VƯỜN AN XUYÊN</text>

      <text x="960" y="665" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#f97316" text-anchor="end" letter-spacing="2">${dateStamp}</text>
    </svg>`;
  }

  // Theme 3: Tiệc sum vầy & Ánh sáng ấm cúng (Festive Warm Bokeh)
  if (themeIndex === 3) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
      <defs>
        <radialGradient id="bokeh3" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#7c2d12"/>
          <stop offset="60%" stop-color="#451a03"/>
          <stop offset="100%" stop-color="#1c0b02"/>
        </radialGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#bokeh3)"/>
      <!-- Fairy lights & Bokeh spheres -->
      <circle cx="200" cy="200" r="80" fill="#f59e0b" opacity="0.25"/>
      <circle cx="450" cy="180" r="110" fill="#fef08a" opacity="0.2"/>
      <circle cx="750" cy="250" r="90" fill="#ea580c" opacity="0.25"/>
      <circle cx="320" cy="420" r="75" fill="#fde047" opacity="0.2"/>
      <circle cx="680" cy="450" r="100" fill="#fb923c" opacity="0.2"/>

      <!-- String lights along top -->
      <path d="M0,80 Q250,140 500,80 T1000,80" stroke="#fef08a" stroke-width="2" fill="none" opacity="0.6"/>
      <circle cx="150" cy="105" r="8" fill="#fef08a"/>
      <circle cx="300" cy="108" r="8" fill="#fef08a"/>
      <circle cx="450" cy="85" r="8" fill="#fef08a"/>
      <circle cx="600" cy="88" r="8" fill="#fef08a"/>
      <circle cx="750" cy="98" r="8" fill="#fef08a"/>
      <circle cx="900" cy="82" r="8" fill="#fef08a"/>

      <!-- Center Greeting Banner -->
      <rect x="220" y="270" width="560" height="160" rx="16" fill="#1c0b02" fill-opacity="0.85" stroke="#f59e0b" stroke-width="3"/>
      <text x="500" y="335" font-family="'Times New Roman', serif" font-size="32" font-weight="bold" fill="#fef08a" text-anchor="middle">SUM VẦY GIA ĐÌNH ẤM CÚNG</text>
      <text x="500" y="380" font-family="'Arial', sans-serif" font-size="18" fill="#fdba74" text-anchor="middle">${title}</text>

      <text x="960" y="665" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#f97316" text-anchor="end" letter-spacing="2">${dateStamp}</text>
    </svg>`;
  }

  // Theme 4: Du xuân Đón Tết Cà Mau (Hoa Mai Vàng)
  if (themeIndex === 4) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
      <defs>
        <linearGradient id="tet4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#991b1b"/>
          <stop offset="50%" stop-color="#7f1d1d"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </linearGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#tet4)"/>

      <!-- Mai branch with yellow blossoms -->
      <path d="M1000,100 Q600,200 400,320 Q200,450 0,400" stroke="#78350f" stroke-width="14" fill="none"/>
      <path d="M650,190 Q550,100 450,110" stroke="#78350f" stroke-width="8" fill="none"/>
      <path d="M420,310 Q350,220 280,240" stroke="#78350f" stroke-width="7" fill="none"/>

      <!-- Mai Blossoms (5 yellow petals) -->
      ${[
        [650, 180],
        [520, 110],
        [450, 115],
        [430, 305],
        [320, 230],
        [220, 420],
        [540, 240],
      ]
        .map(
          ([x, y]) => `<g transform="translate(${x}, ${y})">
          <circle cx="0" cy="-14" r="10" fill="#facc15"/>
          <circle cx="13" cy="-4" r="10" fill="#facc15"/>
          <circle cx="8" cy="12" r="10" fill="#facc15"/>
          <circle cx="-8" cy="12" r="10" fill="#facc15"/>
          <circle cx="-13" cy="-4" r="10" fill="#facc15"/>
          <circle cx="0" cy="0" r="6" fill="#ea580c"/>
        </g>`
        )
        .join('')}

      <!-- Center Festival Plaque -->
      <rect x="250" y="440" width="500" height="150" rx="16" fill="#1f2937" fill-opacity="0.9" stroke="#facc15" stroke-width="3"/>
      <text x="500" y="495" font-family="'Times New Roman', serif" font-size="30" font-weight="bold" fill="#fde047" text-anchor="middle">KỶ NIỆM XUÂN GIA ĐÌNH</text>
      <text x="500" y="540" font-family="'Arial', sans-serif" font-size="18" fill="#ffffff" text-anchor="middle">${title} • Cà Mau</text>

      <text x="960" y="665" font-family="'Courier New', monospace" font-size="24" font-weight="bold" fill="#f97316" text-anchor="end" letter-spacing="2">${dateStamp}</text>
    </svg>`;
  }

  // Theme 5: Studio Portrait Memories (Polaroid / Classic Camera Frame)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" width="1000" height="700">
    <defs>
      <linearGradient id="studio5" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="50%" stop-color="#0f172a"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
    </defs>
    <rect width="1000" height="700" fill="url(#studio5)"/>

    <!-- Polaroid style white photo frame -->
    <rect x="180" y="50" width="640" height="580" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
    <!-- Photo inner area -->
    <rect x="210" y="80" width="580" height="430" rx="6" fill="#0284c7"/>
    <circle cx="500" cy="270" r="140" fill="#38bdf8" opacity="0.3"/>
    <circle cx="500" cy="270" r="80" fill="#f8fafc" opacity="0.2"/>

    <!-- Silhouette couple / family portrait -->
    <g transform="translate(500, 310)">
      <!-- Left person -->
      <circle cx="-50" cy="-60" r="32" fill="#ffffff"/>
      <path d="M-95,40 C-85,-20 -15,-20 -5,40 Z" fill="#ffffff"/>
      <!-- Right person -->
      <circle cx="50" cy="-55" r="30" fill="#ffffff"/>
      <path d="M5,40 C15,-15 85,-15 95,40 Z" fill="#ffffff"/>
    </g>

    <!-- Polaroid Handwritten-style Caption -->
    <text x="500" y="565" font-family="'Times New Roman', serif" font-size="26" font-weight="bold" fill="#0f172a" text-anchor="middle">${title}</text>
    <text x="500" y="595" font-family="'Arial', sans-serif" font-size="14" fill="#64748b" text-anchor="middle">ẢNH KỶ NIỆM GIA ĐÌNH • THẦY TỪ VĂN GỌN • ${dateStamp}</text>
  </svg>`;
}

/**
 * 7. ẢNH LƯU TRỮ (DSLR Camera Viewfinder HUD - DSC_..., SDC..., etc.)
 */
function generateCameraArchiveSvg(title: string, folder: string, seed: number): string {
  const landscapes = [
    ['#0c4a6e', '#0369a1', '#38bdf8'], // Cool blue ocean
    ['#701a75', '#a21caf', '#f472b6'], // Violet dawn
    ['#7c2d12', '#ea580c', '#fbbf24'], // Golden hour
    ['#064e3b', '#047857', '#34d399'], // Green delta forest
    ['#1e1b4b', '#4338ca', '#818cf8'], // Twilight indigo
  ];
  const [c1, c2, c3] = landscapes[seed % landscapes.length];
  const isoValues = [100, 200, 400, 800];
  const shutters = ['1/250', '1/500', '1/1000', '1/125'];
  const apertures = ['f/2.8', 'f/4.0', 'f/5.6', 'f/1.8'];
  const iso = isoValues[seed % isoValues.length];
  const shutter = shutters[seed % shutters.length];
  const fnum = apertures[seed % apertures.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 660" width="1000" height="660">
    <defs>
      <linearGradient id="camBg_${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="60%" stop-color="${c2}"/>
        <stop offset="100%" stop-color="${c3}"/>
      </linearGradient>
    </defs>
    <!-- Scenic backdrop -->
    <rect width="1000" height="660" fill="url(#camBg_${seed})"/>

    <!-- Rule of thirds grid -->
    <line x1="333" y1="0" x2="333" y2="660" stroke="#ffffff" stroke-width="0.75" opacity="0.25"/>
    <line x1="666" y1="0" x2="666" y2="660" stroke="#ffffff" stroke-width="0.75" opacity="0.25"/>
    <line x1="0" y1="220" x2="1000" y2="220" stroke="#ffffff" stroke-width="0.75" opacity="0.25"/>
    <line x1="0" y1="440" x2="1000" y2="440" stroke="#ffffff" stroke-width="0.75" opacity="0.25"/>

    <!-- Center Autofocus Point [ + ] -->
    <g transform="translate(500, 330)">
      <rect x="-35" y="-35" width="70" height="70" rx="4" fill="none" stroke="#22c55e" stroke-width="2.5"/>
      <line x1="-12" y1="0" x2="12" y2="0" stroke="#22c55e" stroke-width="2"/>
      <line x1="0" y1="-12" x2="0" y2="12" stroke="#22c55e" stroke-width="2"/>
    </g>

    <!-- Top Camera HUD -->
    <rect x="0" y="0" width="1000" height="50" fill="#000000" fill-opacity="0.6"/>
    <text x="30" y="32" font-family="'Arial', sans-serif" font-size="14" font-weight="bold" fill="#ef4444">● REC</text>
    <text x="110" y="32" font-family="'Arial', sans-serif" font-size="14" font-weight="bold" fill="#ffffff">RAW + FINE</text>
    <text x="250" y="32" font-family="'Arial', sans-serif" font-size="14" fill="#38bdf8">SD1: 1,480 REMAINING</text>
    <text x="970" y="32" font-family="'Arial', sans-serif" font-size="14" font-weight="bold" fill="#22c55e" text-anchor="end">BATTERY: 94% [||||]</text>

    <!-- Center Scenic Silhouette (Landscape / Tree / River) -->
    <g transform="translate(0, 420)">
      <path d="M0,80 Q250,20 500,80 T1000,60 L1000,240 L0,240 Z" fill="#0f172a" opacity="0.8"/>
      <path d="M0,130 Q350,60 700,140 T1000,110 L1000,240 L0,240 Z" fill="#020617"/>
    </g>

    <!-- Bottom Camera HUD Bar -->
    <rect x="0" y="600" width="1000" height="60" fill="#000000" fill-opacity="0.8"/>
    <text x="40" y="638" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#fbbf24">${shutter}s</text>
    <text x="180" y="638" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#fbbf24">${fnum}</text>
    <text x="310" y="638" font-family="'Courier New', monospace" font-size="20" font-weight="bold" fill="#fbbf24">ISO ${iso}</text>
    <text x="460" y="638" font-family="'Courier New', monospace" font-size="18" fill="#22c55e">EV 0.0</text>

    <!-- File Title in HUD -->
    <text x="700" y="638" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${title}</text>
    <text x="960" y="638" font-family="'Arial', sans-serif" font-size="13" fill="#94a3b8" text-anchor="end">${folder}</text>
  </svg>`;
}

/**
 * 8. Web Graphics & Icons (rulers, bullets, www-graf, etc.)
 */
function generateWebGraphicSvg(title: string, folder: string, seed: number): string {
  const isRuler = folder.includes('RULER') || title.toLowerCase().includes('rulr');
  const isBullet = folder.includes('BULLET') || title.toLowerCase().includes('coffee') || title.toLowerCase().includes('star');

  if (isRuler) {
    const rulerColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const rCol = rulerColors[seed % rulerColors.length];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 120" width="800" height="120">
      <rect width="800" height="120" fill="#0f172a"/>
      <!-- Decorative 3D Ruler -->
      <rect x="50" y="45" width="700" height="16" rx="8" fill="${rCol}"/>
      <rect x="50" y="45" width="700" height="6" rx="3" fill="#ffffff" opacity="0.5"/>
      <!-- Measurement ticks -->
      ${Array.from({ length: 28 })
        .map((_, i) => `<line x1="${60 + i * 25}" y1="65" x2="${60 + i * 25}" y2="${i % 5 === 0 ? 80 : 73}" stroke="#ffffff" stroke-width="2" opacity="0.6"/>`)
        .join('')}
      <text x="400" y="105" font-family="'Arial', sans-serif" font-size="13" font-weight="bold" fill="#94a3b8" text-anchor="middle">${title} • ${folder}</text>
    </svg>`;
  }

  if (isBullet) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300">
      <rect width="400" height="300" fill="#0f172a"/>
      <!-- Large 3D Bullet Icon -->
      <circle cx="200" cy="130" r="50" fill="#3b82f6"/>
      <circle cx="180" cy="110" r="18" fill="#ffffff" opacity="0.6"/>
      <text x="200" y="240" font-family="'Arial', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
      <text x="200" y="270" font-family="'Arial', sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">Icon Bullet: ${folder}</text>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
    <rect width="600" height="400" fill="#0f172a"/>
    <circle cx="300" cy="180" r="70" fill="#0284c7" opacity="0.3"/>
    <rect x="250" y="130" width="100" height="100" rx="16" fill="none" stroke="#38bdf8" stroke-width="4"/>
    <text x="300" y="310" font-family="'Arial', sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="300" y="340" font-family="'Arial', sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${folder}</text>
  </svg>`;
}
