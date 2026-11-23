const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRaw`
    SELECT id, username, email, name, role
    FROM public.users
    WHERE email ILIKE '%admin%' OR username ILIKE '%admin%'
    LIMIT 10
  `.catch(async () => {
    return prisma.$queryRaw`SELECT id, username, email FROM public.users LIMIT 10`;
  });
  console.log("Found admin users:", users);
  await prisma.$disconnect();
}

main().catch(console.error);
