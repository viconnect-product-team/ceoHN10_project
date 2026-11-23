const http = require('http');

const req = http.request({
  hostname: '127.0.0.1',
  port: 4003,
  path: '/api/admin/feedbacks',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.slice(0, 500));
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.end();
