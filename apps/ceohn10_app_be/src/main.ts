import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

function loadEnvFile(envPath: string) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = (match[2] || '').trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

// Load root .env
loadEnvFile(path.join(__dirname, '../../../../.env'));
loadEnvFile(path.join(process.cwd(), '.env'));

function probeTcp(
  host: string,
  port: number,
  timeoutMs = 1200,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const cleanup = (result: boolean) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => cleanup(true));
    socket.once('timeout', () => cleanup(false));
    socket.once('error', () => cleanup(false));
    try {
      socket.connect(port, host);
    } catch {
      cleanup(false);
    }
  });
}

async function resolveDatabaseConfig() {
  const remoteDbUrl =
    'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?pgbouncer=true';
  const localDbUrl =
    'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project';

  // Nếu trong .env có DATABASE_URL trỏ vào localhost/127.0.0.1 thì giữ nguyên để chạy offline local thuần
  if (
    process.env.DATABASE_URL &&
    (process.env.DATABASE_URL.includes('127.0.0.1') || process.env.DATABASE_URL.includes('localhost'))
  ) {
    // Giữ nguyên database localhost
  } else if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = localDbUrl;
  }

  const isLocal =
    process.env.DATABASE_URL?.includes('127.0.0.1') ||
    process.env.DATABASE_URL?.includes('localhost');

  console.log(
    '\x1b[32m%s\x1b[0m',
    '================================================================',
  );
  console.log(
    '\x1b[32m%s\x1b[0m',
    `✅ [Database Engine] Đang chạy với CSDL: ${isLocal ? 'Localhost 127.0.0.1:5432 (Local Offline)' : '113.20.107.184:6432 (Server Remote)'}`,
  );
  console.log(
    '\x1b[32m%s\x1b[0m',
    '================================================================',
  );
}

import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { createVietnameseValidationPipe } from './common/pipes/validation.pipe';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';
import { QuerySanitizerMiddleware } from './common/middleware/query-sanitizer.middleware';
import { PayloadGuardMiddleware } from './common/middleware/payload-guard.middleware';

async function bootstrap() {
  await resolveDatabaseConfig();
  const app = await NestFactory.create(AppModule);
  // VULN-15 Fix: Giảm tải trọng JSON từ 50MB xuống 15MB để ngăn ngừa tấn công DoS
  // Lớp 4 Zero-Trust: Giới hạn kích thước Payload Stream <= 10MB (OS-SEC-ZERO-TRUST-47)
  const payloadGuard = new PayloadGuardMiddleware();
  app.use(payloadGuard.use.bind(payloadGuard));

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Lớp 3 Zero-Trust: Rate Limiter Middleware (600 req/min, Brute-Force lockout 15 fails/min)
  const rateLimiter = new RateLimiterMiddleware();
  app.use(rateLimiter.use.bind(rateLimiter));

  // Lớp 6 Zero-Trust: SQLi Query Identifier Sanitizer
  const querySanitizer = new QuerySanitizerMiddleware();
  app.use(querySanitizer.use.bind(querySanitizer));

  // Security Headers Middleware (OWASP Standard)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    if (
      req.url &&
      (req.url.includes('/auth/') || req.url.includes('/api/auth/'))
    ) {
      res.setHeader('Cache-Control', 'no-store');
    }
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=*, microphone=(), geolocation=*',
    );
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://appleid.apple.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'self'",
    );
    next();
  });

  app.setGlobalPrefix('api', {
    exclude: ['share', 'share/(.*)', 'api/share', 'api/share/(.*)'],
  });
  // VULN-11 Fix: Khóa chặt chính sách CORS Whitelist theo các tên miền chính thức, ngăn ngừa CSRF & rò rỉ dữ liệu
  const isDev = process.env.NODE_ENV !== 'production';
  const allowedOrigins = [
    'https://ceohn10.viconnect.vn',
    'https://crm.ceohn10.viconnect.vn',
    'https://crm_ceohn10.viconnect.vn',
    'https://14.225.217.232:10443',
    'https://14.225.217.232:10444',
    'https://14.225.217.232:10445',
    'http://localhost:3000',
    'http://localhost:5137',
    'http://localhost:5173',
    'http://localhost:5003',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5137',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5003',
    'http://127.0.0.1:8080',
    'capacitor://localhost',
  ];
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.viconnect.vn') ||
        (isDev && (origin.includes('localhost') || origin.includes('127.0.0.1')))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Chặn bởi chính sách an ninh CORS của CEO HN10'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Đăng ký bộ chuẩn hóa Validate và Bắt lỗi tiếng Việt toàn cục
  app.useGlobalPipes(createVietnameseValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4003;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}/api`);
}
void bootstrap();
