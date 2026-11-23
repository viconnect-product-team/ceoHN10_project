const { PrismaClient } = require("@ceohn10/db");
const prisma = new PrismaClient();

async function main() {
  const vione = await prisma.$queryRawUnsafe(
    "SELECT id, username, email, name FROM public.vione_users WHERE email ILIKE '%admin%' OR username ILIKE '%admin%' LIMIT 10"
  );
  console.log("ADMINS IN vione_users:", vione);
  await prisma.$disconnect();
}

main().catch(console.error);
