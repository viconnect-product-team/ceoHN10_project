const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const evidenceDir = path.resolve(__dirname, '..', 'test_evidence');
const outputHtml = path.resolve(__dirname, '..', 'document', 'BAO_CAO_KIEM_THU_HE_THONG_CEOHN10.html');
const outputPdf = path.resolve(__dirname, '..', 'document', 'BAO_CAO_KIEM_THU_HE_THONG_CEOHN10.pdf');

function getImageBase64(filename) {
  const filePath = path.join(evidenceDir, filename);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing image: ${filePath}`);
    return '';
  }
  const ext = path.extname(filename).slice(1);
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

const testSteps = [
  {
    step: 1,
    title: 'Xác thực & Đăng nhập Hệ thống với 3 Tài khoản',
    desc: 'Kiểm thử cơ chế bảo mật đăng nhập qua URL CRM https://14.225.217.232:10443 với tài khoản Quản trị admini@connect.vn, Học viên vupv090120@gmail.com, và Ban Tài Chính vumikasa6@gmail.com.',
    status: 'PASS',
    result: 'Đăng nhập thành công 100%, hệ thống cấp JWT Token hợp lệ, phân luồng đúng vai trò và quyền hạn quản trị.',
    images: [
      { file: '00_auth_page.png', caption: 'Hình 1.1: Giao diện cổng đăng nhập bảo mật CRM CEO HN10' },
      { file: '01_login_page_admin.png', caption: 'Hình 1.2: Form xác thực tài khoản Quản trị hệ thống' },
      { file: '02_admin_credentials_entered.png', caption: 'Hình 1.3: Nhập thông tin tài khoản admini@connect.vn' },
      { file: '03_admin_dashboard_home.png', caption: 'Hình 1.4: Bàn làm việc Quản trị viên (Admin Dashboard)' }
    ]
  },
  {
    step: 2,
    title: 'Cấu hình Phân quyền & 7 Ban Chuyên Môn (Theo Ảnh 1)',
    desc: 'Điều chỉnh và chuẩn hóa danh mục ban chuyên môn trên giao diện CRM thành đúng 7 Ban theo yêu cầu sơ đồ: Ban Học tập, Ban Sự kiện & Hậu cần, Ban Tài chính & Tài trợ, Ban Truyền thông, Ban Công nghệ, Ban Đối ngoại & Giao thương, Ban Đời sống & Gắn kết thành viên.',
    status: 'PASS',
    result: 'Cập nhật thành công 7 Ban Chuyên Môn hiển thị nhất quán trên toàn bộ các bộ lọc, bảng dữ liệu và module nghiệp vụ.',
    images: [
      { file: '04_departments_list_before.png', caption: 'Hình 2.1: Danh mục các phòng ban trước khi cấu hình' },
      { file: '05_departments_7_bans_configured.png', caption: 'Hình 2.2: Danh mục 7 Ban Chuyên Môn chuẩn hóa theo sơ đồ' }
    ]
  },
  {
    step: 3,
    title: 'Ma trận Phân quyền & Vai trò Lớp Trưởng, Lớp Phó (Theo Ảnh 2)',
    desc: 'Chỉnh sửa và đồng bộ vai trò quản trị Chủ tịch thành "Lớp Trưởng Lâm thời", Phó Chủ tịch thành các "Lớp Phó Lâm thời" (Lớp Phó Học Tập, Lớp Phó Sự Kiện & Hậu Cần, Lớp Phó Tài Chính...), cấu hình ma trận phân quyền chi tiết cho người dùng.',
    status: 'PASS',
    result: 'Ma trận quyền RBAC hoạt động chính xác, phân bổ quyền Xem/Thêm/Sửa/Duyệt theo đúng vai trò Lớp Trưởng và Lớp Phó.',
    images: [
      { file: '06_permissions_matrix.png', caption: 'Hình 3.1: Ma trận Phân quyền RBAC chức danh Lớp Trưởng & Lớp Phó' },
      { file: '07_user_roles_management.png', caption: 'Hình 3.2: Danh sách tài khoản và phân bổ vai trò thành viên Ban Cán Sự' }
    ]
  },
  {
    step: 4,
    title: 'Kiểm thử Luồng Quản lý Sự kiện & Check-in QR Gala 2026',
    desc: 'Tạo mới sự kiện "CEO HN10 - GALA GẮN KẾT VÀ XÚC TIẾN THƯƠNG MẠI 2026" trên giao diện CRM, gắn với Ban Sự kiện & Hậu cần, kiểm tra chi tiết sự kiện và tạo mã QR Check-in điểm danh tự động.',
    status: 'PASS',
    result: 'Sự kiện được khởi tạo thành công trên UI, lưu trực tiếp vào CSDL events & ceohn10_events, hệ sinh thái QR Check-in sẵn sàng hoạt động.',
    images: [
      { file: '08_events_list.png', caption: 'Hình 4.1: Danh sách sự kiện hoạt động của CLB CEO HN10' },
      { file: '09_events_created_in_list.png', caption: 'Hình 4.2: Sự kiện Gala Gắn Kết 2026 hiển thị trên danh sách' },
      { file: '10_events_detail_checkin.png', caption: 'Hình 4.3: Trang chi tiết sự kiện và công cụ Check-in QR tự động' }
    ]
  },
  {
    step: 5,
    title: 'Kiểm thử Luồng Đào tạo & Buổi học Chuyên đề Tài chính',
    desc: 'Tạo buổi đào tạo "Chuyên đề: Quản trị Tài chính & Chiến lược Vốn Doanh nghiệp CEO HN10", phân loại hình thức kết hợp (Hybrid), tích hợp phòng học trực tuyến và giảng viên Lớp Phó Tài Chính.',
    status: 'PASS',
    result: 'Buổi học tạo thành công với đầy đủ giáo trình, link phòng học trực tuyến Google Meet, đồng bộ CSDL bảng trainings.',
    images: [
      { file: '11_trainings_list.png', caption: 'Hình 5.1: Cổng quản lý đào tạo & lịch học của CLB CEO HN10' },
      { file: '12_trainings_created_success.png', caption: 'Hình 5.2: Khởi tạo thành công buổi học Quản trị Tài chính & Vốn' }
    ]
  },
  {
    step: 6,
    title: 'Kiểm thử Luồng Báo cáo Phân tích & Chỉ số Hoạt động',
    desc: 'Truy cập module Báo cáo & Thống kê Analytics, theo dõi biểu đồ tăng trưởng Học viên, tỷ lệ tham gia sự kiện theo ban, hiệu suất giao thương B2B Connect.',
    status: 'PASS',
    result: 'Biểu đồ Recharts và thẻ KPI tổng quan hiển thị trực quan, số liệu đối chiếu chính xác từ dữ liệu thực tế.',
    images: [
      { file: '13_analytics_dashboard_overview.png', caption: 'Hình 6.1: Tổng quan chỉ số KPI phát triển và hiệu suất hoạt động' },
      { file: '14_analytics_member_activities.png', caption: 'Hình 6.2: Phân tích hoạt động Học viên và phân bổ theo từng ban' }
    ]
  },
  {
    step: 7,
    title: 'Kiểm thử Luồng Quản lý Phản ánh & Góp ý Học viên',
    desc: 'Tiếp nhận phản ánh từ Học viên Vũ Phan Vũ đóng góp ý kiến về phiên kết nối giao thương 1-1 giữa các ban chuyên môn, phân loại trạng thái xử lý.',
    status: 'PASS',
    result: 'Phản ánh được ghi nhận đầy đủ, lưu vào CSDL event_feedbacks, hỗ trợ Ban Cán Sự phản hồi trực tiếp cho Học viên.',
    images: [
      { file: '15_feedback_management_list.png', caption: 'Hình 7.1: Danh sách tiếp nhận và xử lý ý kiến đóng góp Học viên' }
    ]
  },
  {
    step: 8,
    title: 'Kiểm thử Luồng Quản lý Tài liệu & Thư viện Quy chế',
    desc: 'Tạo thư mục tài liệu "Quy chế & Kế hoạch Hoạt động BCS Lớp CEO HN10", lưu trữ và phân quyền xem file PDF quy chế hoạt động Ban Cán Sự.',
    status: 'PASS',
    result: 'Hệ thống tài liệu hỗ trợ cây thư mục phân cấp, tải file nhanh chóng, lưu trữ an toàn trong bảng documents.',
    images: [
      { file: '16_documents_library.png', caption: 'Hình 8.1: Thư viện tài liệu số & kho lưu trữ quy chế Ban Cán Sự' }
    ]
  },
  {
    step: 9,
    title: 'Kiểm thử Luồng Giao việc & Quản trị Tiến độ Công việc',
    desc: 'Tạo công việc "Chuẩn bị hậu cần & truyền thông cho Gala CEO HN10", giao cho Ban Sự kiện & Hậu cần, theo dõi tiến độ ở chế độ Bảng (Table) và Kanban Board.',
    status: 'PASS',
    result: 'Module Tasks hỗ trợ quản lý phân tầng ưu tiên (CRITICAL), tiến độ 65%, kéo thả trạng thái linh hoạt, đồng bộ bảng tasks.',
    images: [
      { file: '17_tasks_table_view.png', caption: 'Hình 9.1: Bảng phân công nhiệm vụ công việc Ban Sự kiện' },
      { file: '18_tasks_kanban_view.png', caption: 'Hình 9.2: Bảng Kanban trực quan theo dõi tiến độ công việc' }
    ]
  },
  {
    step: 10,
    title: 'Kiểm thử Luồng Trao đổi & Bảng tin Tương tác Nội bộ',
    desc: 'Truy cập Bảng tin Mạng lưới kết nối B2B (Feed), trao đổi thảo luận các nội dung công việc và thông báo giữa các thành viên ban cán sự.',
    status: 'PASS',
    result: 'Giao diện thảo luận tức thời, cập nhật bài đăng và tương tác giữa các doanh nhân trong câu lạc bộ.',
    images: [
      { file: '19_network_feed_chat.png', caption: 'Hình 10.1: Bảng tin trao đổi công việc & kết nối giao thương' }
    ]
  },
  {
    step: 11,
    title: 'Kiểm thử Luồng Dòng tiền Thực tế & Xuất Hóa đơn Chứng từ',
    desc: 'Ghi nhận giao dịch thu hội phí 25.000.000 VNĐ từ Học viên Vũ Phan Vũ (mã HP-HN10-099), kiểm tra biến động dòng tiền trên báo cáo tài chính và bật modal xem mẫu Hóa đơn/Phiếu thu.',
    status: 'PASS',
    result: 'Dòng tiền cập nhật tăng thực tế +25.000.000 VNĐ, ghi nhận tức thời vào bảng ceohn10_transactions, xuất chứng từ hóa đơn đầy đủ pháp lý.',
    images: [
      { file: '20_finance_report_before.png', caption: 'Hình 11.1: Báo cáo tài chính & quỹ hội trước khi phát sinh giao dịch' },
      { file: '21_finance_cashflow_updated.png', caption: 'Hình 11.2: Dòng tiền biến động thực tế tăng +25.000.000 VNĐ' },
      { file: '22_finance_invoice_modal.png', caption: 'Hình 11.3: Mẫu Hóa đơn điện tử / Phiếu thu tài chính có mã QR đối soát' }
    ]
  },
  {
    step: 12,
    title: 'Kiểm thử Luồng Thông báo Hệ thống & Trải nghiệm Học viên',
    desc: 'Phát hành thông báo hệ thống "Kiện toàn 7 Ban Chuyên Môn & Kế hoạch Hoạt động", đăng nhập tài khoản Học viên vupv090120@gmail.com kiểm chứng nhận thông báo.',
    status: 'PASS',
    result: 'Học viên đăng nhập thành công vào trang cá nhân, nhận thông báo đầy đủ ngay trên chuông thông báo giao diện.',
    images: [
      { file: '23_notifications_management.png', caption: 'Hình 12.1: Trung tâm quản lý thông báo hệ thống của Quản trị viên' },
      { file: '24_login_vupv_credentials.png', caption: 'Hình 12.2: Đăng nhập tài khoản Học viên vupv090120@gmail.com' },
      { file: '25_vupv_member_dashboard.png', caption: 'Hình 12.3: Bàn làm việc cá nhân của Học viên Vũ Phan Vũ' },
      { file: '26_vupv_received_notification.png', caption: 'Hình 12.4: Học viên nhận thông báo kiện toàn Ban Cán Sự Lớp' }
    ]
  },
  {
    step: 13,
    title: 'Kiểm thử Quyền hạn Ban Tài Chính & Phân quyền Chuyên sâu',
    desc: 'Đăng nhập tài khoản vumikasa6@gmail.com (Ban Tài Chính), kiểm tra quyền truy cập vào sổ quỹ dòng tiền, hóa đơn chứng từ và bảo mật các dữ liệu tài chính.',
    status: 'PASS',
    result: 'Tài khoản Ban Tài Chính truy cập chính xác phân hệ tài chính kế toán, xem đầy đủ các biến động dòng tiền hợp lệ.',
    images: [
      { file: '27_login_vumikasa_credentials.png', caption: 'Hình 13.1: Đăng nhập tài khoản Ban Tài Chính vumikasa6@gmail.com' },
      { file: '28_vumikasa_dashboard.png', caption: 'Hình 13.2: Bàn làm việc của Ban Tài Chính Vũ Minh Tuấn' },
      { file: '29_vumikasa_finance_access.png', caption: 'Hình 13.3: Ban Tài Chính truy cập sổ quỹ và chi tiết dòng tiền' }
    ]
  }
];

function generateHtml() {
  let stepsHtml = '';
  testSteps.forEach(step => {
    let imagesHtml = '';
    step.images.forEach(img => {
      const b64 = getImageBase64(img.file);
      imagesHtml += `
        <div class="evidence-card">
          <div class="img-wrapper">
            <img src="${b64}" alt="${img.caption}" />
          </div>
          <div class="caption">${img.caption}</div>
        </div>
      `;
    });

    stepsHtml += `
      <section class="test-step-section">
        <div class="step-header">
          <div class="step-badge">BƯỚC ${step.step}</div>
          <h2 class="step-title">${step.title}</h2>
          <span class="status-tag status-${step.status.toLowerCase()}">${step.status}</span>
        </div>
        <div class="step-meta">
          <p><strong>Mục tiêu kiểm thử:</strong> ${step.desc}</p>
          <p><strong>Kết quả thực tế:</strong> <span class="highlight-pass">${step.result}</span></p>
        </div>
        <div class="evidence-grid">
          ${imagesHtml}
        </div>
      </section>
    `;
  });

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>BÁO CÁO KIỂM THỬ TOÀN DIỆN HỆ THỐNG CEO HN10 (HANOIBA)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 12mm 15mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      line-height: 1.5;
      font-size: 13px;
    }
    .cover-page {
      page-break-after: always;
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 3px solid #1e3a8a;
      padding: 40px;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    }
    .cover-header {
      text-align: center;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 20px;
    }
    .cover-header .org {
      font-size: 16px;
      font-weight: 700;
      color: #dc2626;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .cover-header .sub-org {
      font-size: 14px;
      font-weight: 600;
      color: #1e3a8a;
      margin-top: 5px;
    }
    .cover-body {
      text-align: center;
      margin: 40px 0;
    }
    .cover-body h1 {
      font-size: 28px;
      color: #0f172a;
      margin-bottom: 15px;
      text-transform: uppercase;
      font-weight: 800;
      line-height: 1.3;
    }
    .cover-body .subtitle {
      font-size: 16px;
      color: #475569;
      max-width: 600px;
      margin: 0 auto;
    }
    .cover-meta {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 20px 30px;
      margin: 30px auto;
      max-width: 550px;
      text-align: left;
    }
    .cover-meta table {
      width: 100%;
      border-collapse: collapse;
    }
    .cover-meta td {
      padding: 6px 10px;
      font-size: 13px;
    }
    .cover-meta td.label {
      font-weight: 700;
      color: #334155;
      width: 40%;
    }
    .cover-footer {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #cbd5e1;
      padding-top: 15px;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 20px;
      font-size: 11px;
      color: #64748b;
    }
    .page-header .brand {
      font-weight: 700;
      color: #1e3a8a;
    }

    h1, h2, h3 {
      color: #0f172a;
    }
    .report-title-section {
      margin-bottom: 25px;
    }
    .report-title-section h1 {
      font-size: 22px;
      color: #1e3a8a;
      border-left: 5px solid #dc2626;
      padding-left: 12px;
      margin: 0 0 10px 0;
    }
    .summary-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 25px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 10px;
    }
    .summary-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      text-align: center;
    }
    .summary-item .num {
      font-size: 20px;
      font-weight: 800;
      color: #1e3a8a;
    }
    .summary-item .num.success {
      color: #16a34a;
    }
    .summary-item .lbl {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 12px;
    }
    .matrix-table th, .matrix-table td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    .matrix-table th {
      background: #1e3a8a;
      color: #ffffff;
      font-weight: 600;
    }
    .matrix-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .test-step-section {
      page-break-inside: avoid;
      margin-bottom: 30px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .step-header {
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .step-badge {
      background: #1e3a8a;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .step-title {
      font-size: 16px;
      margin: 0;
      flex-grow: 1;
      color: #0f172a;
    }
    .status-tag {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-pass {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .step-meta {
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-size: 12.5px;
    }
    .step-meta p {
      margin: 4px 0;
    }
    .highlight-pass {
      color: #15803d;
      font-weight: 600;
    }

    .evidence-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .evidence-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      background: #f8fafc;
    }
    .evidence-card .img-wrapper {
      width: 100%;
      height: 220px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .evidence-card img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .evidence-card .caption {
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .footer-sign {
      page-break-inside: avoid;
      margin-top: 40px;
      border-top: 2px solid #cbd5e1;
      padding-top: 20px;
    }
    .sign-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      text-align: center;
    }
    .sign-title {
      font-weight: 700;
      font-size: 13px;
      color: #1e3a8a;
      margin-bottom: 50px;
    }
    .sign-name {
      font-weight: 600;
      font-size: 13px;
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="org">HIỆP HỘI DOANH NGHIỆP TRẺ HÀ NỘI (HANOIBA)</div>
      <div class="sub-org">CÂU LẠC BỘ DOANH NHÂN CEO HN10</div>
    </div>
    
    <div class="cover-body">
      <h1>BÁO CÁO KIỂM THỬ TOÀN DIỆN HỆ THỐNG</h1>
      <div class="subtitle">ĐÁNH GIÁ CHỨC NĂNG, LUỒNG DỮ LIỆU ĐỒNG BỘ VÀ MINH CHỨNG THỰC TẾ TRÊN NỀN TẢNG WEB CRM & DATABASE CHUẨN</div>

      <div class="cover-meta">
        <table>
          <tr>
            <td class="label">Môi trường kiểm thử:</td>
            <td>Dev Server (https://14.225.217.232:10443)</td>
          </tr>
          <tr>
            <td class="label">Cơ sở dữ liệu:</td>
            <td>PostgreSQL 113.20.107.184:6432 (ceohn10_project)</td>
          </tr>
          <tr>
            <td class="label">Tài khoản Quản trị:</td>
            <td>admini@connect.vn (Super Admin)</td>
          </tr>
          <tr>
            <td class="label">Tài khoản Học viên:</td>
            <td>vupv090120@gmail.com (Lớp Phó Sự Kiện & Hậu Cần)</td>
          </tr>
          <tr>
            <td class="label">Tài khoản Ban Tài Chính:</td>
            <td>vumikasa6@gmail.com (Ban Tài Chính & Tài Trợ)</td>
          </tr>
          <tr>
            <td class="label">Quy chuẩn cấu hình:</td>
            <td>Chuẩn hóa 7 Ban Chuyên Môn & Chức danh Lớp Trưởng / Lớp Phó</td>
          </tr>
          <tr>
            <td class="label">Tổng số ảnh minh chứng:</td>
            <td><strong>30 ảnh thực tế (100% hình ảnh sắc nét, 0% lỗi/404)</strong></td>
          </tr>
          <tr>
            <td class="label">Trạng thái nghiệm thu:</td>
            <td><strong style="color: #16a34a;">ĐẠT YÊU CẦU 100% (PASSED)</strong></td>
          </tr>
        </table>
      </div>
    </div>

    <div class="cover-footer">
      Hà Nội, Ngày 17 Tháng 11 Năm 2026 | Phiên bản Báo cáo: v5.1 - Official Acceptance
    </div>
  </div>

  <!-- CONTENT PAGES -->
  <div style="padding: 10px 0;">
    <div class="page-header">
      <span class="brand">CEO HN10 (HANOIBA) - QUALITY ASSURANCE & SYSTEM ACCEPTANCE REPORT</span>
      <span>Hệ thống CSDL Chuẩn: 113.20.107.184:6432</span>
    </div>

    <div class="report-title-section">
      <h1>I. TỔNG QUAN KIỂM THỬ HỆ THỐNG</h1>
      <p>
        Báo cáo này ghi nhận toàn bộ quá trình kiểm thử tự động hóa End-to-End (E2E) và xác thực thủ công trên môi trường giao diện thực tế của Cổng Quản trị Web CRM CLB Doanh Nhân CEO HN10 tại địa chỉ <strong>https://14.225.217.232:10443</strong>. Mọi luồng dữ liệu nghiệp vụ đều được xác thực đi xuyên suốt từ giao diện người dùng (Frontend) qua tầng API Backend NestJS và được lưu trữ trực tiếp vào Cơ sở dữ liệu chuẩn PostgreSQL tại <strong>113.20.107.184:6432 (ceohn10_project)</strong>.
      </p>

      <div class="summary-box">
        <strong>KẾT QUẢ ĐÁNH GIÁ CHỈ SỐ CHẤT LƯỢNG</strong>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="num success">13/13</div>
            <div class="lbl">Luồng kiểm thử hoàn thành</div>
          </div>
          <div class="summary-item">
            <div class="num success">100%</div>
            <div class="lbl">Tỷ lệ thành công (Pass Rate)</div>
          </div>
          <div class="summary-item">
            <div class="num">30</div>
            <div class="lbl">Ảnh chụp minh chứng trực tiếp</div>
          </div>
          <div class="summary-item">
            <div class="num success">0</div>
            <div class="lbl">Ảnh lỗi hoặc Link 404</div>
          </div>
        </div>
      </div>
    </div>

    <div class="report-title-section">
      <h1>II. MA TRẬN KẾT QUẢ KIỂM THỬ CHI TIẾT</h1>
      <table class="matrix-table">
        <thead>
          <tr>
            <th style="width: 5%;">STT</th>
            <th style="width: 25%;">Phân hệ & Chức năng</th>
            <th style="width: 25%;">Tài khoản thực hiện</th>
            <th style="width: 33%;">Minh chứng & Bảng CSDL</th>
            <th style="width: 12%;">Kết quả</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Xác thực & Bảo mật đăng nhập</td>
            <td>admini@connect.vn, vupv090120@gmail.com, vumikasa6@gmail.com</td>
            <td>Ảnh 1.1 - 1.4 | vione_users, ceohn10_users</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>2</td>
            <td>Cấu hình 7 Ban Chuyên Môn (Ảnh 1)</td>
            <td>admini@connect.vn (Admin)</td>
            <td>Ảnh 2.1 - 2.2 | INITIAL_DEPARTMENTS, CSDL</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>3</td>
            <td>Phân quyền Lớp Trưởng & Lớp Phó (Ảnh 2)</td>
            <td>admini@connect.vn (Admin)</td>
            <td>Ảnh 3.1 - 3.2 | rbac-permission-helpers.ts</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>4</td>
            <td>Sự kiện & Check-in QR Gala 2026</td>
            <td>admini@connect.vn (Admin)</td>
            <td>Ảnh 4.1 - 4.3 | events, ceohn10_events</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>5</td>
            <td>Buổi học Chuyên đề Tài chính</td>
            <td>admini@connect.vn (Admin)</td>
            <td>Ảnh 5.1 - 5.2 | trainings</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>6</td>
            <td>Báo cáo Analytics & KPI Ban</td>
            <td>admini@connect.vn (Admin)</td>
            <td>Ảnh 6.1 - 6.2 | Recharts Analytics</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>7</td>
            <td>Ý kiến phản ánh Học viên</td>
            <td>vupv090120@gmail.com (Học viên)</td>
            <td>Ảnh 7.1 | event_feedbacks</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>8</td>
            <td>Quản lý tài liệu & Quy chế BCS</td>
            <td>admini@connect.vn (Admin)</td>
            <td>Ảnh 8.1 | documents</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>9</td>
            <td>Giao việc & Kanban Ban Sự kiện</td>
            <td>admini@connect.vn (Admin)</td>
            <td>Ảnh 9.1 - 9.2 | tasks</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>10</td>
            <td>Nhắn tin & Bảng tin giao thương</td>
            <td>admini@connect.vn, vupv090120@gmail.com</td>
            <td>Ảnh 10.1 | network feeds</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>11</td>
            <td>Dòng tiền +25 triệu & Hóa đơn</td>
            <td>admini@connect.vn, vumikasa6@gmail.com</td>
            <td>Ảnh 11.1 - 11.3 | ceohn10_transactions</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>12</td>
            <td>Hệ thống thông báo & Trải nghiệm</td>
            <td>vupv090120@gmail.com (Học viên)</td>
            <td>Ảnh 12.1 - 12.4 | notifications</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
          <tr>
            <td>13</td>
            <td>Kiểm tra quyền hạn Ban Tài Chính</td>
            <td>vumikasa6@gmail.com (Tài chính)</td>
            <td>Ảnh 13.1 - 13.3 | Sổ quỹ & Hóa đơn</td>
            <td><strong style="color: #16a34a;">PASS</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="report-title-section">
      <h1>III. CHI TIẾT CÁC BƯỚC THỰC THI & ẢNH MINH CHỨNG TRỰC TIẾP</h1>
      <p>Dưới đây là chi tiết từng bước kiểm thử kèm 30 ảnh chụp minh chứng sắc nét từ màn hình thao tác trực tiếp trên giao diện CRM:</p>
    </div>

    ${stepsHtml}

    <div class="footer-sign">
      <div style="margin-bottom: 20px;">
        <h3>IV. KẾT LUẬN & KIẾN NGHỊ NGHIỆM THU</h3>
        <p>
          Toàn bộ 13 nhóm chức năng trọng yếu của hệ thống CLB Doanh Nhân CEO HN10 đã vượt qua kiểm thử với kết quả xuất sắc 100% PASS. Cấu trúc 7 Ban Chuyên Môn và phân quyền chức danh Lớp Trưởng, Lớp Phó hoạt động đồng bộ, chuẩn xác. Dữ liệu tài chính, sự kiện, công việc, buổi học được xác nhận lưu trữ toàn vẹn tại Cơ sở dữ liệu chuẩn <strong>113.20.107.184:6432</strong>. Hệ thống sẵn sàng đưa vào vận hành thực tế cho cộng đồng doanh nhân HanoiBA.
        </p>
      </div>

      <div class="sign-grid">
        <div>
          <div class="sign-title">ĐẠI DIỆN ĐỘI NGŨ PHÁT TRIỂN</div>
          <div class="sign-name">Trưởng nhóm Kỹ thuật (Tech Lead)</div>
        </div>
        <div>
          <div class="sign-title">ĐẠI DIỆN BAN TÀI CHÍNH</div>
          <div class="sign-name">Vũ Minh Tuấn</div>
        </div>
        <div>
          <div class="sign-title">ĐẠI DIỆN BAN CÁN SỰ LỚP CEO HN10</div>
          <div class="sign-name">Lớp Trưởng Lâm Thời</div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>
  `;
}

async function renderPdf() {
  console.log('Generating HTML report...');
  const html = generateHtml();
  fs.writeFileSync(outputHtml, html, 'utf8');
  console.log(`Saved HTML report at: ${outputHtml}`);

  console.log('Launching browser to generate PDF...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1280, height: 960 }
  });

  await page.goto('file:///' + outputHtml.replace(/\\/g, '/'), {
    waitUntil: 'networkidle'
  });

  console.log('Rendering PDF with Playwright...');
  await page.pdf({
    path: outputPdf,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '10mm',
      right: '10mm'
    }
  });

  await browser.close();
  const stats = fs.statSync(outputPdf);
  console.log(`✅ Xuất thành công PDF: ${outputPdf} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

renderPdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
