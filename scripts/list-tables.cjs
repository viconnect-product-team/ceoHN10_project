const { PrismaClient } = require("@ceohn10/db");
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  console.log("ALL TABLES IN DATABASE:", tables.map(t => t.table_name));
  await prisma.$disconnect();
}

main().catch(console.error);
