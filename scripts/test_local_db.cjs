const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project"
    }
  }
});

async function main() {
  try {
    const res = await prisma.$queryRawUnsafe("SELECT current_database(), now()");
    console.log("✅ LOCAL DATABASE CONNECTED:", res);
    const eventCount = await prisma.events.count();
    console.log("Current event count in local DB:", eventCount);
  } catch (err) {
    console.error("❌ LOCAL DB ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
