import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from 'docx';
import fs from 'fs';

/**
 * Kiểm tra xem tệp có phải là file .docx (Office OpenXML) hợp lệ không
 * Tất cả file .docx chuẩn luôn bắt đầu bằng magic header PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
 */
export function isRealDocx(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return false;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    return buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  } catch {
    return false;
  }
}

/**
 * Tự động tạo tệp Microsoft Word .docx chuẩn Office 2007 - Office 365
 * Đảm bảo mở trên Microsoft Word không bị lỗi unreadable content
 */
export async function generateValidDocx(
  fileName: string,
  folderName: string = 'Giáo án Tiểu học',
  previewContent?: string
): Promise<Buffer> {
  const cleanTitle = fileName.replace(/\.docx$/i, '');

  // Trích xuất môn học và tuần nếu có
  let subject = 'KẾ HOẠCH BÀI DẠY (GIÁO ÁN)';
  if (cleanTitle.includes('ĐẠO ĐỨC')) subject = 'MÔN: ĐẠO ĐỨC - LỚP 1';
  else if (cleanTitle.includes('TOÁN')) subject = 'MÔN: TOÁN - LỚP 1';
  else if (cleanTitle.includes('TIẾNG VIỆT')) subject = 'MÔN: TIẾNG VIỆT - LỚP 1';
  else if (cleanTitle.includes('HĐTN') || cleanTitle.includes('HOẠT ĐỘNG TRẢI NGHIỆM'))
    subject = 'MÔN: HOẠT ĐỘNG TRẢI NGHIỆM 1';
  else if (cleanTitle.includes('TNXH') || cleanTitle.includes('TỰ NHIÊN VÀ XÃ HỘI'))
    subject = 'MÔN: TỰ NHIÊN VÀ XÃ HỘI 1';
  else if (cleanTitle.includes('MỸ THUẬT')) subject = 'MÔN: MỸ THUẬT 1';
  else if (cleanTitle.includes('ÂM NHẠC')) subject = 'MÔN: ÂM NHẠC 1';
  else if (cleanTitle.includes('GDTC') || cleanTitle.includes('GIÁO DỤC THỂ CHẤT'))
    subject = 'MÔN: GIÁO DỤC THỂ CHẤT 1';

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134, // 2 cm
              bottom: 1134,
              left: 1417, // 2.5 cm
              right: 1134,
            },
          },
        },
        children: [
          // Tiêu ngữ / Đơn vị
          new Paragraph({
            children: [
              new TextRun({
                text: 'PHÒNG GIÁO DỤC VÀ ĐÀO TẠO THÀNH PHỐ CÀ MAU',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'TRƯỜNG TIỂU HỌC PHƯỜNG AN XUYÊN',
                bold: true,
                size: 24,
                color: '064AA8',
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '----------------------------------------',
                color: '888888',
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),

          // Tên bài dạy
          new Paragraph({
            children: [
              new TextRun({
                text: 'KẾ HOẠCH BÀI DẠY (GIÁO ÁN)',
                bold: true,
                size: 30,
                color: '0866E8',
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${subject.toUpperCase()}`,
                bold: true,
                size: 26,
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `BÀI: ${cleanTitle.toUpperCase()}`,
                bold: true,
                size: 24,
                color: '1E293B',
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Chương trình Giáo dục phổ thông 2018 (GDPT 2018)',
                italics: true,
                size: 22,
                color: '64748B',
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Giáo viên thực hiện: Thầy Từ Văn Gọn  |  Năm học: 2026 - 2027',
                italics: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ text: '' }),

          // Phần I: Yêu cầu cần đạt
          new Paragraph({
            children: [
              new TextRun({
                text: 'I. YÊU CẦU CẦN ĐẠT (MỤC TIÊU BÀI DẠY):',
                bold: true,
                size: 24,
                color: '0F172A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '1. Về năng lực đặc thù: ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: `Học sinh nắm vững các kiến thức, kỹ năng cốt lõi của nội dung bài học "${cleanTitle}". Biết vận dụng linh hoạt vào thực tế học tập và đời sống sinh hoạt hàng ngày.`,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '2. Về năng lực chung: ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Tự chủ và tự học (tích cực hoàn thành nhiệm vụ cá nhân), Giao tiếp và hợp tác (chia sẻ nhóm, thảo luận sôi nổi), Giải quyết vấn đề và sáng tạo.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '3. Về phẩm chất chủ yếu: ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Rèn luyện đức tính chăm chỉ, trung thực, tinh thần trách nhiệm và lòng nhân ái theo định hướng phát triển toàn diện phẩm chất học sinh tiểu học.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Phần II: Đồ dùng dạy học
          new Paragraph({
            children: [
              new TextRun({
                text: 'II. ĐỒ DÙNG DẠY HỌC:',
                bold: true,
                size: 24,
                color: '0F172A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '- Giáo viên: Kế hoạch bài dạy (Giáo án Word), bài giảng điện tử PowerPoint tương tác, tranh ảnh minh họa sinh động, phiếu bài tập, thiết bị trình chiếu TV/máy chiếu.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '- Học sinh: Sách giáo khoa, Vở bài tập, bút màu, đồ dùng học tập cá nhân theo yêu cầu bài học.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Phần III: Các hoạt động dạy học chủ yếu
          new Paragraph({
            children: [
              new TextRun({
                text: 'III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (TIẾN TRÌNH SƯ PHẠM):',
                bold: true,
                size: 24,
                color: '0F172A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '1. Hoạt động Khởi động (5 phút): ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Tổ chức cho học sinh vận động, múa hát hoặc tham gia trò chơi khởi động vui nhộn nhằm tạo tâm thế hào hứng, kết nối vào bài học mới.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '2. Hoạt động Khám phá (15 phút): ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Giáo viên dẫn dắt, quan sát tranh ảnh và gợi mở câu hỏi. Học sinh thảo luận theo cặp/nhóm để cùng khám phá và hình thành kiến thức trọng tâm của bài.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '3. Hoạt động Luyện tập, thực hành (10 phút): ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Học sinh làm bài tập trong Vở bài tập hoặc thảo luận sắm vai tình huống. Giáo viên theo dõi, hướng dẫn kịp thời và tuyên dương các em làm tốt.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '4. Hoạt động Vận dụng, trải nghiệm (5 phút): ',
                bold: true,
                size: 22,
                font: 'Times New Roman',
              }),
              new TextRun({
                text: 'Liên hệ bài học với thực tế gia đình và lớp học. Dặn dò học sinh ghi nhớ và thực hiện thường xuyên.',
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          // Phần IV: Điều chỉnh sau bài dạy
          new Paragraph({
            children: [
              new TextRun({
                text: 'IV. ĐIỀU CHỈNH SAU BÀI DẠY (NẾU CÓ):',
                bold: true,
                size: 24,
                color: '0F172A',
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Học sinh tiếp thu bài tốt, hào hứng tham gia các hoạt động. Không cần điều chỉnh nội dung dạy học.',
                italics: true,
                size: 22,
                font: 'Times New Roman',
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),

          // Chữ ký
          new Paragraph({
            children: [
              new TextRun({
                text: 'BAN GIÁM HIỆU DUYỆT                 TỔ TRƯỞNG CHUYÊN MÔN                 GIÁO VIÊN SOẠN DẠY',
                bold: true,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '(Ký, ghi rõ họ tên)                             (Ký, ghi rõ họ tên)                                      Từ Văn Gọn',
                italics: true,
                size: 20,
                font: 'Times New Roman',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
