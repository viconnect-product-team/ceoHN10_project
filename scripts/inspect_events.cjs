const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project'
    }
  }
});

async function main() {
  const cols = await prisma.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='event_registrations' ORDER BY ordinal_position");
  console.log('Columns of event_registrations in local DB:', cols.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
