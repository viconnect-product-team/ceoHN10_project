const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

function requestApi(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'Origin': 'https://14.225.217.232:10443',
    };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request({
      hostname: '14.225.217.232',
      port: 10443,
      path: `/api${path}`,
      method,
      headers,
      agent
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function probe() {
  console.log('1. Đăng nhập admini@connect.vn...');
  const loginRes = await requestApi('POST', '/auth/login', { email: 'admini@connect.vn', password: '123456a@' });
  const token = loginRes.data?.access_token;
  console.log('Token received:', token ? 'YES' : 'NO', 'User:', loginRes.data?.user?.email);

  if (!token) return;

  const endpoints = [
    { method: 'GET', path: '/events' },
    { method: 'GET', path: '/trainings' },
    { method: 'GET', path: '/admin/feedbacks' },
    { method: 'GET', path: '/documents' },
    { method: 'GET', path: '/tasks' },
    { method: 'GET', path: '/admin/transactions' },
    { method: 'GET', path: '/notifications' },
  ];

  for (const ep of endpoints) {
    const res = await requestApi(ep.method, ep.path, null, token);
    console.log(`Endpoint ${ep.method} /api${ep.path}: status=${res.status}, items count=${Array.isArray(res.data) ? res.data.length : (res.data?.items?.length ?? 'object')}`);
  }
}

probe().catch(console.error);
