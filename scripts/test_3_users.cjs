const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });
    const req = https.request({
      hostname: '14.225.217.232',
      port: 10443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Origin': 'https://14.225.217.232:10443'
      },
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
    req.write(data);
    req.end();
  });
}

async function main() {
  const users = [
    { email: 'admini@connect.vn', pass: '123456a@' },
    { email: 'vupv090120@gmail.com', pass: '123456' },
    { email: 'vumikasa6@gmail.com', pass: '123456' }
  ];

  for (const u of users) {
    const res = await testLogin(u.email, u.pass);
    console.log(`[LOGIN TEST] ${u.email}: status=${res.status} | User:`, res.data?.user?.email || res.data?.message);
  }
}

main();
