const { PrismaClient } = require("@ceohn10/db");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(
    "SELECT * FROM public.ceohn10_users LIMIT 5"
  );
  console.log("ceohn10_users rows:", users.map(u => ({ id: u.id, username: u.username, email: u.email, name: u.name })));
  await prisma.$disconnect();
}

main().catch(console.error);
