import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const testDataDir = path.join(rootDir, 'test-data', 'events');

if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

console.log('🔄 Đang tạo các tệp dữ liệu kiểm thử thực tế cho Sự Kiện CEO HN10...');

// 1. Tạo tệp Excel danh sách tham dự sự kiện Khai giảng (.xlsx)
const attendeesData = [
  {
    STT: 1,
    'Họ và tên': 'Nguyễn Văn Mạnh',
    'Email': 'nguyenvanmanh.ceo@vione.vn',
    'Số điện thoại': '0912345678',
    'Công ty / Doanh nghiệp': 'Tập đoàn Công nghệ ViOne',
    'Chức danh': 'Chủ tịch HĐQT',
    'Trạng thái thanh toán': 'Đã thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Tất cả (Tọa đàm + Gala Party)',
    'Số ghế VIP': 'VIP-01',
    'Yêu cầu đặc biệt': 'Ăn chay'
  },
  {
    STT: 2,
    'Họ và tên': 'Trần Thị Mai Phương',
    'Email': 'maiphuong.tran@vietgroup.vn',
    'Số điện thoại': '0988776655',
    'Công ty / Doanh nghiệp': 'Công ty CP Đầu tư Việt Group',
    'Chức danh': 'Tổng Giám Đốc',
    'Trạng thái thanh toán': 'Đã thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Tất cả (Tọa đàm + Gala Party)',
    'Số ghế VIP': 'VIP-02',
    'Yêu cầu đặc biệt': 'Không'
  },
  {
    STT: 3,
    'Họ và tên': 'Lê Hoàng Long',
    'Email': 'long.le@hanoilogistics.com',
    'Số điện thoại': '0903214567',
    'Công ty / Doanh nghiệp': 'Hanoi Logistics JSC',
    'Chức danh': 'Phó Tổng Giám Đốc',
    'Trạng thái thanh toán': 'Chưa thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Chỉ Tọa đàm / Hội thảo',
    'Số ghế VIP': 'A-12',
    'Yêu cầu đặc biệt': 'Cần xuất hóa đơn VAT'
  },
  {
    STT: 4,
    'Họ và tên': 'Phạm Quốc Bảo',
    'Email': 'baopq@ancuongwood.vn',
    'Số điện thoại': '0977112233',
    'Công ty / Doanh nghiệp': 'Nội thất An Cường Miền Bắc',
    'Chức danh': 'Giám Đốc Điều Hành',
    'Trạng thái thanh toán': 'Đã thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Tất cả (Tọa đàm + Gala Party)',
    'Số ghế VIP': 'VIP-03',
    'Yêu cầu đặc biệt': 'Ăn chay'
  },
  {
    STT: 5,
    'Họ và tên': 'Hoàng Thu Trang',
    'Email': 'trang.hoang@hanoiba.org.vn',
    'Số điện thoại': '0936554433',
    'Công ty / Doanh nghiệp': 'Hội Doanh Nhân Trẻ Hà Nội (HanoiBA)',
    'Chức danh': 'Phó Ban Thư Ký',
    'Trạng thái thanh toán': 'Đã thanh toán',
    'Giá vé (VNĐ)': 0,
    'Phần tham gia': 'Tất cả (Tọa đàm + Gala Party)',
    'Số ghế VIP': 'VIP-04',
    'Yêu cầu đặc biệt': 'Ban Tổ Chức'
  },
  {
    STT: 6,
    'Họ và tên': 'Vũ Đức Thịnh',
    'Email': 'thinhvd@thinhphatcorp.vn',
    'Số điện thoại': '0918889999',
    'Công ty / Doanh nghiệp': 'Tập đoàn Thịnh Phát',
    'Chức danh': 'Chủ tịch HĐQT',
    'Trạng thái thanh toán': 'Chưa thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Tất cả (Tọa đàm + Gala Party)',
    'Số ghế VIP': 'VIP-05',
    'Yêu cầu đặc biệt': 'Không'
  },
  {
    STT: 7,
    'Họ và tên': 'Đặng Minh Châu',
    'Email': 'chaudm@goldenbank.vn',
    'Số điện thoại': '0982223344',
    'Công ty / Doanh nghiệp': 'Ngân hàng TMCP Kim Long',
    'Chức danh': 'Giám Đốc Khối KHDN',
    'Trạng thái thanh toán': 'Đã thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Chỉ Tiệc Gala Dinner',
    'Số ghế VIP': 'B-01',
    'Yêu cầu đặc biệt': 'Nhà tài trợ Bạc'
  },
  {
    STT: 8,
    'Họ và tên': 'Nguyễn Thanh Tùng',
    'Email': 'tungnt@saovietmedia.com',
    'Số điện thoại': '0945678910',
    'Công ty / Doanh nghiệp': 'Sao Việt Media & Event',
    'Chức danh': 'CEO & Founder',
    'Trạng thái thanh toán': 'Đã thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Tất cả (Tọa đàm + Gala Party)',
    'Số ghế VIP': 'B-02',
    'Yêu cầu đặc biệt': 'Bảo trợ truyền thông'
  },
  {
    STT: 9,
    'Họ và tên': 'Bùi Thị Bích Hạnh',
    'Email': 'hanhbtb@greenfarmvietnam.com',
    'Số điện thoại': '0966332211',
    'Công ty / Doanh nghiệp': 'Nông Nghiệp Hữu Cơ GreenFarm',
    'Chức danh': 'Giám Đốc',
    'Trạng thái thanh toán': 'Chưa thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Chỉ Tọa đàm / Hội thảo',
    'Số ghế VIP': 'B-03',
    'Yêu cầu đặc biệt': 'Ăn chay'
  },
  {
    STT: 10,
    'Họ và tên': 'Dương Tuấn Kiệt',
    'Email': 'kietdt@alphaarch.vn',
    'Số điện thoại': '0909123888',
    'Công ty / Doanh nghiệp': 'Kiến Trúc & Xây Dựng Alpha',
    'Chức danh': 'Phó Giám Đốc',
    'Trạng thái thanh toán': 'Đã thanh toán',
    'Giá vé (VNĐ)': 500000,
    'Phần tham gia': 'Tất cả (Tọa đàm + Gala Party)',
    'Số ghế VIP': 'B-04',
    'Yêu cầu đặc biệt': 'Không'
  }
];

