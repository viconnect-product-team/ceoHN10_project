const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project"
    }
  }
});

async function main() {
  const uCols = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
  );
  console.log("users cols:", uCols.map(c => c.column_name));

  const hash = await bcrypt.hash("123456", 10);
  
  await prisma.$executeRawUnsafe(`
    INSERT INTO public.vione_users (id, username, email, password, name)
    VALUES (
      '00000000-0000-4000-8000-000000000002'::uuid,
      'admin@connect.vn',
      'admin@viconnect.vn',
      '${hash}',
      'Administrator'
    )
    ON CONFLICT (id) DO UPDATE SET password = '${hash}';
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO public.vione_users (id, username, email, password, name)
    VALUES (
      '00000000-0000-4000-8000-000000000003'::uuid,
      'admin.hn10@ceohn10.vn',
      'admin.hn10@ceohn10.vn',
      '${hash}',
      'Admin Platform CEO HN10'
    )
    ON CONFLICT (id) DO UPDATE SET password = '${hash}';
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO public.users (id, email, username, name, role)
    VALUES (
      '00000000-0000-4000-8000-000000000002'::uuid,
      'admin@viconnect.vn',
      'admin@connect.vn',
      'Administrator',
      'admin'
    )
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  `);

  console.log("✅ Admin user upserted with password '123456'!");

  const events = await prisma.$queryRawUnsafe("SELECT id, name, date, ticket_price, fee, capacity, registered, status FROM public.events");
  console.log("EVENTS IN DB:", events);

  await prisma.$disconnect();
}

main().catch(console.error);
