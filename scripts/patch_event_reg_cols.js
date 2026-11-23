const { PrismaClient } = require('@ceohn10/db');
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.event_registrations 
    ADD COLUMN IF NOT EXISTS is_walkin boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS registration_origin text DEFAULT 'pre_registered_import',
    ADD COLUMN IF NOT EXISTS dynamic_data jsonb DEFAULT '{}'::jsonb;
  `);
  console.log('✓ Successfully added missing columns to event_registrations!');
  await prisma.$disconnect();
}
main().catch(console.error);
