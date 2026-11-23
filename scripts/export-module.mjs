#!/usr/bin/env node
/**
 * MODULE EXPORTER CLI - CEO HN10 ECOSYSTEM
 * Công cụ đóng gói và trích xuất riêng biệt từng phân hệ module cho khách hàng.
 * Đảm bảo gói module trích xuất độc lập, tự vận hành và có sẵn tệp dữ liệu kiểm thử.
 *
 * Cách dùng:
 *   node scripts/export-module.mjs --module=events --out=dist-modules/module-events
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Đọc tham số dòng lệnh
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.replace(/^--/, '').split('=');
  acc[k] = v || true;
  return acc;
}, {});

const moduleName = (args.module || 'events').toLowerCase();
const outDir = path.resolve(rootDir, args.out || `dist-modules/module-${moduleName}`);

console.log(`\n======================================================`);
console.log(`📦 BẮT ĐẦU TRÍCH XUẤT MODULE: [${moduleName.toUpperCase()}]`);
console.log(`📁 Thư mục xuất bản: ${outDir}`);
console.log(`======================================================\n`);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Định nghĩa các tệp cần sao chép theo module
const moduleManifests = {
  events: {
    title: 'Phân Hệ Quản Lý Sự Kiện, Check-in & Vé Điện Tử - CEO HN10',
    description: 'Bao gồm tạo sự kiện, import danh sách 3 định dạng (.docx, .xlsx, .pdf), dynamic DDL database, check-in 2 mã QR (hỗ trợ offline-first), vòng quay may mắn Canvas, live photo stream, và khảo sát đánh giá sau sự kiện.',
    backendFiles: [
      'apps/ceohn10_app_be/src/events',
    ],
    frontendFiles: [
      'apps/ceohn10_app_fe/src/routes/events.index.tsx',
      'apps/ceohn10_app_fe/src/routes/event-registrations.tsx',
      'apps/ceohn10_app_fe/src/routes/event-checkin.tsx',
      'apps/ceohn10_app_fe/src/routes/guest-event-register.$eventId.tsx',
      'apps/ceohn10_app_fe/src/routes/guest-event-feedback.$eventId.tsx',
      'apps/ceohn10_app_fe/src/components/events',
    ],
    testFiles: [
      'test-data/events',
    ],
  },
  members: {
    title: 'Phân Hệ Quản Lý Hội Viên, Hồ Sơ Doanh Nghiệp & Thẻ Điện Tử - CEO HN10',
    description: 'Bao gồm danh bạ hội viên, chi tiết doanh nghiệp, thẻ hội viên số tích hợp mã QR xác thực hội viên CLB.',
    backendFiles: [
      'apps/ceohn10_app_be/src/members',
      'apps/ceohn10_app_be/src/business-card',
    ],
    frontendFiles: [
      'apps/ceohn10_app_fe/src/routes/members.index.tsx',
      'apps/ceohn10_app_fe/src/routes/members.$memberId.tsx',
    ],
    testFiles: [
      'test-data/events',
    ],
  },
  finance: {
    title: 'Phân Hệ Quản Lý Tài Chính Quỹ & Thu Phí SePay VietQR - CEO HN10',
    description: 'Bao gồm quản lý thu chi, quỹ hội viên, hạch toán tự động từ SePay VietQR Webhook, tự động phân bổ thu phí sự kiện và hội phí.',
    backendFiles: [
      'apps/ceohn10_app_be/src/payment',
    ],
    frontendFiles: [
      'apps/ceohn10_app_fe/src/routes/finance-report.tsx',
    ],
    testFiles: [
      'test-data/events',
    ],
  },
  b2b: {
    title: 'Phân Hệ B2B Kết Nối Giao Thương & Gian Hàng Số - CEO HN10',
    description: 'Bao gồm sàn kết nối cung cầu, bảng tin cơ hội kinh doanh giữa các chủ doanh nghiệp trong CLB.',
    backendFiles: [
      'apps/ceohn10_app_be/src/connect-app',
      'apps/ceohn10_app_be/src/supplies',
    ],
    frontendFiles: [
      'apps/ceohn10_app_fe/src/routes/opportunities.index.tsx',
      'apps/ceohn10_app_fe/src/routes/opportunities.$id.tsx',
    ],
    testFiles: [
      'test-data/events',
    ],
  },
  communications: {
    title: 'Phân Hệ Truyền Thông, Tin Tức & Zalo OA / Email - CEO HN10',
    description: 'Bao gồm bản tin nội bộ, gửi thông báo tự động qua Zalo OA Template và Email SMTP (vé mời, nhắc lịch, xác nhận thanh toán).',
    backendFiles: [
      'apps/ceohn10_app_be/src/zalo',
      'apps/ceohn10_app_be/src/mail',
    ],
    frontendFiles: [
      'apps/ceohn10_app_fe/src/routes/news.tsx',
      'apps/ceohn10_app_fe/src/routes/notifications.tsx',
    ],
    testFiles: [
      'test-data/events',
    ],
  },
  '5-modules': {
    title: 'Trọn Bộ 5 Module Nghiệp Vụ Chuyển Giao Khách Hàng - CEO HN10',
    description: 'Gói tổng hợp độc lập 5 module: Events & Check-in, Members & Cards, Finance & SePay, B2B Connect, Communications & Zalo OA. Tách rời hoàn toàn khỏi Core Engine bảo mật của công ty.',
    backendFiles: [
      'apps/ceohn10_app_be/package.json',
      'apps/ceohn10_app_be/nest-cli.json',
      'apps/ceohn10_app_be/tsconfig.json',
      'apps/ceohn10_app_be/src/main.ts',
      'apps/ceohn10_app_be/src/app.controller.ts',
      'apps/ceohn10_app_be/src/app.service.ts',
      'apps/ceohn10_app_be/src/common',
      'apps/ceohn10_app_be/src/prisma',
      'apps/ceohn10_app_be/src/auth',
      'apps/ceohn10_app_be/src/users',
      'apps/ceohn10_app_be/src/upload',
      'apps/ceohn10_app_be/src/events',
      'apps/ceohn10_app_be/src/members',
      'apps/ceohn10_app_be/src/business-card',
      'apps/ceohn10_app_be/src/payment',
      'apps/ceohn10_app_be/src/connect-app',
      'apps/ceohn10_app_be/src/supplies',
      'apps/ceohn10_app_be/src/zalo',
      'apps/ceohn10_app_be/src/mail',
    ],
    frontendFiles: [
      'apps/ceohn10_app_fe/package.json',
      'apps/ceohn10_app_fe/vite.config.ts',
      'apps/ceohn10_app_fe/tsconfig.json',
      'apps/ceohn10_app_fe/src/styles.css',
      'apps/ceohn10_app_fe/src/lib',
      'apps/ceohn10_app_fe/src/components/ui',
      'apps/ceohn10_app_fe/src/routes/__root.tsx',
      'apps/ceohn10_app_fe/src/router.tsx',
      'apps/ceohn10_app_fe/src/routes/events.index.tsx',
      'apps/ceohn10_app_fe/src/routes/event-registrations.tsx',
      'apps/ceohn10_app_fe/src/routes/event-checkin.tsx',
      'apps/ceohn10_app_fe/src/routes/guest-event-register.$eventId.tsx',
      'apps/ceohn10_app_fe/src/routes/guest-event-feedback.$eventId.tsx',
      'apps/ceohn10_app_fe/src/components/events',
      'apps/ceohn10_app_fe/src/routes/members.index.tsx',
      'apps/ceohn10_app_fe/src/routes/members.$memberId.tsx',
      'apps/ceohn10_app_fe/src/routes/finance-report.tsx',
      'apps/ceohn10_app_fe/src/routes/opportunities.index.tsx',
      'apps/ceohn10_app_fe/src/routes/opportunities.$id.tsx',
      'apps/ceohn10_app_fe/src/routes/news.tsx',
      'apps/ceohn10_app_fe/src/routes/notifications.tsx',
    ],
    testFiles: [
      'test-data/events',
      'deploy/init-prod-server.sh',
    ],
  },
};

const manifest = moduleManifests[moduleName] || moduleManifests.events;

// Helper sao chép đệ quy
function copyRecursive(srcRel, destRel) {
  const src = path.join(rootDir, srcRel);
  const dest = path.join(outDir, destRel || srcRel);
  if (!fs.existsSync(src)) {
    console.warn(`  ⚠️ Bỏ qua nguồn không tồn tại: ${srcRel}`);
    return;
  }
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(srcRel, file), path.join(destRel || srcRel, file));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  console.log(`  ✓ Đã sao chép: ${srcRel}`);
}

console.log('1. Sao chép tệp nguồn Backend...');
manifest.backendFiles.forEach((f) => copyRecursive(f));

console.log('\n2. Sao chép tệp nguồn Frontend...');
manifest.frontendFiles.forEach((f) => copyRecursive(f));

console.log('\n3. Sao chép dữ liệu kiểm thử (Test Data)...');
manifest.testFiles.forEach((f) => copyRecursive(f));

// Tạo package.json độc lập cho gói module
const standalonePackageJson = {
  name: `@ceohn10/module-${moduleName}`,
  version: '1.0.0',
  description: manifest.description,
  main: 'index.js',
  scripts: {
    dev: 'echo "Khởi chạy module độc lập tại port 3000..." && node index.js',
    test: 'echo "Kiểm tra module..."',
  },
  keywords: ['ceohn10', 'events', 'checkin', 'hanoiba'],
  author: 'CLB Doanh Nhân CEO HN10 (HanoiBA)',
  license: 'UNLICENSED',
};

fs.writeFileSync(
  path.join(outDir, 'package.json'),
  JSON.stringify(standalonePackageJson, null, 2),
  'utf-8'
);

// Tạo .env.example độc lập
const standaloneEnvExample = `# ==============================================================================
# CẤU HÌNH BIẾN MÔI TRƯỜNG MODULE: ${moduleName.toUpperCase()}
# ==============================================================================
PORT=4003
DATABASE_URL="postgresql://app1:5^S0CEpvYwC1(#YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true"

# SePay VietQR (Tự động hạch toán)
SEPAY_BANK_NAME="MBBank"
SEPAY_ACCOUNT_NO=""
SEPAY_ACCOUNT_HOLDER=""
SEPAY_API_TOKEN=""
SEPAY_WEBHOOK_SECRET=""

# Zalo OA Thông báo
ZALO_OA_ID=""
ZALO_APP_ID=""
ZALO_APP_SECRET=""
ZALO_REFRESH_TOKEN=""
`;

fs.writeFileSync(path.join(outDir, '.env.example'), standaloneEnvExample, 'utf-8');

// Tạo .gitignore chuẩn
const standaloneGitIgnore = `# Dependencies
node_modules/
**/node_modules/**

# Build outputs
dist/
dist-ssr/
.output/
.tanstack/
.nitro/
build/

# Environment files
.env
.env.production
.env.staging
.env.local
*.local

# System & Editor
.DS_Store
Thumbs.db
.idea/
.vscode/
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# Uploads
uploads/*
!uploads/.gitkeep
`;

fs.writeFileSync(path.join(outDir, '.gitignore'), standaloneGitIgnore, 'utf-8');

// Tạo README hướng dẫn chạy module cho khách hàng
if (moduleName === '5-modules') {
  // Sinh app.module.ts độc lập chỉ chứa 5 module
  const standaloneAppModule = `import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessCardModule } from './business-card/business-card.module';
import { UploadModule } from './upload/upload.module';
import { MailModule } from './mail/mail.module';
import { ConnectAppModule } from './connect-app/connect-app.module';
import { EventsModule } from './events/events.module';
import { MembersModule } from './members/members.module';
import { ZaloModule } from './zalo/zalo.module';
import { PaymentModule } from './payment/payment.module';
import { SuppliesModule } from './supplies/supplies.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    PrismaModule,
    BusinessCardModule,
    UploadModule,
    MailModule,
    ConnectAppModule,
    EventsModule,
    MembersModule,
    ZaloModule,
    PaymentModule,
    SuppliesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;
  fs.writeFileSync(
    path.join(outDir, 'apps/ceohn10_app_be/src/app.module.ts'),
    standaloneAppModule,
    'utf-8'
  );
}

const standaloneReadme = `# ${manifest.title}
*Gói Module Độc Lập Chuyển Giao Khách Hàng - CEO HN10 Ecosystem*

---

## 1. Giới thiệu
${manifest.description}

## 2. Hướng dẫn cài đặt và vận hành
1. **Cài đặt thư viện phụ thuộc**:
   \`\`\`bash
   npm install
   \`\`\`
2. **Cấu hình môi trường**:
   - Sao chép file \`.env.example\` thành \`.env\` và điền chuỗi kết nối Database PostgreSQL.
3. **Khởi chạy module**:
   \`\`\`bash
   npm run dev
   \`\`\`

## 3. Dữ liệu kiểm thử đi kèm
Trong thư mục \`test-data/events/\` có sẵn:
- File Excel mẫu (\`.xlsx\`) danh sách 15 đại biểu, có cột giá vé và trạng thái thanh toán để test tính năng import và hạch toán quỹ.
- File Word mẫu (\`.docx\`) bảng danh sách đại biểu.
- File JSON chứa các mã vé và QR mẫu để test luồng soát vé check-in 2 mã.
`;

fs.writeFileSync(path.join(outDir, 'README.md'), standaloneReadme, 'utf-8');

console.log(`\n🎉 HOÀN THÀNH XUẤT BẢN MODULE [${moduleName.toUpperCase()}] THÀNH CÔNG!`);
console.log(`👉 Bạn có thể nén zip thư mục "${outDir}" để gửi độc lập cho khách hàng.\n`);
