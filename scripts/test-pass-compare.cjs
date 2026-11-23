const bcrypt = require("bcrypt");
const { PrismaClient } = require("@ceohn10/db");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(
    "SELECT id, username, email, password FROM public.vione_users WHERE username IN ('admin@connect.vn', 'admin@ceohn10.vn')"
  );
  const candidates = ["admin123", "123456", "123456a@", "Admin@123", "viconnect123", "ceohn10", "12345678"];
  for (const u of users) {
    console.log(`Testing user ${u.username}:`);
    for (const c of candidates) {
      const match = await bcrypt.compare(c, u.password).catch(() => false);
      if (match) {
        console.log(`  >>> FOUND PASSWORD FOR ${u.username}: "${c}"`);
      }
    }
  }
  await prisma.$disconnect();
}

main().catch(console.error);
