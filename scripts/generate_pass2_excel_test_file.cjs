const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const outDir = path.resolve(__dirname, "../test-data/events");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const data = [
  {
    "STT": 1,
    "Họ và tên": "Phạm Văn Vũ",
    "Email": "vumikasa6@gmail.com",
    "Số điện thoại": "0988112233",
    "Công ty": "Viconnect Vietnam",
    "Chức vụ": "Giám đốc điều hành",
    "Trạng thái thanh toán": "Đã thanh toán",
    "Số tiền": 500000,
    "Ghi chú": "Đại biểu VIP - Đã thanh toán"
  },
  {
    "STT": 2,
    "Họ và tên": "Vũ Phạm",
    "Email": "vupv090120@gmail.com",
    "Số điện thoại": "0977223344",
    "Công ty": "CEO HN10 Group",
    "Chức vụ": "Phó Chủ tịch",
    "Trạng thái thanh toán": "Chưa thanh toán",
    "Số tiền": 500000,
    "Ghi chú": "Chưa thanh toán - Cần nhận hướng dẫn VietQR"
  }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachDaiBieu");

const outPath = path.join(outDir, "danh_sach_dai_bieu_pass2.xlsx");
XLSX.writeFile(workbook, outPath);

console.log("✅ Đã tạo file Excel test pass 2 thành công tại:", outPath);
