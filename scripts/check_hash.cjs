const bcrypt = require('bcrypt');

const hash = '$2b$10$FLMpymq2ujbhVinusol9XuMc5pjTY97IZNrT0b9UAmzRtMoKrXHbu';
const passes = ['123456a@', '123456', 'admin123', 'admin', 'Admin@123', 'admini123', 'Connect@123', 'viconnect123', '12345678'];

for (const p of passes) {
  if (bcrypt.compareSync(p, hash)) {
    console.log('FOUND MATCH for hash:', p);
    process.exit(0);
  }
}
console.log('No match found in candidates');
