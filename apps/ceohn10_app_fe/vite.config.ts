import { defineConfig } from '@lovable.dev/vite-tanstack-config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emptyMock = path.resolve(__dirname, 'src/mock-empty.js');

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        'xmlhttprequest-ssl': emptyMock,
        https: 'node:https',
        http: 'node:http',
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdf-lib')) {
                return 'vendor-pdf';
              }
              if (id.includes('xlsx') || id.includes('docx') || id.includes('pptxgenjs') || id.includes('exceljs')) {
                return 'vendor-docs';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@capacitor')) {
                return 'vendor-capacitor';
              }
            }
          },
        },
      },
    },
    ssr: {
      external: [
        'jspdf',
        'html2canvas',
        'html2canvas-pro',
        'docx',
        'exceljs',
        'pdf-lib',
        'pptxgenjs',
        'xlsx',
        '@capacitor/core',
        '@capacitor/android',
        '@capacitor/ios',
      ],
    },
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      watch: {
        ignored: [
          '**/.output/**',
          '**/.tanstack/**',
          '**/release_apk/**',
          '**/android/**',
          '**/ios/**',
          '**/.turbo/**',
          '**/*.log',
        ],
      },
      proxy: {
        '/upload': {
          target: 'http://127.0.0.1:4003',
          changeOrigin: true,
          rewrite: (path: string) => '/api' + path,
        },
        '/api': {
          target: 'http://127.0.0.1:4003',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://127.0.0.1:4003',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  },
});
