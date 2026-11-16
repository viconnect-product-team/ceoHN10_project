const fs = require('fs');
const path = require('path');
const { Packer } = require('docx');

const { buildDoc1 } = require('./doc1_web_crm_ceohn10');
const { buildDoc2 } = require('./doc2_app_hiep_hoi_ceohn10');
const { buildDoc3 } = require('./doc3_app_vione_connect');
const { buildDoc4 } = require('./doc4_web_crm_vione');

// Output target directories
const TARGET_DIRS = [
  path.resolve(__dirname, '../document'),
  path.resolve(__dirname, '../../ceohn10_project/document'),
  path.resolve(__dirname, '../apps/vione_app_fe/public/docs'),
  path.resolve(__dirname, '../../ceohn10_project/apps/ceohn10_app_fe/public/docs'),
];

TARGET_DIRS.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function saveFile(filename, content, isBinary = false) {
  for (const dir of TARGET_DIRS) {
    const fullPath = path.join(dir, filename);
    if (isBinary) {
      fs.writeFileSync(fullPath, content);
    } else {
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

async function main() {
  console.log('=== BẮT ĐẦU XUẤT BẢN 4 BỘ TÀI LIỆU SRS VÀ CSDL (DOCX & MD) ===\n');

  const docs = [
    {
      id: '01',
      name: 'SRS_01_Web_CRM_CEOHN10',
      builder: buildDoc1,
      title: 'Tài Liệu 1: Web CRM CEO HN10'
    },
    {
      id: '02',
      name: 'SRS_02_App_Hiep_Hoi_CEOHN10',
      builder: buildDoc2,
      title: 'Tài Liệu 2: App Hiệp Hội CEO HN10'
    },
    {
      id: '03',
      name: 'SRS_03_App_ViOne_Connect',
      builder: buildDoc3,
      title: 'Tài Liệu 3: App ViOne Connect'
    },
    {
      id: '04',
      name: 'SRS_04_Web_CRM_ViOne',
      builder: buildDoc4,
      title: 'Tài Liệu 4: Web CRM ViOne Enterprise'
    }
  ];

  for (const item of docs) {
    console.log(`[Đang xử lý] ${item.title}...`);
    const { doc, mdContent } = item.builder();

    // 1. Pack and save DOCX
    const buffer = await Packer.toBuffer(doc);
    await saveFile(`${item.name}.docx`, buffer, true);
    console.log(`  -> Đã lưu Word: ${item.name}.docx (${buffer.length} bytes)`);

    // 2. Save Markdown
    await saveFile(`${item.name}.md`, mdContent, false);
    console.log(`  -> Đã lưu Markdown: ${item.name}.md (${Buffer.byteLength(mdContent, 'utf8')} bytes)`);
  }

  console.log('\n=== TẤT CẢ 4 BỘ TÀI LIỆU ĐÃ ĐƯỢC XUẤT BẢN THÀNH CÔNG 100%! ===');
}

main().catch(err => {
  console.error('Lỗi khi xuất bản tài liệu:', err);
  process.exit(1);
});
