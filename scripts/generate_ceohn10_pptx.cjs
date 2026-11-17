const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const docDir = path.join(rootDir, 'document');
const assetsDir = path.join(docDir, 'slide_assets');
const pptxPath = path.join(docDir, 'SLIDE_TRINH_BAY_PHAN_MEM_CEOHN10.pptx');

async function generatePptx() {
  console.log('Generating PowerPoint CEO HN10 (.pptx)...');
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Màu sắc thương hiệu
  const PRIMARY = '0B192C'; // Navy đậm
  const SECONDARY = '1E3E62'; // Blue slate
  const ACCENT = 'E63946'; // Đỏ thương hiệu HanoiBA
  const GOLD = 'F59E0B'; // Vàng cam ấm
  const LIGHT_BG = 'F8FAFC'; // Xám nhạt
  const WHITE = 'FFFFFF';
  const DARK = '0F172A';

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
  slide1.addText('Giải pháp chuyển đổi số toàn diện: Web CRM Quản trị & Ứng dụng Di động Hội viên\nĐồng bộ dữ liệu thời gian thực - Minh bạch tài chính - Tối ưu hóa vận hành 7 Ban Chuyên Môn', {
    x: 0.8, y: 4.3, w: 11.5, h: 0.8,
    fontSize: 14, fontFace: 'Arial', color: 'CBD5E1'
  });
  slide1.addText('Tên miền chính thức: CRM (https://crm.ceohn10.viconnect.vn) | App Mobile (https://ceohn10.viconnect.vn)\nCSDL Chuẩn: 113.20.107.184:6432 | Phiên bản: v5.1 Official Release 2026', {
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

  // SLIDE 3: KIẾN TRÚC TỔNG THỂ VOA
  let slide3 = pptx.addSlide();
  slide3.background = { color: PRIMARY };
  slide3.addText('KIẾN TRÚC HỆ THỐNG VOA CEO HN10', {
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

  // SLIDE 4: 7 BAN CHUYÊN MÔN
  let slide4 = pptx.addSlide();
  slide4.background = { color: PRIMARY };
  slide4.addText('CƠ CẤU TỔ CHỨC: 7 BAN CHUYÊN MÔN CEO HN10', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide4.addText('Mô hình chuẩn hóa hoạt động chuyên môn theo đúng sơ đồ định hướng lớp CEO HN10', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });
  const soDo7BanImg = path.join(assetsDir, 'so_do_7_ban.jpg');
  if (fs.existsSync(soDo7BanImg)) {
    slide4.addImage({ path: soDo7BanImg, x: 0.8, y: 1.7, w: 11.7, h: 4.8 });
  }

  // SLIDE 5: SƠ ĐỒ BCS LỚP VÀ TEAM
  let slide5 = pptx.addSlide();
  slide5.background = { color: PRIMARY };
  slide5.addText('SƠ ĐỒ TỔ CHỨC BAN CÁN SỰ LỚP & TEAM', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide5.addText('Cơ chế Lớp Trưởng, Lớp Phó và Trưởng Ban Tập sự điều hành nhịp nhàng', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });
  const soDoBcsImg = path.join(assetsDir, 'so_do_bcs.jpg');
  if (fs.existsSync(soDoBcsImg)) {
    slide5.addImage({ path: soDoBcsImg, x: 0.8, y: 1.7, w: 11.7, h: 4.8 });
  }

  // SLIDE 6: WEB CRM - QUẢN LÝ CÔNG VIỆC & NHIỆM VỤ
  let slide6 = pptx.addSlide();
  slide6.background = { color: LIGHT_BG };
  slide6.addText('WEB CRM QUẢN TRỊ: QUẢN LÝ CÔNG VIỆC & NHIỆM VỤ', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide6.addText('Phân công nhiệm vụ rõ ràng theo từng ban chuyên môn - Theo dõi tiến độ & hạn chót', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });
  const tasksImg = path.join(assetsDir, 'crm_tasks.jpg');
  if (fs.existsSync(tasksImg)) {
    slide6.addImage({ path: tasksImg, x: 0.8, y: 1.7, w: 11.7, h: 4.8 });
  }

  // SLIDE 7: WEB CRM - TÀI CHÍNH & SỔ QUỸ (2.1 TỶ VNĐ)
  let slide7 = pptx.addSlide();
  slide7.background = { color: LIGHT_BG };
  slide7.addText('WEB CRM: MINH BẠCH TÀI CHÍNH - QUỸ HỘI 2 TỶ 100 TRIỆU VNĐ', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: PRIMARY, bold: true
  });
  slide7.addText('Quản lý Thu - Chi - Xuất hóa đơn - Báo cáo dòng tiền biến động thực tế theo CSDL', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: '64748B'
  });
  const incomeImg = path.join(assetsDir, 'crm_income.jpg');
  const expensesImg = path.join(assetsDir, 'crm_expenses.jpg');
  if (fs.existsSync(incomeImg) && fs.existsSync(expensesImg)) {
    slide7.addImage({ path: incomeImg, x: 0.8, y: 1.7, w: 5.7, h: 4.8 });
    slide7.addImage({ path: expensesImg, x: 6.8, y: 1.7, w: 5.7, h: 4.8 });
  }

  // SLIDE 8: 4 SỰ KIỆN CỐ ĐỊNH CEO HN10
  let slide8 = pptx.addSlide();
  slide8.background = { color: PRIMARY };
  slide8.addText('4 SỰ KIỆN CỐ ĐỊNH TRỌNG TÂM CỦA CEO HN10', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide8.addText('Diễn ra thường niên định kỳ trong năm - Tích hợp Check-in QR & Quản lý đăng ký', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });

  const evts = [
    { title: '1. KHAI GIẢNG LỚP CEO HN10', date: '15/03 Hàng năm', desc: 'Lễ ra mắt khóa học, công bố Ban cán sự & định hướng hợp tác' },
    { title: '2. TEAM BUILDING GẮN KẾT', date: '18/07 Hàng năm', desc: 'Chương trình dã ngoại gắn kết tinh thần chiến binh doanh nhân' },
    { title: '3. YEAR END PARTY & GALA', date: '26/12 Hàng năm', desc: 'Dạ tiệc tổng kết năm, vinh danh đóng góp & kết nối giao thương' },
    { title: '4. LỄ BẾ GIẢNG & TRAO CHỨNG NHẬN', date: '16/01 Hàng năm', desc: 'Tốt nghiệp, kết nạp mạng lưới cựu học viên CEO HanoiBA' }
  ];
  evts.forEach((ev, idx) => {
    const ex = 0.8 + idx * 2.95;
    slide8.addShape(pptx.ShapeType.roundRect, { x: ex, y: 1.8, w: 2.75, h: 4.6, fill: { color: SECONDARY }, line: { color: GOLD, width: 1.5 } });
    slide8.addText(ev.title, { x: ex + 0.15, y: 2.1, w: 2.45, h: 0.8, fontSize: 14, bold: true, color: WHITE, align: 'center' });
    slide8.addText(ev.date, { x: ex + 0.15, y: 3.1, w: 2.45, h: 0.5, fontSize: 13, bold: true, color: GOLD, align: 'center' });
    slide8.addText(ev.desc, { x: ex + 0.15, y: 3.8, w: 2.45, h: 2.0, fontSize: 11, color: 'E2E8F0', align: 'center' });
  });

  // SLIDE 9: MOBILE APP HỘI VIÊN
  let slide9 = pptx.addSlide();
  slide9.background = { color: PRIMARY };
  slide9.addText('MOBILE APP HỘI VIÊN CEO HN10', {
    x: 0.8, y: 0.6, w: 11.5, h: 0.5,
    fontSize: 22, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide9.addText('Trải nghiệm di động tiện lợi - Quét QR, Lịch học, Danh bạ doanh nhân, B2B Connect', {
    x: 0.8, y: 1.1, w: 11.5, h: 0.4,
    fontSize: 13, fontFace: 'Arial', color: GOLD
  });
  const mobileImg = path.join(assetsDir, 'mobile_app_home.jpg');
  if (fs.existsSync(mobileImg)) {
    slide9.addImage({ path: mobileImg, x: 0.8, y: 1.7, w: 3.4, h: 4.8 });
  }
  slide9.addShape(pptx.ShapeType.rect, { x: 4.6, y: 1.7, w: 7.9, h: 4.8, fill: { color: SECONDARY }, line: { color: '38BDF8', width: 1 } });
  slide9.addText('TÍNH NĂNG NỔI BẬT TRÊN MOBILE APP', { x: 4.9, y: 2.0, w: 7.3, h: 0.4, fontSize: 16, bold: true, color: GOLD });
  slide9.addText('• Lịch học & Điểm danh QR: Tự động ghi nhận sĩ số lớp học về CRM.\n• Danh bạ Doanh nhân CEO HN10: Tra cứu ngành nghề, kết nối trực tiếp.\n• Sự kiện & Đăng ký: Nhận thông báo mời, xác nhận tham gia và vé điện tử.\n• B2B Connect: Chia sẻ cơ hội kinh doanh, hợp tác đầu tư và kết nối giao thương.\n• Ví & Hội phí: Xem lịch sử đóng quỹ, thẻ hội viên số tích hợp mã QR cá nhân.', {
    x: 4.9, y: 2.6, w: 7.3, h: 3.5, fontSize: 13, color: WHITE, lineSpacing: 22
  });

  // SLIDE 10: LỘ TRÌNH & KẾT LUẬN
  let slide10 = pptx.addSlide();
  slide10.background = { color: PRIMARY };
  slide10.addText('KẾ HOẠCH TRIỂN KHAI & BÀN GIAO', {
    x: 0.8, y: 0.8, w: 11.5, h: 0.5,
    fontSize: 24, fontFace: 'Arial', color: WHITE, bold: true
  });
  slide10.addText('Hệ thống sẵn sàng vận hành phục vụ toàn diện Lớp Doanh nhân CEO HN10', {
    x: 0.8, y: 1.4, w: 11.5, h: 0.4,
    fontSize: 14, fontFace: 'Arial', color: GOLD
  });
  slide10.addShape(pptx.ShapeType.rect, { x: 0.8, y: 2.2, w: 11.7, h: 3.8, fill: { color: SECONDARY }, line: { color: '38BDF8', width: 1.5 } });
  slide10.addText('CAM KẾT VẬN HÀNH & BẢO HÀNH CHUYÊN NGHIỆP', { x: 1.2, y: 2.5, w: 10.9, h: 0.4, fontSize: 18, bold: true, color: WHITE });
  slide10.addText('1. Dữ liệu chuẩn xác 100% lưu trữ tại máy chủ CSDL PostgreSQL: 113.20.107.184:6432.\n2. Tách biệt hoàn toàn Web CRM Quản trị và Mobile App Hội viên theo kiến trúc VOA chuẩn mực.\n3. Hỗ trợ kỹ thuật 24/7 cho Ban Cán Sự Lớp và toàn thể học viên trong suốt khóa học.\n4. Đảm bảo hạ tầng CI/CD tự động cập nhật mượt mà, an toàn dữ liệu và bảo mật cao cấp.', {
    x: 1.2, y: 3.2, w: 10.9, h: 2.4, fontSize: 14, color: 'E2E8F0', lineSpacing: 24
  });

  await pptx.writeFile({ fileName: pptxPath });
  const stats = fs.statSync(pptxPath);
  console.log(`✅ Xuất thành công Slide PPTX CEO HN10: ${pptxPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

generatePptx().catch(console.error);
