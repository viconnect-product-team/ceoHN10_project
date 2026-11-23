const { PrismaClient } = require("@ceohn10/db");
const prisma = new PrismaClient();

async function main() {
  const vione = await prisma.$queryRawUnsafe(
    "SELECT id, username, email, password FROM public.vione_users WHERE username IN ('admin@connect.vn', 'admin@ceohn10.vn')"
  );
  console.log("PASSWORDS:", vione.map(u => ({ username: u.username, passPrefix: u.password ? u.password.slice(0, 10) : 'null' })));
  await prisma.$disconnect();
}

main().catch(console.error);
