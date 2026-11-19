import { defineConfig } from "nitro/config";

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const emptyMock = path.resolve(__dirname, 'src/mock-empty.js');

// Bundle all dependencies into the server output instead of relying on
// @vercel/nft (nf3) dependency tracing, which fails with CommonJS
// compatibility errors on certain packages during the self-hosted Docker
// (node-server preset) build. Auto-loaded and merged by Nitro.
const isCrm = process.env.VITE_APP_SCOPE === 'crm_platform' || process.env.APP_SCOPE === 'crm_platform';
const defaultDockerBackend = isCrm ? 'http://ceohn10-crm-backend:4003' : 'http://ceohn10-backend:4003';
const backendTarget = process.env.NEST_API_URL || (process.env.NODE_ENV === 'production' ? defaultDockerBackend : 'http://127.0.0.1:4003');

export default defineConfig({
  noExternals: true,
  preset: 'node-server',
  sourcemap: false,
  minify: false,
  alias: {
    'xmlhttprequest-ssl': emptyMock,
    https: 'node:https',
    http: 'node:http',
  },
  routeRules: {
    '/api/**': { proxy: `${backendTarget}/api/**` },
    '/upload/**': { proxy: `${backendTarget}/api/upload/**` },
    '/api/upload/**': { proxy: `${backendTarget}/api/upload/**` },
    '/uploads/**': { proxy: `${backendTarget}/api/upload/**` },
  },
});
