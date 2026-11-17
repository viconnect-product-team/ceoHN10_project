const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const assetsDir = path.join(docDir, 'slide_assets');
const pptxPath = path.join(docDir, 'SLIDE_TRINH_BAY_PHAN_MEM_CEOHN10.pptx');

async function generatePptx() {
  console.log('Generating PowerPoint CEO HN10 (.pptx) with focused 4 key modules...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Màu sắc thương hiệu
  const PRIMARY = '0B192C'; // Navy đậm
  const SECONDARY = '1E3E62'; // Blue slate
  const ACCENT = 'E63946'; // Đỏ thương hiệu HanoiBA
  const GOLD = 'F59E0B'; // Vàng cam ấm
  const LIGHT_BG = 'F8FAFC'; // Xám nhạt
  const WHITE = 'FFFFFF';

  // SLIDE 1: BÌA CHÍNH THỨC CEO HN10
  let slide1 = pptx.addSlide();
  slide1.background = { color: PRIMARY };
  slide1.addText('HIỆP HỘI DOANH NGHIỆP TRẺ HÀ NỘI (HANOIBA)', {
    x: 0.8, y: 0.8, w: 8.5, h: 0.4,
    fontSize: 14, fontFace: 'Arial', color: GOLD, bold: true, letterSpacing: 1
  });
  slide1.addText('CÂU LẠC BỘ DOANH NHÂN CEO HN10', {
    x: 0.8, y: 1.3, w: 8.5, h: 0.5,
    fontSize: 20, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide1.addText('HỆ THỐNG QUẢN TRỊ & KẾT NỐI DOANH NHÂN\nNỀN TẢNG CÔNG NGHỆ CEO HN10', {
    x: 0.8, y: 2.2, w: 11.5, h: 1.8,
    fontSize: 32, fontFace: 'Arial', color: WHITE, bold: true, lineSpacing: 38
  });
  slide1.addText('Giải pháp chuyển đổi số toàn diện: Web CRM Quản trị & Ứng dụng Di động Hội viên\nĐồng bộ dữ liệu thời gian thực - Minh bạch tài chính - Tối ưu 4 nghiệp vụ: Tổng Quan, Sự Kiện, Lớp Học, Tài Chính', {
    x: 0.8, y: 4.3, w: 11.5, h: 0.8,
    fontSize: 14, fontFace: 'Arial', color: 'CBD5E1'
  });
  slide1.addText('Tên miền chính thức: CRM (https://crm.ceohn10.viconnect.vn) | App Mobile (https://ceohn10.viconnect.vn)\nCSDL Chuẩn: 113.20.107.184:6432 | Phiên bản: v5.1 Official Release 2026', {
    x: 0.8, y: 6.2, w: 11.5, h: 0.6,
    fontSize: 11, fontFace: 'Arial', color: '94A3B8'
  });
  const logoImg = path.join(assetsDir, 'hn10_logo.png');
  if (fs.existsSync(logoImg)) {
    slide1.addImage({ path: logoImg, x: 10.5, y: 0.8, w: 2.0, h: 1.0 });
  }

  // SLIDE 2: BỐI CẢNH & TẦM NHÌN
  let slide2 = pptx.addSlide();
  slide2.background = { color: LIGHT_BG };
  slide2.addText('BỐI CẢNH & TẦM NHÌN CHUYỂN ĐỔI SỐ CEO HN10', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide2.addText('Kiến tạo nền tảng công nghệ thông minh, phục vụ cộng đồng doanh nhân trẻ Thủ đô', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });

  const colW = 3.6;
  const colY = 1.8;
  const colH = 4.6;

  slide2.addShape(pptx.ShapeType.rect, { x: 0.8, y: colY, w: colW, h: colH, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
  slide2.addText('1. Thách thức Quản trị', { x: 1.0, y: colY + 0.3, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: ACCENT });
  slide2.addText('• Dữ liệu học viên phân tán, khó quản lý sĩ số.\n• Thu chi quỹ hội bằng sổ tay dễ sai sót, thiếu realtime.\n• Điểm danh lớp học, sự kiện còn thủ công.\n• Thông tin cơ hội giao thương B2B dễ bị trôi.', {
    x: 1.0, y: colY + 0.8, w: 3.2, h: 3.4, fontSize: 12, color: '334155', lineSpacing: 18
  });

  slide2.addShape(pptx.ShapeType.rect, { x: 4.8, y: colY, w: colW, h: colH, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
  slide2.addText('2. 4 Nghiệp Vụ Trọng Tâm', { x: 5.0, y: colY + 0.3, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: PRIMARY });
  slide2.addText('• TỔNG QUAN: Bàn điều hành thông minh, giám sát toàn diện.\n• SỰ KIỆN: 4 Sự kiện cố định & Sự kiện thiện nguyện CSR.\n• LỚP HỌC: Lịch học, xem buổi học & Điểm danh mã QR.\n• TÀI CHÍNH: Quản trị dòng tiền & Quỹ hội 2.1 Tỷ VNĐ.', {
    x: 5.0, y: colY + 0.8, w: 3.2, h: 3.4, fontSize: 12, color: '334155', lineSpacing: 18
  });

  slide2.addShape(pptx.ShapeType.rect, { x: 8.8, y: colY, w: colW, h: colH, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
  slide2.addText('3. Giá trị Mang lại', { x: 9.0, y: colY + 0.3, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: '15803D' });
  slide2.addText('• Gắn kết chặt chẽ học viên doanh nhân trong lớp.\n• Tiết kiệm 85% thời gian tổng hợp báo cáo điều hành.\n• Check-in QR thông minh cho mọi buổi học & sự kiện.\n• Dữ liệu an toàn bảo mật trên CSDL PostgreSQL chuẩn.', {
    x: 9.0, y: colY + 0.8, w: 3.2, h: 3.4, fontSize: 12, color: '334155', lineSpacing: 18
  });

  // SLIDE 3: TỔNG QUAN - KIẾN TRÚC VOA
  let slide3 = pptx.addSlide();
  slide3.background = { color: PRIMARY };
  slide3.addText('1. TỔNG QUAN: KIẾN TRÚC HỆ SINH THÁI VOA CEO HN10', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide3.addText('Bản thiết kế VOA phân tầng chuyên nghiệp: Web CRM Quản trị & Mobile App Hội viên', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });
  const voaImg = path.join(assetsDir, 'voa_ceohn10.png');
  if (fs.existsSync(voaImg)) {
    slide3.addImage({ path: voaImg, x: 0.8, y: 1.7, w: 11.7, h: 4.8 });
  }

  // SLIDE 4: TỔNG QUAN - DASHBOARD CRM
  let slide4 = pptx.addSlide();
  slide4.background = { color: LIGHT_BG };
  slide4.addText('1. TỔNG QUAN: BÀN ĐIỀU HÀNH & DASHBOARD TRUNG TÂM CRM', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide4.addText('Giám sát toàn diện học viên, dòng tiền, sự kiện và tiến độ vận hành theo thời gian thực', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });
  const overviewImg = path.join(assetsDir, 'overview_dashboard.png');
  if (fs.existsSync(overviewImg)) {
    slide4.addImage({ path: overviewImg, x: 0.8, y: 1.7, w: 11.7, h: 4.8 });
  }

  // SLIDE 5: CHỨC NĂNG SỰ KIỆN
  let slide5 = pptx.addSlide();
  slide5.background = { color: PRIMARY };
  slide5.addText('2. CHỨC NĂNG SỰ KIỆN: QUẢN LÝ SỰ KIỆN & 4 SỰ KIỆN CỐ ĐỊNH', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide5.addText('Quản lý 4 sự kiện cố định thường niên, sự kiện thiện nguyện CSR và vé check-in mã QR', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });
  const eventsImg = path.join(assetsDir, 'events_management.png');
  if (fs.existsSync(eventsImg)) {
    slide5.addImage({ path: eventsImg, x: 0.8, y: 1.7, w: 8.0, h: 4.8 });
  }
  slide5.addShape(pptx.ShapeType.rect, { x: 9.1, y: 1.7, w: 3.4, h: 4.8, fill: { color: SECONDARY }, line: { color: GOLD, width: 1.5 } });
  slide5.addText('4 SỰ KIỆN CỐ ĐỊNH', { x: 9.3, y: 1.9, w: 3.0, h: 0.4, fontSize: 13, bold: true, color: GOLD });
  slide5.addText('• 15/03: Khai Giảng Lớp CEO HN10\n• 18/07: Team Building Gắn Kết\n• 26/12: Year End Party & Gala\n• 16/01: Bế Giảng & Tốt Nghiệp\n\n• Luồng Thiện Nguyện CSR\n• Check-in Vé Điện Tử QR', {
    x: 9.3, y: 2.4, w: 3.0, h: 3.8, fontSize: 11, color: WHITE, lineSpacing: 18
  });

  // SLIDE 6: CHỨC NĂNG LỚP HỌC
  let slide6 = pptx.addSlide();
  slide6.background = { color: LIGHT_BG };
  slide6.addText('3. CHỨC NĂNG LỚP HỌC: QUẢN LÝ LỚP HỌC, BUỔI HỌC & ĐIỂM DANH QR', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide6.addText('Menu tree phân cấp khóa học, thiết lập lịch học và hệ thống điểm danh QR tự động trên Mobile App', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });
  const trainingImg = path.join(assetsDir, 'trainings_classes.png');
  if (fs.existsSync(trainingImg)) {
    slide6.addImage({ path: trainingImg, x: 0.8, y: 1.7, w: 11.7, h: 4.8 });
  }

  // SLIDE 7: CHỨC NĂNG TÀI CHÍNH
  let slide7 = pptx.addSlide();
  slide7.background = { color: LIGHT_BG };
  slide7.addText('4. CHỨC NĂNG TÀI CHÍNH: MINH BẠCH THU CHI & QUỸ HỘI 2 TỶ 100 TRIỆU VNĐ', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide7.addText('Quản lý Khoản Thu, Khoản Chi, Báo cáo dòng tiền biến động thực tế và xuất chứng từ Word / Excel / PDF', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });
  const incomeImg = path.join(assetsDir, 'crm_income.jpg');
  const expensesImg = path.join(assetsDir, 'crm_expenses.jpg');
  if (fs.existsSync(incomeImg) && fs.existsSync(expensesImg)) {
    slide7.addImage({ path: incomeImg, x: 0.8, y: 1.7, w: 5.7, h: 4.8 });
    slide7.addImage({ path: expensesImg, x: 6.8, y: 1.7, w: 5.7, h: 4.8 });
  }

  // SLIDE 8: LỘ TRÌNH & BÀN GIAO
  let slide8 = pptx.addSlide();
  slide8.background = { color: PRIMARY };
  slide8.addText('LỘ TRÌNH VẬN HÀNH & BÀN GIAO CHÍNH THỨC', {
    x: 0.8, y: 0.8, w: 11.5, h: 0.5,
    fontSize: 24, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide8.addText('Hệ thống đã sẵn sàng 100% phục vụ toàn diện Lớp Doanh nhân CEO HN10', {
    x: 0.8, y: 1.4, w: 11.5, h: 0.4,
    fontSize: 14, fontFace: 'Arial', color: GOLD
  });
  slide8.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.2, w: 11.7, h: 3.8, fill: { color: SECONDARY }, line: { color: '38BDF8', width: 1.5 } });
  slide8.addText('CAM KẾT VẬN HÀNH & BẢO HÀNH CHUYÊN NGHIỆP', { x: 1.2, y: 2.5, w: 10.9, h: 0.4, fontSize: 18, bold: true, color: WHITE });
  slide8.addText('1. Dữ liệu chuẩn xác 100% lưu trữ tại máy chủ CSDL PostgreSQL: 113.20.107.184:6432.\n2. Tách biệt hoàn toàn Web CRM Quản trị và Mobile App Hội viên theo kiến trúc VOA chuẩn mực.\n3. 4 Chức năng cốt lõi: Tổng quan, Sự kiện, Lớp học và Tài chính vận hành đồng bộ và ổn định.\n4. CI/CD tự động kiểm tra code (0 errors) và build an toàn khi merge git.', {
    x: 1.2, y: 3.2, w: 10.9, h: 2.4, fontSize: 14, color: 'E2E8F0', lineSpacing: 24
  });

  await pptx.writeFile({ fileName: pptxPath });
  const stats = fs.statSync(pptxPath);
  console.log(`✅ Xuất thành công Slide PPTX CEO HN10: ${pptxPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

generatePptx().catch(console.error);
