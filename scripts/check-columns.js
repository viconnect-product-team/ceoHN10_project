const { PrismaClient } = require('@ceohn10/db');
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_profiles', 'memberships', 'members')
  `);
  console.log('Columns matching:', cols.map(c => c.table_name + '.' + c.column_name));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