const ws = XLSX.utils.json_to_sheet(attendeesData);

// Set độ rộng cột cho file Excel đẹp mắt
ws['!cols'] = [
  { wch: 6 },  // STT
  { wch: 24 }, // Họ và tên
  { wch: 30 }, // Email
  { wch: 15 }, // SĐT
  { wch: 34 }, // Công ty
  { wch: 22 }, // Chức danh
  { wch: 22 }, // Trạng thái thanh toán
  { wch: 16 }, // Giá vé
  { wch: 32 }, // Phần tham gia
  { wch: 15 }, // Số ghế VIP (Cột động)
  { wch: 24 }, // Yêu cầu đặc biệt (Cột động)
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'DanhSachDaiBieu');

const xlsxPath = path.join(testDataDir, 'danh_sach_tham_du_khai_giang_mau.xlsx');
XLSX.writeFile(wb, xlsxPath);
console.log(`  ✓ Đã tạo file Excel: ${xlsxPath}`);

// 2. Tạo tệp CSV danh sách tham dự (.csv)
const csvContent = [
  'STT,Họ và tên,Email,Số điện thoại,Công ty / Doanh nghiệp,Chức danh,Trạng thái thanh toán,Giá vé (VNĐ),Phần tham gia,Số ghế VIP,Yêu cầu đặc biệt',
  ...attendeesData.map(r => `"${r.STT}","${r['Họ và tên']}","${r.Email}","${r['Số điện thoại']}","${r['Công ty / Doanh nghiệp']}","${r['Chức danh']}","${r['Trạng thái thanh toán']}","${r['Giá vé (VNĐ)']}","${r['Phần tham gia']}","${r['Số ghế VIP']}","${r['Yêu cầu đặc biệt']}"`)
].join('\n');

const csvPath = path.join(testDataDir, 'danh_sach_tham_du_hoi_nghi_mau.csv');
fs.writeFileSync(csvPath, '\uFEFF' + csvContent, 'utf-8');
console.log(`  ✓ Đã tạo file CSV: ${csvPath}`);

// 3. Tạo tệp JSON chứa mã vé và payload QR mẫu
const sampleTickets = attendeesData.map((a, idx) => ({
  ticketCode: `TKT-TEST-${String(idx + 1).padStart(4, '0')}`,
  luckyNumber: String(100 + idx + 1),
  memberName: a['Họ và tên'],
  phone: a['Số điện thoại'],
  email: a.Email,
  company: a['Công ty / Doanh nghiệp'],
  ticketPrice: a['Giá vé (VNĐ)'],
  paymentStatus: a['Trạng thái thanh toán'] === 'Đã thanh toán' ? 'paid' : 'unpaid',
  seatAssignment: a['Số ghế VIP'],
  qrPayloadUrl: `https://ceohn10.viconnect.vn/event-checkin?ticket=TKT-TEST-${String(idx + 1).padStart(4, '0')}`
}));

const jsonPath = path.join(testDataDir, 'sample_tickets_qr_payloads.json');
fs.writeFileSync(jsonPath, JSON.stringify(sampleTickets, null, 2), 'utf-8');
console.log(`  ✓ Đã tạo file JSON vé mẫu: ${jsonPath}`);

console.log('\n✅ HOÀN TẤT KHỞI TẠO TỆP KIỂM THỬ THỰC TẾ!');
