const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const assetsDir = path.join(docDir, 'slide_assets');
const pptxPath = path.join(docDir, 'SLIDE_TRINH_BAY_PHAN_MEM_CEOHN10.pptx');

async function generatePptx() {
  console.log('Generating PowerPoint CEO HN10 (.pptx) with 4 Core Modules (Tổng quan, Sự kiện, Lớp học, Tài chính)...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Màu sắc thương hiệu Executive Slate & Navy
  const PRIMARY = '0F172A'; // Slate 900
  const SECONDARY = '1E293B'; // Slate 800
  const ACCENT = '334155'; // Slate 700
  const GOLD = 'F59E0B'; // Vàng cam ấm
  const LIGHT_BG = 'F8FAFC'; // Xám nhạt
  const WHITE = 'FFFFFF';

  // SLIDE 1: BÌA CHÍNH THỨC CEO HN10
  let slide1 = pptx.addSlide();
  slide1.background = { color: PRIMARY };
  slide1.addText('HANOIBA - HỘI DOANH NHÂN TRẺ HÀ NỘI', {
    x: 0.8, y: 0.8, w: 8.5, h: 0.4,
    fontSize: 14, fontFace: 'Arial', color: GOLD, bold: true, letterSpacing: 1
  });
  slide1.addText('CLB DOANH NHÂN CEO HÀ NỘI 10 (CEO HN10)', {
    x: 0.8, y: 1.3, w: 8.5, h: 0.5,
    fontSize: 20, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide1.addText('HỆ THỐNG PHẦN MỀM ĐIỀU HÀNH & KẾT NỐI DOANH NHÂN\nCEO HN10 (HANOIBA)', {
    x: 0.8, y: 2.2, w: 11.5, h: 1.8,
    fontSize: 30, fontFace: 'Arial', color: WHITE, bold: true, lineSpacing: 38
  });
  slide1.addText('Báo cáo chuyên sâu 4 trụ cột nghiệp vụ: Tổng Quan Điều Hành | Quản Lý Sự Kiện | Quản Lý Lớp Học | Minh Bạch Tài Chính\nWeb CRM Quản Trị (crm.ceohn10.viconnect.vn) & Mobile App Học viên (ceohn10.viconnect.vn)', {
    x: 0.8, y: 4.3, w: 11.5, h: 0.8,
    fontSize: 13, fontFace: 'Arial', color: 'CBD5E1'
  });
  slide1.addText('Máy chủ CSDL PostgreSQL Chuẩn: 113.20.107.184:6432 | Phiên bản: v5.1 Official Release 2026', {
    x: 0.8, y: 6.2, w: 11.5, h: 0.6,
    fontSize: 11, fontFace: 'Arial', color: '94A3B8'
  });
  const logoImg = path.join(assetsDir, 'hn10_logo.png');
  if (fs.existsSync(logoImg)) {
    slide1.addImage({ path: logoImg, x: 10.2, y: 0.8, w: 2.2, h: 1.1 });
  }

  // SLIDE 2: 1. TỔNG QUAN ĐIỀU HÀNH & GIAO DIỆN HỆ THỐNG
  let slide2 = pptx.addSlide();
  slide2.background = { color: LIGHT_BG };
  slide2.addText('1. TỔNG QUAN ĐIỀU HÀNH: BÀN ĐIỀU HÀNH CRM & MOBILE APP', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 20, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide2.addText('Giám sát toàn diện học viên, quỹ hội, tiến độ 7 ban chuyên trách và kết nối doanh nhân theo thời gian thực', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 12, fontFace: 'Arial', color: '64748B'
  });
  const overviewImg = path.join(assetsDir, 'overview_dashboard.png');
  const mobileImg = path.join(assetsDir, 'mobile_app_home.jpg');
  if (fs.existsSync(overviewImg)) {
    slide2.addImage({ path: overviewImg, x: 0.8, y: 1.7, w: 7.8, h: 4.8 });
  }
  if (fs.existsSync(mobileImg)) {
    slide2.addImage({ path: mobileImg, x: 8.8, y: 1.7, w: 3.7, h: 4.8 });
  }

  // SLIDE 3: 2. CHỨC NĂNG SỰ KIỆN & THIỆN NGUYỆN CSR
  let slide3 = pptx.addSlide();
  slide3.background = { color: PRIMARY };
  slide3.addText('2. PHÂN HỆ SỰ KIỆN: QUẢN LÝ SỰ KIỆN THƯỜNG NIÊN & THIỆN NGUYỆN CSR', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 20, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide3.addText('Khởi tạo sự kiện, thiết lập 4 sự kiện cố định, phân quyền Ban Thiện nguyện và vé điện tử check-in mã QR', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 12, fontFace: 'Arial', color: GOLD
  });
  const eventsImg = path.join(assetsDir, 'events_management.png');
  if (fs.existsSync(eventsImg)) {
    slide3.addImage({ path: eventsImg, x: 0.8, y: 1.7, w: 8.0, h: 4.8 });
  }
  slide3.addShape(pptx.ShapeType.rect, { x: 9.1, y: 1.7, w: 3.4, h: 4.8, fill: { color: SECONDARY }, line: { color: GOLD, width: 1.5 } });
  slide3.addText('4 SỰ KIỆN CỐ ĐỊNH NĂM', { x: 9.3, y: 1.9, w: 3.0, h: 0.4, fontSize: 13, bold: true, color: GOLD });
  slide3.addText('• 15/03: Khai Giảng Lớp CEO HN10\n• 18/07: Team Building Gắn Kết\n• 26/12: Year End Party Gala\n• 16/01: Bế Giảng & Tốt Nghiệp\n\n• SỰ KIỆN THIỆN NGUYỆN (CSR):\n  Nút tạo sự kiện riêng biệt dành cho Ban Thiện Nguyện.\n\n• VÉ ĐIỆN TỬ & CHECK-IN QR:\n  Quét mã QR điểm danh tức thì tại bàn đón tiếp.', {
    x: 9.3, y: 2.3, w: 3.0, h: 4.0, fontSize: 11, color: WHITE, lineSpacing: 16
  });

  // SLIDE 4: 3. CHỨC NĂNG LỚP HỌC & BUỔI HỌC (LỊCH HỌC & ĐIỂM DANH QR)
  let slide4 = pptx.addSlide();
  slide4.background = { color: LIGHT_BG };
  slide4.addText('3. PHÂN HỆ ĐÀO TẠO: QUẢN LÝ LỚP HỌC, BUỔI HỌC & ĐIỂM DANH MÃ QR', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 20, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide4.addText('Menu tree phân cấp khóa học, thiết lập lịch học và hệ thống quét mã QR điểm danh đẩy số liệu tức thời về CRM', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 12, fontFace: 'Arial', color: '64748B'
  });
  const trainingImg = path.join(assetsDir, 'trainings_classes.png');
  if (fs.existsSync(trainingImg)) {
    slide4.addImage({ path: trainingImg, x: 0.8, y: 1.7, w: 8.0, h: 4.8 });
  }
  slide4.addShape(pptx.ShapeType.rect, { x: 9.1, y: 1.7, w: 3.4, h: 4.8, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1.5 } });
  slide4.addText('QUẢN LÝ LỚP HỌC TOÀN DIỆN', { x: 9.3, y: 1.9, w: 3.0, h: 0.4, fontSize: 13, bold: true, color: PRIMARY });
  slide4.addText('• MENU TREE TRÊN SIDEBAR:\n  Cấu trúc phân cấp Lớp học -> Khóa học -> Buổi học -> Nhật ký khóa học.\n\n• CHỨC NĂNG LỊCH HỌC TRÊN APP:\n  Thay thế toàn bộ chương trình đào tạo thành Lịch học tương tác.\n\n• ĐIỂM DANH MÃ QR REALTIME:\n  Học viên quét mã QR buổi học trên App, đẩy ngay số lượng điểm danh về CRM.', {
    x: 9.3, y: 2.3, w: 3.0, h: 4.0, fontSize: 11, color: '334155', lineSpacing: 16
  });

  // SLIDE 5: 4. CHỨC NĂNG MINH BẠCH TÀI CHÍNH & QUỸ HỘI 2.1 TỶ VNĐ
  let slide5 = pptx.addSlide();
  slide5.background = { color: LIGHT_BG };
  slide5.addText('4. PHÂN HỆ TÀI CHÍNH: MINH BẠCH THU CHI & QUẢN LÝ QUỸ HỘI 2.1 TỶ VNĐ', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 20, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide5.addText('Theo dõi Khoản Thu, Khoản Chi, Quỹ tiền mặt/hiện vật/thiện nguyện & Xuất báo cáo Word / Excel / PDF', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 12, fontFace: 'Arial', color: '64748B'
  });
  const incomeImg = path.join(assetsDir, 'crm_income.jpg');
  const expensesImg = path.join(assetsDir, 'crm_expenses.jpg');
  if (fs.existsSync(incomeImg) && fs.existsSync(expensesImg)) {
    slide5.addImage({ path: incomeImg, x: 0.8, y: 1.7, w: 5.7, h: 4.8 });
    slide5.addImage({ path: expensesImg, x: 6.8, y: 1.7, w: 5.7, h: 4.8 });
  }

  // SLIDE 6: TỔNG KẾT & CAM KẾT BÀN GIAO VẬN HÀNH
  let slide6 = pptx.addSlide();
  slide6.background = { color: PRIMARY };
  slide6.addText('TỔNG KẾT & CAM KẾT BÀN GIAO VẬN HÀNH CHÍNH THỨC', {
    x: 0.8, y: 0.8, w: 11.5, h: 0.5,
    fontSize: 24, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide6.addText('Hệ sinh thái phần mềm đã kiểm định toàn diện, sẵn sàng phục vụ Ban Cán Sự Lớp CEO HN10', {
    x: 0.8, y: 1.4, w: 11.5, h: 0.4,
    fontSize: 14, fontFace: 'Arial', color: GOLD
  });
  slide6.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.2, w: 11.7, h: 3.8, fill: { color: SECONDARY }, line: { color: '38BDF8', width: 1.5 } });
  slide6.addText('CAM KẾT VẬN HÀNH & BẢO HÀNH CHUYÊN NGHIỆP', { x: 1.2, y: 2.5, w: 10.9, h: 0.4, fontSize: 18, bold: true, color: WHITE });
  slide6.addText('1. Dữ liệu chuẩn xác 100% lưu trữ tại máy chủ CSDL PostgreSQL: 113.20.107.184:6432 (PgBouncer).\n2. Hoàn thiện chuẩn 4 trụ cột nghiệp vụ: Tổng quan Điều hành, Quản lý Sự kiện, Quản lý Lớp học & Điểm danh QR, Minh bạch Tài chính.\n3. Chuẩn hóa phân quyền vai trò Ban Cán Sự: Lớp trưởng, Lớp phó, Ban Thiện nguyện và 7 Ban chuyên trách.\n4. CI/CD tự động kiểm tra code (0 errors) và build an toàn khi merge Git dev -> main.', {
    x: 1.2, y: 3.2, w: 10.9, h: 2.4, fontSize: 14, color: 'E2E8F0', lineSpacing: 24
  });

  await pptx.writeFile({ fileName: pptxPath });
  const stats = fs.statSync(pptxPath);
  console.log(`✅ Xuất thành công Slide PPTX CEO HN10: ${pptxPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

generatePptx().catch(console.error);
