const { PrismaClient } = require("@ceohn10/db");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(
    "SELECT id, username, email, name, role FROM public.users LIMIT 20"
  ).catch(err => {
    console.error("Query err:", err.message);
    return [];
  });
  console.log("Found users in DB:", users);
  await prisma.$disconnect();
}

main().catch(console.error);
