const { PrismaClient } = require('@ceohn10/db');
const prisma = new PrismaClient();
async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'event_registrations'
  `);
  console.log('Columns in event_registrations:', cols.map(c => c.column_name));
  await prisma.$disconnect();
}
main().catch(console.error);
