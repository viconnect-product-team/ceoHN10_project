const fs = require('fs');
const path = require('path');
const { exportMarkdownToDocxFile } = require('./md_to_docx');
const { convertMarkdownToPdf } = require('./md_to_pdf');

const docs = [
  {
    name: 'BRD_HE_THONG_CEOHN10',
    title: 'TÀI LIỆU YÊU CẦU NGHIỆP VỤ HỆ THỐNG CEO HN10 (BRD)'
  },
  {
    name: 'SRS_HE_THONG_CEOHN10',
    title: 'ĐẶC TẢ YÊU CẦU PHẦN MỀM HỆ THỐNG CEO HN10 (SRS IEEE 830)'
  },
  {
    name: 'THIET_KE_CSDL_POSTGRESQL_CEOHN10',
    title: 'THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL HỆ THỐNG CEO HN10'
  },
  {
    name: 'THIET_KE_RESTFUL_API_CEOHN10',
    title: 'ĐẶC TẢ GIAO DIỆN LẬP TRÌNH RESTFUL API HỆ THỐNG CEO HN10'
  }
];

const publicDocsDir = path.join(__dirname, '..', 'apps', 'ceohn10_app_fe', 'public', 'docs');
if (!fs.existsSync(publicDocsDir)) {
  fs.mkdirSync(publicDocsDir, { recursive: true });
}

async function run() {
  console.log('=== BẮT ĐẦU KẾT XUẤT TOÀN BỘ ĐỊNH DẠNG WORD (.DOCX) & PDF (.PDF) ===');
  
  for (const doc of docs) {
    const mdPath = path.join(__dirname, `${doc.name}.md`);
    const docxPath = path.join(__dirname, `${doc.name}.docx`);
    const pdfPath = path.join(__dirname, `${doc.name}.pdf`);
    
    console.log(`\n--- Đang xử lý: ${doc.name} ---`);
    
    // 1. Export DOCX
    await exportMarkdownToDocxFile(mdPath, docxPath, doc.title);
    // Copy to public/docs
    const publicDocxPath = path.join(publicDocsDir, `${doc.name}.docx`);
    fs.copyFileSync(docxPath, publicDocxPath);
    console.log(`Copied DOCX -> ${publicDocxPath}`);

    // 2. Export PDF
    const mdContent = fs.readFileSync(mdPath, 'utf8');
    convertMarkdownToPdf(mdContent, pdfPath, doc.title);
    // Copy to public/docs
    const publicPdfPath = path.join(publicDocsDir, `${doc.name}.pdf`);
    fs.copyFileSync(pdfPath, publicPdfPath);
    console.log(`Copied PDF -> ${publicPdfPath}`);
  }

  console.log('\n=== HOÀN TẤT KẾT XUẤT 100% CÁC ĐỊNH DẠNG WORD (.DOCX) & PDF (.PDF) ===');
}

run().catch(err => {
  console.error('Lỗi kết xuất tài liệu:', err);
  process.exit(1);
});
