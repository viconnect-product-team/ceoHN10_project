const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const assetsDir = path.join(rootDir, 'assets');
const evidenceDir = path.join(rootDir, 'test_evidence');

const pptxPath = path.join(docDir, 'SLIDE_TRINH_BAY_PHAN_MEM_CEO1983.pptx');
const htmlSlidePath = path.join(docDir, 'SLIDE_TRINH_BAY_PHAN_MEM_CEO1983.html');
const pdfSlidePath = path.join(docDir, 'SLIDE_TRINH_BAY_PHAN_MEM_CEO1983.pdf');

// 1. TẠO FILE POWERPOINT .PPTX
async function generatePptx() {
  console.log('Generating PowerPoint (.pptx)...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Định nghĩa màu sắc thương hiệu
  const PRIMARY = '0B192C'; // Navy đậm
  const SECONDARY = '1E3E62'; // Blue slate
  const ACCENT = 'E63946'; // Đỏ thương hiệu HanoiBA
  const GOLD = 'F4A261'; // Vàng cam ấm
  const LIGHT_BG = 'F8FAFC'; // Xám nhạt
  const WHITE = 'FFFFFF';

  // SLIDE 1: BÌA
  let slide1 = pptx.addSlide();
  slide1.background = { color: PRIMARY };
  slide1.addText('HIỆP HỘI DOANH NGHIỆP TRẺ HÀ NỘI (HANOIBA)', {
    x: 0.8, y: 0.8, w: 8.5, h: 0.4,
    fontSize: 14, fontFace: 'Arial', color: GOLD, bold: true, letterSpacing: 1
  });
  slide1.addText('CÂU LẠC BỘ DOANH NHÂN CEO HN10', {
    x: 0.8, y: 1.3, w: 8.5, h: 0.5,
    fontSize: 18, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide1.addText('HỆ THỐNG QUẢN TRỊ & KẾT NỐI DOANH NHÂN\nNỀN TẢNG CÔNG NGHỆ CEO1983', {
    x: 0.8, y: 2.3, w: 11.5, h: 1.8,
    fontSize: 32, fontFace: 'Arial', color: WHITE, bold: true, lineSpacing: 38
  });
  slide1.addText('Giải pháp chuyển đổi số toàn diện: Web CRM Quản trị & Ứng dụng Di động Hội viên\nĐồng bộ dữ liệu thời gian thực - Minh bạch tài chính - Tối ưu hóa vận hành 7 Ban Chuyên Môn', {
    x: 0.8, y: 4.4, w: 11.5, h: 0.8,
    fontSize: 14, fontFace: 'Arial', color: 'CBD5E1'
  });
  slide1.addText('Môi trường: Server Dev (https://14.225.217.232:10443) | CSDL Chuẩn: 113.20.107.184:6432\nNgày phát hành: 17/11/2026 | Phiên bản: v5.1 Official Release', {
    x: 0.8, y: 6.2, w: 11.5, h: 0.6,
    fontSize: 11, fontFace: 'Arial', color: '94A3B8'
  });

  // SLIDE 2: BỐI CẢNH & TẦM NHÌN
  let slide2 = pptx.addSlide();
  slide2.background = { color: LIGHT_BG };
  slide2.addText('BỐI CẢNH & TẦM NHÌN CHUYỂN ĐỔI SỐ', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide2.addText('Kiến tạo nền tảng công nghệ phục vụ cộng đồng doanh nhân trẻ Thủ đô', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });

  // 3 Thẻ Box
  const colW = 3.6;
  const colY = 1.8;
  const colH = 4.6;

  slide2.addShape(pptx.ShapeType.rect, { x: 0.8, y: colY, w: colW, h: colH, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
  slide2.addText('1. Thách thức Quản trị', { x: 1.0, y: colY + 0.3, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: ACCENT });
  slide2.addText('• Quy mô hội viên tăng nhanh, hoạt động đa dạng nhiều lĩnh vực.\n• Thông tin rời rạc qua mạng xã hội, khó tra cứu tài liệu quy chế.\n• Quản trị thu chi, hội phí, tài trợ cần minh bạch số hóa tuyệt đối.\n• Giao việc và theo dõi tiến độ sự kiện giữa các ban còn thủ công.', {
    x: 1.0, y: colY + 0.8, w: 3.2, h: 3.4, fontSize: 12, color: '334155', lineSpacing: 18
  });

  slide2.addShape(pptx.ShapeType.rect, { x: 4.8, y: colY, w: colW, h: colH, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
  slide2.addText('2. Mục tiêu Giải pháp', { x: 5.0, y: colY + 0.3, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: PRIMARY });
  slide2.addText('• Số hóa 100% quy trình vận hành Ban Cán Sự Lớp & Team.\n• Xây dựng hệ thống phân quyền chuẩn xác theo 7 Ban Chuyên Môn.\n• Check-in QR thông minh cho mọi sự kiện, đào tạo, giao thương.\n• Báo cáo tài chính, dòng tiền và hóa đơn chứng từ thời gian thực.', {
    x: 5.0, y: colY + 0.8, w: 3.2, h: 3.4, fontSize: 12, color: '334155', lineSpacing: 18
  });

  slide2.addShape(pptx.ShapeType.rect, { x: 8.8, y: colY, w: colW, h: colH, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
  slide2.addText('3. Giá trị Mang lại', { x: 9.0, y: colY + 0.3, w: 3.2, h: 0.4, fontSize: 16, bold: true, color: '15803D' });
  slide2.addText('• Gắn kết chặt chẽ từng thành viên doanh nhân trong câu lạc bộ.\n• Tối ưu thời gian điều hành của Chủ tịch và Ban Điều Hành.\n• Tăng trưởng cơ hội hợp tác kinh doanh nội bộ B2B Connect.\n• Dữ liệu chuẩn mực, an toàn bảo mật trên CSDL PostgreSQL chuẩn.', {
    x: 9.0, y: colY + 0.8, w: 3.2, h: 3.4, fontSize: 12, color: '334155', lineSpacing: 18
  });

  // SLIDE 3: 7 BAN CHUYÊN MÔN (THEO ẢNH 1)
  let slide3 = pptx.addSlide();
  slide3.background = { color: PRIMARY };
  slide3.addText('CƠ CẤU TỔ CHỨC: 7 BAN CHUYÊN MÔN CEO HN10', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide3.addText('Mô hình chuẩn hóa hoạt động chuyên môn theo đúng sơ đồ định hướng (Ảnh 1)', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });

  // Header Box
  slide3.addShape(pptx.ShapeType.roundRect, { x: 4.2, y: 1.7, w: 4.8, h: 0.8, fill: { color: ACCENT }, line: { color: WHITE, width: 2 } });
  slide3.addText('CÁC BAN TRONG LỚP CEOHN10', { x: 4.2, y: 1.7, w: 4.8, h: 0.8, fontSize: 16, bold: true, color: WHITE, align: 'center', valign: 'middle' });

  // 4 Ban hàng trên
  const bansTop = [
    { name: 'Ban Học tập', desc: 'Đào tạo kỹ năng lãnh đạo, hội thảo chuyên đề quản trị vốn & kinh doanh' },
    { name: 'Ban Sự kiện & Hậu cần', desc: 'Tổ chức Gala, họp định kỳ, xúc tiến thương mại và hậu cần sự kiện' },
    { name: 'Ban Tài chính & Tài trợ', desc: 'Quản trị ngân sách, quỹ hội, thu chi hội phí và vận động tài trợ' },
    { name: 'Ban Truyền thông', desc: 'Xây dựng hình ảnh, kênh tin tức, PR thương hiệu CLB và hội viên' }
  ];
  bansTop.forEach((b, idx) => {
    const bx = 0.8 + idx * 2.95;
    slide3.addShape(pptx.ShapeType.roundRect, { x: bx, y: 2.9, w: 2.75, h: 1.5, fill: { color: SECONDARY }, line: { color: '38BDF8', width: 1.5 } });
    slide3.addText(b.name, { x: bx + 0.1, y: 3.0, w: 2.55, h: 0.4, fontSize: 13, bold: true, color: WHITE, align: 'center' });
    slide3.addText(b.desc, { x: bx + 0.1, y: 3.45, w: 2.55, h: 0.85, fontSize: 10, color: 'E2E8F0', align: 'center' });
  });

  // 3 Ban hàng dưới
  const bansBottom = [
    { name: 'Ban Công nghệ', desc: 'Phát triển & vận hành hệ thống Web CRM, App Mobile, chuyển đổi số' },
    { name: 'Ban Đối ngoại & Giao thương', desc: 'Mở rộng hợp tác liên minh hiệp hội, kết nối cơ hội kinh doanh B2B' },
    { name: 'Ban Đời sống & Gắn kết thành viên', desc: 'Chăm lo sinh nhật, hiếu hỉ, thể thao văn hóa và gắn bó hội viên' }
  ];
  bansBottom.forEach((b, idx) => {
    const bx = 1.8 + idx * 3.4;
    slide3.addShape(pptx.ShapeType.roundRect, { x: bx, y: 4.8, w: 3.1, h: 1.6, fill: { color: SECONDARY }, line: { color: '38BDF8', width: 1.5 } });
    slide3.addText(b.name, { x: bx + 0.1, y: 4.95, w: 2.9, h: 0.45, fontSize: 13, bold: true, color: WHITE, align: 'center' });
    slide3.addText(b.desc, { x: bx + 0.1, y: 5.45, w: 2.9, h: 0.85, fontSize: 10, color: 'E2E8F0', align: 'center' });
  });

  // SLIDE 4: SƠ ĐỒ BAN CÁN SỰ LỚP & TEAM (THEO ẢNH 2)
  let slide4 = pptx.addSlide();
  slide4.background = { color: LIGHT_BG };
  slide4.addText('SƠ ĐỒ TỔ CHỨC BAN CÁN SỰ LỚP & TEAM (ẢNH 2)', {
    x: 0.8, y: 0.5, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide4.addText('Đồng bộ cơ cấu chức danh và phân quyền quản trị trong hệ thống Web CRM', {
    x: 0.8, y: 1.0, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });

  // Cột trái: SƠ ĐỒ BCS LỚP
  slide4.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.6, w: 5.6, h: 5.1, fill: { color: WHITE }, line: { color: 'CBD5E1', width: 1 } });
  slide4.addText('1. Sơ đồ tổ chức BCS Lớp', { x: 1.0, y: 1.8, w: 5.2, h: 0.35, fontSize: 15, bold: true, color: ACCENT });
  
  slide4.addShape(pptx.ShapeType.roundRect, { x: 2.3, y: 2.3, w: 2.6, h: 0.6, fill: { color: ACCENT } });
  slide4.addText('Lớp Trưởng Lâm thời', { x: 2.3, y: 2.3, w: 2.6, h: 0.6, fontSize: 12, bold: true, color: WHITE, align: 'center', valign: 'middle' });

  const bcsLopItems = [
    'Lớp Phó Học Tập Lâm Thời',
    'Lớp Phó Sự Kiện & Hậu Cần Lâm Thời',
    'Lớp Phó Tài Chính Tài Trợ Lâm Thời',
    'Lớp Phó Truyền Thông Lâm Thời',
    'Lớp Phó Công Nghệ Lâm Thời',
    'Lớp Phó Đối Ngoại & Giao Thương Lâm Thời',
    'Lớp Phó Đời Sống & Gắn Kết TV Lâm Thời'
  ];
  bcsLopItems.forEach((title, i) => {
    const py = 3.1 + i * 0.48;
    slide4.addShape(pptx.ShapeType.roundRect, { x: 1.1, y: py, w: 5.0, h: 0.4, fill: { color: 'EFF6FF' }, line: { color: '93C5FD', width: 1 } });
    slide4.addText(title, { x: 1.2, y: py, w: 4.8, h: 0.4, fontSize: 10.5, bold: true, color: PRIMARY, align: 'center', valign: 'middle' });
  });

  // Cột phải: SƠ ĐỒ BCS TEAM
  slide4.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.6, w: 5.6, h: 5.1, fill: { color: WHITE }, line: { color: 'CBD5E1', width: 1 } });
  slide4.addText('2. Sơ đồ tổ chức BCS Team', { x: 7.0, y: 1.8, w: 5.2, h: 0.35, fontSize: 15, bold: true, color: PRIMARY });

  slide4.addShape(pptx.ShapeType.roundRect, { x: 7.2, y: 2.3, w: 2.2, h: 0.6, fill: { color: ACCENT } });
  slide4.addText('Trưởng Team LT', { x: 7.2, y: 2.3, w: 2.2, h: 0.6, fontSize: 11, bold: true, color: WHITE, align: 'center', valign: 'middle' });

  slide4.addShape(pptx.ShapeType.roundRect, { x: 9.8, y: 2.3, w: 2.2, h: 0.6, fill: { color: ACCENT } });
  slide4.addText('2 Phó Team LT', { x: 9.8, y: 2.3, w: 2.2, h: 0.6, fontSize: 11, bold: true, color: WHITE, align: 'center', valign: 'middle' });

  const bcsTeamItems = [
    '3 Phó Team Tập sự',
    'Trưởng Ban Học Tập Tập sự',
    'Trưởng Ban Sự Kiện & Hậu Cần Tập sự',
    'Trưởng Ban Tài Chính Tài Trợ Tập sự',
    'Trưởng Ban Truyền Thông Tập sự',
    'Trưởng Ban Công Nghệ Tập sự',
    'Trưởng Ban Đối Ngoại & Đời Sống Tập sự'
  ];
  bcsTeamItems.forEach((title, i) => {
    const py = 3.1 + i * 0.48;
    slide4.addShape(pptx.ShapeType.roundRect, { x: 7.1, y: py, w: 5.0, h: 0.4, fill: { color: 'F1F5F9' }, line: { color: 'CBD5E1', width: 1 } });
    slide4.addText(title, { x: 7.2, y: py, w: 4.8, h: 0.4, fontSize: 10.5, bold: true, color: '334155', align: 'center', valign: 'middle' });
  });

  // SLIDE 5: KIẾN TRÚC PHÂN HỆ KÉP (CRM & MOBILE APP)
  let slide5 = pptx.addSlide();
  slide5.background = { color: LIGHT_BG };
  slide5.addText('KIẾN TRÚC HỆ THỐNG PHÂN HỆ KÉP (CRM & MOBILE APP)', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide5.addText('Kết nối liền mạch giữa Quản trị viên và Hội viên doanh nhân trên một nguồn dữ liệu duy nhất', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });

  // Box 1: Web CRM
  slide5.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: WHITE }, line: { color: 'CBD5E1', width: 1 } });
  slide5.addText('CỔNG QUẢN TRỊ WEB CRM', { x: 1.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 16, bold: true, color: PRIMARY });
  slide5.addText('Dành cho: Lớp Trưởng, Lớp Phó, Ban Cán Sự, Kế toán, Admin', { x: 1.1, y: 2.45, w: 5.0, h: 0.3, fontSize: 11, color: ACCENT, bold: true });
  slide5.addText('• Quản lý 7 Ban Chuyên Môn & Ma trận phân quyền RBAC chi tiết.\n• Tổ chức sự kiện, cấu hình vé, điểm danh Check-in QR tự động.\n• Quản trị buổi học đào tạo, phát hành giáo trình & link học Hybrid.\n• Quản trị dòng tiền thực tế, phiếu thu, hóa đơn điện tử chuẩn chỉnh.\n• Bàn giao việc, phân loại thẻ công việc trên bảng Kanban trực quan.\n• Báo cáo tổng thể KPI, tăng trưởng và phân tích hoạt động hội viên.', {
    x: 1.1, y: 2.85, w: 5.0, h: 3.5, fontSize: 12, color: '334155', lineSpacing: 20
  });

  // Box 2: Mobile App
  slide5.addShape(pptx.ShapeType.rect, { x: 6.8, y: 1.8, w: 5.6, h: 4.8, fill: { color: WHITE }, line: { color: 'CBD5E1', width: 1 } });
  slide5.addText('CEO HN10 MOBILE APP', { x: 7.1, y: 2.0, w: 5.0, h: 0.4, fontSize: 16, bold: true, color: ACCENT });
  slide5.addText('Dành cho: Toàn thể Hội viên Doanh nhân HanoiBA', { x: 7.1, y: 2.45, w: 5.0, h: 0.3, fontSize: 11, color: PRIMARY, bold: true });
  slide5.addText('• Thẻ Hội viên số tích hợp mã QR định danh đa năng.\n• Đăng ký tham gia sự kiện và check-in 1 chạm tại cửa hội trường.\n• Tham gia các buổi học chuyên đề, tải tài liệu & quy chế trực tiếp.\n• Kết nối giao thương B2B Connect, tra cứu hồ sơ doanh nghiệp thành viên.\n• Nhận thông báo tức thời (Push Notification) từ Ban Cán Sự Lớp.\n• Góp ý, phản ánh nguyện vọng trực tiếp đến ban điều hành.', {
    x: 7.1, y: 2.85, w: 5.0, h: 3.5, fontSize: 12, color: '334155', lineSpacing: 20
  });

  // SLIDE 6: CÁC LUỒNG CHỨC NĂNG CỐT LÕI
  let slide6 = pptx.addSlide();
  slide6.background = { color: LIGHT_BG };
  slide6.addText('CÁC LUỒNG CHỨC NĂNG NGHIỆP VỤ CỐT LÕI', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide6.addText('Trải nghiệm tự động hóa toàn diện từ khởi tạo đến đối soát dữ liệu', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });

  const modules = [
    { title: 'Sự kiện & Check-in QR', desc: 'Khởi tạo Gala, Họp định kỳ; cấp mã QR cá nhân hóa; điểm danh tự động 100% không tắc nghẽn.' },
    { title: 'Đào tạo & Buổi học', desc: 'Chuyên đề quản trị vốn doanh nghiệp; kết nối phòng học trực tuyến Hybrid Google Meet/Zoom.' },
    { title: 'Giao việc & Kanban', desc: 'Phân quyền nhiệm vụ cho 7 ban; theo dõi tiến độ thời gian thực với bảng phân cấp và Kanban.' },
    { title: 'Tài chính & Hóa đơn', desc: 'Biến động số dư dòng tiền thực tế; xuất hóa đơn / phiếu thu chuẩn pháp lý kèm mã QR đối soát.' },
    { title: 'Thư viện Tài liệu Số', desc: 'Kho lưu trữ quy chế Ban Cán Sự, văn bản hiệp hội phân quyền theo từng cấp độ bảo mật.' },
    { title: 'Ý kiến & Thông báo', desc: 'Kênh tiếp nhận phản ánh 2 chiều; hệ thống thông báo đẩy tự động đến từng tài khoản hội viên.' }
  ];

  modules.forEach((m, idx) => {
    const rx = 0.8 + (idx % 3) * 3.9;
    const ry = 1.8 + Math.floor(idx / 3) * 2.5;
    slide6.addShape(pptx.ShapeType.rect, { x: rx, y: ry, w: 3.7, h: 2.2, fill: { color: WHITE }, line: { color: 'E2E8F0', width: 1 } });
    slide6.addText(`0${idx + 1}. ${m.title}`, { x: rx + 0.2, y: ry + 0.2, w: 3.3, h: 0.4, fontSize: 14, bold: true, color: PRIMARY });
    slide6.addText(m.desc, { x: rx + 0.2, y: ry + 0.7, w: 3.3, h: 1.3, fontSize: 11, color: '475569', lineSpacing: 16 });
  });

  // SLIDE 7: KẾT QUẢ KIỂM THỬ THỰC TẾ & BẢO ĐẢM CSDL
  let slide7 = pptx.addSlide();
  slide7.background = { color: PRIMARY };
  slide7.addText('KẾT QUẢ KIỂM THỬ THỰC TẾ & ĐỒNG BỘ CSDL', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide7.addText('Minh chứng xác thực 100% dữ liệu đi từ giao diện người dùng vào Cơ sở dữ liệu chuẩn', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });

  // 4 Số liệu ấn tượng
  const kpis = [
    { num: '13/13', label: 'Luồng nghiệp vụ ĐẠT 100%' },
    { num: '30', label: 'Ảnh chụp minh chứng sắc nét' },
    { num: '+25.000.000 đ', label: 'Dòng tiền thực tế cập nhật' },
    { num: '113.20.107.184', label: 'Máy chủ CSDL PostgreSQL' }
  ];
  kpis.forEach((k, idx) => {
    const kx = 0.8 + idx * 2.95;
    slide7.addShape(pptx.ShapeType.roundRect, { x: kx, y: 1.8, w: 2.75, h: 1.4, fill: { color: SECONDARY }, line: { color: '38BDF8', width: 1.5 } });
    slide7.addText(k.num, { x: kx + 0.1, y: 2.0, w: 2.55, h: 0.5, fontSize: 18, bold: true, color: GOLD, align: 'center' });
    slide7.addText(k.label, { x: kx + 0.1, y: 2.5, w: 2.55, h: 0.5, fontSize: 11, color: WHITE, align: 'center' });
  });

  // Bảng đối chiếu CSDL
  slide7.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.5, w: 11.6, h: 3.2, fill: { color: WHITE } });
  slide7.addText('BẢNG ĐỐI SOÁT DỮ LIỆU TỪ GIAO DIỆN VÀO CSDL POSTGRESQL CHUẨN', {
    x: 1.1, y: 3.7, w: 11.0, h: 0.35, fontSize: 13, bold: true, color: PRIMARY
  });
  const dbRows = [
    '• Sự kiện Gala 2026: Ghi nhận đồng thời vào bảng events và ceohn10_events (200 chỗ, ID valid UUID).',
    '• Đào tạo Tài chính & Vốn: Ghi nhận vào bảng trainings kèm link Google Meet phòng học trực tuyến.',
    '• Ý kiến đóng góp: Hội viên Vũ Phan Vũ gửi phản ánh ghi nhận tức thì vào bảng event_feedbacks.',
    '• Thư viện tài liệu: Thư mục & File PDF quy chế lưu trữ phân quyền an toàn trong bảng documents.',
    '• Phân công công việc: Nhiệm vụ Ban Sự kiện tiến độ 65% ưu tiên CRITICAL lưu vào bảng tasks.',
    '• Dòng tiền thực tế: Giao dịch thu hội phí HP-HN10-099 (+25.000.000 đ) cập nhật vào ceohn10_transactions.'
  ];
  dbRows.forEach((row, rIdx) => {
    slide7.addText(row, { x: 1.1, y: 4.1 + rIdx * 0.4, w: 11.0, h: 0.35, fontSize: 11, color: '334155' });
  });

  // SLIDE 8: LỜI KẾT & CAM KẾT
  let slide8 = pptx.addSlide();
  slide8.background = { color: PRIMARY };
  slide8.addText('KẾT NỐI TINH HOA - VƯƠN TẦM CAO MỚI', {
    x: 0.8, y: 2.2, w: 11.5, h: 0.8,
    fontSize: 32, fontFace: 'Arial', color: GOLD, bold: true, align: 'center'
  });
  slide8.addText('HỆ SINH THÁI CHUYỂN ĐỔI SỐ CEO HN10 - NỀN TẢNG CÔNG NGHỆ CEO1983', {
    x: 0.8, y: 3.1, w: 11.5, h: 0.5,
    fontSize: 16, fontFace: 'Arial', color: WHITE, bold: true, align: 'center'
  });
  slide8.addText('Sẵn sàng đồng hành cùng Ban Điều Hành & Toàn thể Hội viên trên chặng đường phát triển bứt phá!', {
    x: 0.8, y: 3.8, w: 11.5, h: 0.5,
    fontSize: 14, fontFace: 'Arial', color: 'CBD5E1', align: 'center'
  });
  slide8.addText('Trân trọng cảm ơn Ban Lãnh Đạo Hiệp Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA)!', {
    x: 0.8, y: 5.2, w: 11.5, h: 0.5,
    fontSize: 13, fontFace: 'Arial', color: GOLD, italic: true, align: 'center'
  });

  await pptx.writeFile({ fileName: pptxPath });
  console.log(`✅ Xuất thành công PowerPoint: ${pptxPath}`);
}

// 2. TẠO SLIDE DECK HTML & RENDER SANG PDF
async function generateSlidePdf() {
  console.log('Generating Slide Deck HTML & PDF...');
  
  // Base64 các ảnh cần thiết
  const imgBan1 = fs.existsSync(path.join(rootDir, 'test_evidence', '05_departments_7_bans_configured.png'))
    ? `data:image/png;base64,${fs.readFileSync(path.join(rootDir, 'test_evidence', '05_departments_7_bans_configured.png')).toString('base64')}`
    : '';
  const imgMatrix = fs.existsSync(path.join(rootDir, 'test_evidence', '06_permissions_matrix.png'))
    ? `data:image/png;base64,${fs.readFileSync(path.join(rootDir, 'test_evidence', '06_permissions_matrix.png')).toString('base64')}`
    : '';
  const imgFinance = fs.existsSync(path.join(rootDir, 'test_evidence', '21_finance_cashflow_updated.png'))
    ? `data:image/png;base64,${fs.readFileSync(path.join(rootDir, 'test_evidence', '21_finance_cashflow_updated.png')).toString('base64')}`
    : '';

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BỘ SLIDE TRÌNH BÀY PHẦN MỀM CEO1983 - CEO HN10 (HANOIBA)</title>
  <style>
    @page {
      size: 297mm 210mm; /* A4 Landscape 16:9 ratio style */
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: #0b192c;
      color: #1e293b;
    }
    .slide {
      width: 297mm;
      height: 210mm;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16mm 20mm;
    }
    .slide-dark {
      background: linear-gradient(135deg, #0b192c 0%, #1e3e62 100%);
      color: #ffffff;
    }
    .slide-light {
      background: #f8fafc;
      color: #0f172a;
    }
    
    .slide-header {
      border-bottom: 2px solid rgba(255,255,255,0.15);
      padding-bottom: 8px;
    }
    .slide-light .slide-header {
      border-bottom: 2px solid #e2e8f0;
    }
    .org-tag {
      font-size: 13px;
      font-weight: 700;
      color: #f4a261;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .slide-title {
      font-size: 26px;
      font-weight: 800;
      margin: 4px 0 0 0;
      color: #ffffff;
    }
    .slide-light .slide-title {
      color: #0b192c;
    }
    .slide-sub {
      font-size: 14px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .slide-light .slide-sub {
      color: #64748b;
    }

    .slide-body {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 12px 0;
    }

    .slide-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 8px;
      font-size: 11px;
      color: #94a3b8;
    }
    .slide-light .slide-footer {
      border-top: 1px solid #e2e8f0;
      color: #64748b;
    }

    /* SLIDE 1 COVER */
    .cover-content {
      text-align: left;
      margin-top: 40px;
    }
    .cover-content h1 {
      font-size: 38px;
      line-height: 1.25;
      font-weight: 800;
      color: #ffffff;
      margin: 15px 0;
    }
    .cover-content h1 span {
      color: #f4a261;
    }
    .cover-desc {
      font-size: 16px;
      color: #cbd5e1;
      max-width: 800px;
      line-height: 1.6;
    }
    .cover-badges {
      display: flex;
      gap: 15px;
      margin-top: 30px;
    }
    .badge-item {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 12px;
      color: #ffffff;
    }

    /* GRIDS */
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .card h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #0b192c;
      border-bottom: 2px solid #e63946;
      padding-bottom: 6px;
    }
    .card ul {
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      color: #334155;
      line-height: 1.7;
    }

    /* 7 BANS SCHEME */
    .ban-header-box {
      background: #e63946;
      color: #ffffff;
      font-weight: 700;
      font-size: 16px;
      text-align: center;
      padding: 10px;
      border-radius: 6px;
      width: 320px;
      margin: 0 auto 20px auto;
      border: 2px solid #ffffff;
    }
    .bans-row-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 12px;
    }
    .bans-row-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      max-width: 85%;
      margin: 0 auto;
    }
    .ban-card {
      background: #1e3e62;
      border: 1.5px solid #38bdf8;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      color: #ffffff;
    }
    .ban-card h4 {
      margin: 0 0 6px 0;
      font-size: 14px;
      color: #38bdf8;
    }
    .ban-card p {
      margin: 0;
      font-size: 11px;
      color: #e2e8f0;
      line-height: 1.4;
    }

    /* ORG TREE */
    .tree-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 600;
      text-align: center;
    }
    .tree-lead {
      background: #e63946;
      color: #ffffff;
      font-size: 13px;
      margin-bottom: 12px;
    }
    .tree-sub {
      background: #eff6ff;
      color: #1e3a8a;
      border-color: #93c5fd;
    }

    /* KPI STATS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #1e3e62;
      border: 1.5px solid #38bdf8;
      border-radius: 8px;
      padding: 14px;
      text-align: center;
    }
    .kpi-card .num {
      font-size: 26px;
      font-weight: 800;
      color: #f4a261;
    }
    .kpi-card .lbl {
      font-size: 12px;
      color: #ffffff;
      margin-top: 4px;
    }
  </style>
</head>
<body>

  <!-- SLIDE 1: BÌA -->
  <div class="slide slide-dark">
    <div class="slide-header">
      <div class="org-tag">HIỆP HỘI DOANH NGHIỆP TRẺ HÀ NỘI (HANOIBA)</div>
      <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 3px;">CÂU LẠC BỘ DOANH NHÂN CEO HN10</div>
    </div>
    <div class="slide-body">
      <div class="cover-content">
        <h1>HỆ THỐNG QUẢN TRỊ & KẾT NỐI DOANH NHÂN<br>NỀN TẢNG CÔNG NGHỆ <span>CEO1983</span></h1>
        <div class="cover-desc">
          Giải pháp chuyển đổi số toàn diện kết hợp Cổng Quản trị Web CRM và Ứng dụng Di động Hội viên.<br>
          Chuẩn hóa 7 Ban Chuyên Môn • Minh bạch Tài chính Dòng tiền • Điểm danh QR Check-in • Đồng bộ CSDL Chuẩn PostgreSQL 113.20.107.184:6432.
        </div>
        <div class="cover-badges">
          <div class="badge-item">📍 Server Dev: https://14.225.217.232:10443</div>
          <div class="badge-item">⚡ 100% Pass 13 Luồng Kiểm thử Nghiệm thu</div>
          <div class="badge-item">🛡️ RBAC Chuẩn Hóa Lớp Trưởng & Lớp Phó</div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>Phiên bản v5.1 - Official Presentation Deck</span>
      <span>Hà Nội, Ngày 17/11/2026</span>
    </div>
  </div>

  <!-- SLIDE 2: BỐI CẢNH & TẦM NHÌN -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="org-tag">TỔNG QUAN CHIẾN LƯỢC</div>
      <div class="slide-title">BỐI CẢNH VÀ TẦM NHÌN CHUYỂN ĐỔI SỐ</div>
      <div class="slide-sub">Nâng tầm quản trị hiệp hội doanh nghiệp thời đại số hóa</div>
    </div>
    <div class="slide-body">
      <div class="grid-3">
        <div class="card">
          <h3 style="color: #e63946;">1. Thách thức Thực tế</h3>
          <ul>
            <li>Quy mô hội viên liên tục mở rộng, nhu cầu trao đổi và giao thương nội bộ B2B rất lớn.</li>
            <li>Phương thức điều hành qua nhóm chat mạng xã hội bị trôi tin, thất lạc tài liệu, khó phân công.</li>
            <li>Công tác thu chi hội phí, tài trợ sự kiện cần báo cáo minh bạch dòng tiền thời gian thực.</li>
            <li>Thiếu công cụ đo lường KPI hoạt động của từng ban và mức độ tương tác của hội viên.</li>
          </ul>
        </div>
        <div class="card">
          <h3 style="color: #0b192c;">2. Giải pháp Công nghệ</h3>
          <ul>
            <li>Xây dựng nền tảng chuyên biệt cho CEO HN10: Web CRM cho Quản trị & Mobile App cho Hội viên.</li>
            <li>Chuẩn hóa cơ cấu 7 Ban Chuyên Môn và vai trò Lớp Trưởng, Lớp Phó, Trưởng/Phó Team.</li>
            <li>Tự động hóa toàn trình: Check-in QR sự kiện, đăng ký buổi học, xuất hóa đơn chứng từ.</li>
            <li>Hạ tầng CSDL tập trung chuẩn mực PostgreSQL bảo mật cao, kiểm soát chặt chẽ quyền truy cập.</li>
          </ul>
        </div>
        <div class="card">
          <h3 style="color: #15803d;">3. Giá trị Mang lại</h3>
          <ul>
            <li><strong>Chủ tịch & BCS:</strong> Nắm bắt toàn bộ sức khỏe câu lạc bộ chỉ qua một màn hình Dashboard.</li>
            <li><strong>Ban Tài Chính:</strong> Quản lý quỹ hội tức thời, đối soát chứng từ hóa đơn điện tử chính xác.</li>
            <li><strong>Hội viên:</strong> Thẻ định danh số, không bỏ lỡ sự kiện, kết nối đối tác B2B trong tầm tay.</li>
            <li><strong>Hiệp hội HanoiBA:</strong> Hình mẫu chuyển đổi số tiêu biểu cho các câu lạc bộ trực thuộc.</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>CEO HN10 (HanoiBA) - Chuyển đổi số toàn diện</span>
      <span>Trang 2 / 8</span>
    </div>
  </div>

  <!-- SLIDE 3: 7 BAN CHUYÊN MÔN (ẢNH 1) -->
  <div class="slide slide-dark">
    <div class="slide-header">
      <div class="org-tag">CƠ CẤU TỔ CHỨC ĐẶC THÙ</div>
      <div class="slide-title">CHUẨN HÓA 7 BAN CHUYÊN MÔN CEO HN10 (THEO ẢNH 1)</div>
      <div class="slide-sub">Cơ cấu tổ chức chức năng được cấu hình và vận hành đồng bộ trên phần mềm</div>
    </div>
    <div class="slide-body">
      <div class="ban-header-box">CÁC BAN TRONG LỚP CEOHN10</div>
      
      <div class="bans-row-4">
        <div class="ban-card">
          <h4>Ban Học tập</h4>
          <p>Tổ chức các buổi đào tạo chuyên đề, nâng cao kỹ trị tài chính, quản trị chiến lược vốn cho lãnh đạo doanh nghiệp.</p>
        </div>
        <div class="ban-card">
          <h4>Ban Sự kiện & Hậu cần</h4>
          <p>Lập kế hoạch và triển khai Gala, họp định kỳ, chương trình xúc tiến thương mại, điều phối hậu cần check-in.</p>
        </div>
        <div class="ban-card">
          <h4>Ban Tài chính & Tài trợ</h4>
          <p>Quản lý thu chi quỹ hội, theo dõi dòng tiền thực tế, vận động tài trợ và xuất hóa đơn chứng từ tài chính.</p>
        </div>
        <div class="ban-card">
          <h4>Ban Truyền thông</h4>
          <p>Phát triển thương hiệu CLB, quản trị bản tin, phát hành thông báo và truyền thông hình ảnh hội viên.</p>
        </div>
      </div>

      <div class="bans-row-3">
        <div class="ban-card">
          <h4>Ban Công nghệ</h4>
          <p>Phát triển, bảo trì và chuyển giao nền tảng Web CRM, Mobile App và hạ tầng CSDL PostgreSQL cho hiệp hội.</p>
        </div>
        <div class="ban-card">
          <h4>Ban Đối ngoại & Giao thương</h4>
          <p>Kết nối giao thương B2B, mở rộng mạng lưới với các tổ chức kinh tế, đối tác chiến lược trong và ngoài nước.</p>
        </div>
        <div class="ban-card">
          <h4>Ban Đời sống & Gắn kết TV</h4>
          <p>Chăm lo đời sống tinh thần, thăm hỏi hiếu hỉ, sinh nhật, giải đấu thể thao và duy trì sự gắn kết nội bộ.</p>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>Chuẩn hóa danh mục 7 Ban trên hệ thống CRM & CSDL</span>
      <span>Trang 3 / 8</span>
    </div>
  </div>

  <!-- SLIDE 4: SƠ ĐỒ BCS LỚP & TEAM (ẢNH 2) -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="org-tag">PHÂN BỔ TRÁCH NHIỆM & PHÂN QUYỀN</div>
      <div class="slide-title">SƠ ĐỒ TỔ CHỨC BAN CÁN SỰ LỚP & BAN CÁN SỰ TEAM (THEO ẢNH 2)</div>
      <div class="slide-sub">Mô hình phân cấp quản trị đã được thiết lập ma trận quyền RBAC hoàn chỉnh trên phần mềm</div>
    </div>
    <div class="slide-body">
      <div class="grid-2">
        <div class="card">
          <h3 style="color: #e63946;">Sơ đồ tổ chức BCS Lớp</h3>
          <div class="tree-box tree-lead">Lớp Trưởng Lâm thời</div>
          <div class="tree-box tree-sub">Lớp Phó Học Tập Lâm Thời</div>
          <div class="tree-box tree-sub">Lớp Phó Sự Kiện & Hậu Cần Lâm Thời</div>
          <div class="tree-box tree-sub">Lớp Phó Tài Chính Tài Trợ Lâm Thời</div>
          <div class="tree-box tree-sub">Lớp Phó Truyền Thông Lâm Thời</div>
          <div class="tree-box tree-sub">Lớp Phó Công Nghệ Lâm Thời</div>
          <div class="tree-box tree-sub">Lớp Phó Đối Ngoại & Giao Thương Lâm Thời</div>
          <div class="tree-box tree-sub">Lớp Phó Đời Sống & Gắn Kết TV Lâm Thời</div>
        </div>

        <div class="card">
          <h3 style="color: #0b192c;">Sơ đồ tổ chức BCS Team</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
            <div class="tree-box tree-lead" style="margin-bottom: 0;">Trưởng Team LT</div>
            <div class="tree-box tree-lead" style="margin-bottom: 0;">2 Phó Team LT</div>
          </div>
          <div class="tree-box" style="background: #f1f5f9; color: #334155;">3 Phó Team Tập sự</div>
          <div class="tree-box" style="background: #f1f5f9; color: #334155;">Trưởng Ban Học Tập Tập sự</div>
          <div class="tree-box" style="background: #f1f5f9; color: #334155;">Trưởng Ban Sự Kiện & Hậu Cần Tập sự</div>
          <div class="tree-box" style="background: #f1f5f9; color: #334155;">Trưởng Ban Tài Chính Tài Trợ Tập sự</div>
          <div class="tree-box" style="background: #f1f5f9; color: #334155;">Trưởng Ban Truyền Thông Tập sự</div>
          <div class="tree-box" style="background: #f1f5f9; color: #334155;">Trưởng Ban Công Nghệ Tập sự</div>
          <div class="tree-box" style="background: #f1f5f9; color: #334155;">Trưởng Ban Đối Ngoại & Đời Sống Tập sự</div>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>Thiết lập ma trận phân quyền RBAC đa cấp độ theo từng vai trò</span>
      <span>Trang 4 / 8</span>
    </div>
  </div>

  <!-- SLIDE 5: HỆ SINH THÁI KÉP -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="org-tag">KIẾN TRÚC GIẢI PHÁP</div>
      <div class="slide-title">HỆ SINH THÁI CÔNG NGHỆ KÉP: WEB CRM & MOBILE APP</div>
      <div class="slide-sub">Tối ưu trải nghiệm cho từng đối tượng sử dụng trên cùng một nền tảng dữ liệu tập trung</div>
    </div>
    <div class="slide-body">
      <div class="grid-2">
        <div class="card" style="border-top: 4px solid #0b192c;">
          <h3>CỔNG QUẢN TRỊ WEB CRM (DESKTOP)</h3>
          <p style="font-size: 12px; color: #e63946; font-weight: 700; margin: 4px 0 10px 0;">URL: https://14.225.217.232:10443 (Server Dev)</p>
          <ul>
            <li><strong>Phân quyền quản trị:</strong> Cấu hình 7 ban chuyên môn, chức vụ Lớp Trưởng, Lớp Phó.</li>
            <li><strong>Điều phối Sự kiện & Đào tạo:</strong> Tạo sự kiện, phát hành vé, tích hợp QR Check-in và link phòng học trực tuyến.</li>
            <li><strong>Quản trị Tài chính Minh bạch:</strong> Sổ quỹ dòng tiền, hạch toán giao dịch thực tế, xem mẫu Hóa đơn / Phiếu thu.</li>
            <li><strong>Giao việc & Quản trị Tiến độ:</strong> Mô hình Table và Kanban board trực quan, phân loại độ ưu tiên CRITICAL.</li>
            <li><strong>Thư viện Tài liệu & Báo cáo:</strong> Quản lý kho tài liệu quy chế và biểu đồ Recharts phân tích chỉ số KPI.</li>
          </ul>
        </div>

        <div class="card" style="border-top: 4px solid #e63946;">
          <h3>ỨNG DỤNG DI ĐỘNG CEO HN10 (MOBILE APP)</h3>
          <p style="font-size: 12px; color: #0b192c; font-weight: 700; margin: 4px 0 10px 0;">Nền tảng: iOS, Android (Native Capacitor) & PWA</p>
          <ul>
            <li><strong>Thẻ Hội viên Thông minh:</strong> Mã QR định danh cá nhân, chạm là check-in tại cửa hội trường trong 1 giây.</li>
            <li><strong>B2B Connect & Giao thương:</strong> Danh bạ điện tử doanh nhân, tìm kiếm đối tác theo lĩnh vực, ngành nghề.</li>
            <li><strong>Đăng ký & Tham dự:</strong> Đăng ký sự kiện Gala, xem lịch học chuyên đề, tham gia học online một chạm.</li>
            <li><strong>Trao đổi & Phản ánh:</strong> Bảng tin trao đổi công việc nội bộ và gửi góp ý trực tiếp đến Ban Cán Sự Lớp.</li>
            <li><strong>Thông báo Tức thời:</strong> Nhận thông báo lịch họp, văn bản mới ngay lập tức qua Push Notification.</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>Đồng bộ 100% thời gian thực với CSDL Chuẩn 113.20.107.184:6432</span>
      <span>Trang 5 / 8</span>
    </div>
  </div>

  <!-- SLIDE 6: KẾT QUẢ KIỂM THỬ THỰC TẾ -->
  <div class="slide slide-dark">
    <div class="slide-header">
      <div class="org-tag">NGHIỆM THU CHẤT LƯỢNG HỆ THỐNG</div>
      <div class="slide-title">KẾT QUẢ KIỂM THỬ THỰC TẾ & BẢO ĐẢM DỮ LIỆU ĐI VÀO CSDL</div>
      <div class="slide-sub">Minh chứng kiểm thử E2E trực tiếp trên server dev và cơ sở dữ liệu thực tế</div>
    </div>
    <div class="slide-body">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="num">13/13</div>
          <div class="lbl">Luồng kiểm thử HOÀN THÀNH 100%</div>
        </div>
        <div class="kpi-card">
          <div class="num">30</div>
          <div class="lbl">Ảnh chụp sắc nét, KHÔNG LỖI/404</div>
        </div>
        <div class="kpi-card">
          <div class="num">+25.000.000 đ</div>
          <div class="lbl">Dòng tiền thực tế cập nhật chuẩn</div>
        </div>
        <div class="kpi-card">
          <div class="num">113.20.107.184</div>
          <div class="lbl">CSDL PostgreSQL Chuẩn (ceohn10_project)</div>
        </div>
      </div>

      <div class="card" style="background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #ffffff;">
        <h3 style="color: #f4a261; border-color: #f4a261;">BẢNG ĐỐI CHIẾU DỮ LIỆU ĐI TỪ FRONTEND VÀO DATABASE POSTGRESQL</h3>
        <ul style="color: #e2e8f0; font-size: 12px; line-height: 1.8;">
          <li><strong>Sự kiện Gala Gắn kết 2026:</strong> Lưu đồng thời bảng <code>events</code> và <code>ceohn10_events</code> (ID valid UUID, 200 chỗ).</li>
          <li><strong>Buổi học Quản trị Tài chính:</strong> Lưu bảng <code>trainings</code> kèm thông tin giảng viên và link phòng học trực tuyến.</li>
          <li><strong>Góp ý & Phản ánh Hội viên:</strong> Ý kiến của hội viên Vũ Phan Vũ lưu vào bảng <code>event_feedbacks</code>.</li>
          <li><strong>Thư viện Tài liệu & Quy chế:</strong> Thư mục & file PDF quy chế BCS lưu trữ phân quyền trong bảng <code>documents</code>.</li>
          <li><strong>Giao việc Ban Sự kiện:</strong> Công việc mức CRITICAL, tiến độ 65% lưu vào bảng <code>tasks</code>.</li>
          <li><strong>Dòng tiền thực tế:</strong> Giao dịch mã <code>HP-HN10-099</code> (+25.000.000 VNĐ) lưu vào bảng <code>ceohn10_transactions</code>.</li>
        </ul>
      </div>
    </div>
    <div class="slide-footer">
      <span>Báo cáo nghiệm thu hoàn chỉnh: document/BAO_CAO_KIEM_THU_HE_THONG_CEOHN10.pdf</span>
      <span>Trang 6 / 8</span>
    </div>
  </div>

  <!-- SLIDE 7: KẾ HOẠCH BÀN GIAO & VẬN HÀNH -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="org-tag">LỘ TRÌNH TRIỂN KHAI</div>
      <div class="slide-title">KẾ HOẠCH BÀN GIAO & ĐƯA VÀO VẬN HÀNH THỰC TẾ</div>
      <div class="slide-sub">Các bước triển khai tiếp theo nhằm tối ưu hóa giá trị cho cộng đồng doanh nhân</div>
    </div>
    <div class="slide-body">
      <div class="grid-3">
        <div class="card">
          <h3 style="color: #0b192c;">Giai đoạn 1: Kiện toàn Ban Cán Sự</h3>
          <ul>
            <li>Tổ chức tập huấn sử dụng Web CRM cho Lớp Trưởng, các Lớp Phó và Trưởng/Phó Team.</li>
            <li>Bàn giao tài khoản quản trị và tài khoản theo 7 Ban Chuyên Môn.</li>
            <li>Thiết lập lịch sinh hoạt định kỳ, lịch học và phân công nhiệm vụ đầu khóa.</li>
          </ul>
        </div>
        <div class="card">
          <h3 style="color: #e63946;">Giai đoạn 2: Phổ cập Mobile App</h3>
          <ul>
            <li>Hướng dẫn 100% hội viên tải ứng dụng, đăng nhập và kích hoạt Thẻ Hội viên số.</li>
            <li>Cập nhật đầy đủ hồ sơ doanh nghiệp phục vụ giao thương kết nối B2B Connect.</li>
            <li>Áp dụng Check-in QR tự động tại các sự kiện Gala và buổi sinh hoạt của CLB.</li>
          </ul>
        </div>
        <div class="card">
          <h3 style="color: #15803d;">Giai đoạn 3: Vận hành Toàn diện</h3>
          <ul>
            <li>Hạch toán 100% thu chi hội phí và tài trợ qua phân hệ Quản trị Tài chính.</li>
            <li>Xuất báo cáo định kỳ hàng tháng cho Ban Điều Hành và Ban Tài Chính.</li>
            <li>Định kỳ sao lưu CSDL, giám sát an toàn thông tin và nâng cấp tính năng mới.</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="slide-footer">
      <span>Đồng hành và cam kết hỗ trợ kỹ thuật 24/7</span>
      <span>Trang 7 / 8</span>
    </div>
  </div>

  <!-- SLIDE 8: LỜI KẾT -->
  <div class="slide slide-dark" style="text-align: center; justify-content: center; align-items: center;">
    <div style="max-width: 900px; margin: auto;">
      <div class="org-tag" style="font-size: 16px; margin-bottom: 15px;">HIỆP HỘI DOANH NGHIỆP TRẺ HÀ NỘI (HANOIBA)</div>
      <h1 style="font-size: 42px; font-weight: 800; color: #f4a261; margin-bottom: 20px;">KẾT NỐI TINH HOA - VƯƠN TẦM BỨT PHÁ</h1>
      <p style="font-size: 20px; color: #ffffff; font-weight: 600; line-height: 1.5; margin-bottom: 30px;">
        HỆ THỐNG QUẢN TRỊ & KẾT NỐI DOANH NHÂN CEO HN10<br>
        NỀN TẢNG CÔNG NGHỆ CEO1983
      </p>
      <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
        Hệ thống đã hoàn tất nghiệm thu kỹ thuật xuất sắc, dữ liệu đồng bộ thời gian thực,<br>
        sẵn sàng đồng hành cùng Ban Điều Hành kiến tạo một cộng đồng doanh nhân vững mạnh và thịnh vượng!
      </p>
      <div style="margin-top: 40px; font-size: 14px; color: #f4a261; font-style: italic;">
        Trân trọng cảm ơn Ban Lãnh Đạo Hiệp Hội & Toàn Thể Quý Hội Viên Doanh Nhân!
      </div>
    </div>
    <div class="slide-footer" style="width: 100%;">
      <span>Hệ sinh thái CEO HN10 - CEO1983</span>
      <span>Trang 8 / 8</span>
    </div>
  </div>

</body>
</html>
  `;

  fs.writeFileSync(htmlSlidePath, html, 'utf8');
  console.log(`Saved slide deck HTML at: ${htmlSlidePath}`);

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  await page.goto('file:///' + htmlSlidePath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle'
  });

  await page.pdf({
    path: pdfSlidePath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  await browser.close();
  const stats = fs.statSync(pdfSlidePath);
  console.log(`✅ Xuất thành công Slide PDF: ${pdfSlidePath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

async function main() {
  await generatePptx();
  await generateSlidePdf();
  console.log('--- HOÀN TẤT TẠO TOÀN BỘ SLIDE TRÌNH BÀY! ---');
}

main().catch(console.error);
