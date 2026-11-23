const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@127.0.0.1:5432/ceohn10_project'
    }
  }
});

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.event_registrations 
    ADD COLUMN IF NOT EXISTS lucky_number text,
    ADD COLUMN IF NOT EXISTS qr_payload text,
    ADD COLUMN IF NOT EXISTS ticket_count integer DEFAULT 1,
    ADD COLUMN IF NOT EXISTS position text;
  `);
  console.log('✓ Successfully added lucky_number, qr_payload, ticket_count, position to event_registrations!');
  
  // Kiểm tra cột bảng event_feedback
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.event_feedback (
      id text PRIMARY KEY,
      event_id text,
      member_name text,
      member_phone text,
      member_email text,
      rating integer DEFAULT 5,
      comment text,
      content text,
      feedback_text text,
      status text DEFAULT 'approved',
      created_at timestamptz DEFAULT now()
    );
  `);
  console.log('✓ Successfully verified event_feedback table!');
  
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
