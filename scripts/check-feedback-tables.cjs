const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project' } }
});

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'event_feedback'
  `);
  console.log("event_feedback columns:", cols);

  const fbCols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'feedbacks'
  `);
  console.log("feedbacks columns:", fbCols);
}
main().finally(() => prisma.$disconnect());
