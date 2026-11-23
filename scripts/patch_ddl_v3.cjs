const { Client } = require('pg');

async function main() {
  const c = new Client({ connectionString: 'postgresql://postgres:postgres@127.0.0.1:5432/ceohn10_project' });
  await c.connect();

  console.log('--- 1. Creating public.documents table ---');
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.documents (
      id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
      code text UNIQUE,
      name text NOT NULL,
      title text,
      category text DEFAULT 'Tài liệu chung',
      size text DEFAULT '0 KB',
      uploaded_by text DEFAULT 'Ban Tổ Chức',
      type text DEFAULT 'file',
      file_path text,
      file_url text,
      drive_url text,
      folder_id text,
      is_folder boolean DEFAULT false,
      share_scope text DEFAULT 'public',
      share_role text DEFAULT 'viewer',
      shared_with jsonb DEFAULT '[]'::jsonb,
      is_starred boolean DEFAULT false,
      color_tag text,
      description text,
      doc_scope text DEFAULT 'association',
      enterprise_name text,
      event_id text,
      association_id uuid,
      uploaded_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  `);
  console.log('✅ Created public.documents table successfully');

  console.log('--- 2. Updating public.event_feedback columns ---');
  await c.query(`
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS member_name text DEFAULT 'Đại biểu ẩn danh';
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS member_phone text;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS member_email text;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS content text;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS feedback_text text;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS member_code text;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS recommend_score integer;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS topic_suggestions text;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS attachment_url text;
    ALTER TABLE public.event_feedback ADD COLUMN IF NOT EXISTS status text DEFAULT 'received';
  `);
  console.log('✅ Updated public.event_feedback columns');

  console.log('--- 3. Creating VIEW public.event_feedbacks ---');
  await c.query(`
    CREATE OR REPLACE VIEW public.event_feedbacks AS
    SELECT id, event_id, member_name, member_code, member_phone, member_email, rating,
           COALESCE(content, feedback_text) as content,
           COALESCE(feedback_text, content) as feedback_text,
           recommend_score, topic_suggestions, attachment_url, status, created_at
    FROM public.event_feedback;
  `);
  console.log('✅ Created VIEW public.event_feedbacks');

  console.log('--- 4. Checking public.event_photos ---');
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.event_photos (
      id text PRIMARY KEY,
      event_id text NOT NULL,
      photo_url text NOT NULL,
      caption text,
      uploaded_by text DEFAULT 'Ban Tổ Chức',
      created_at timestamptz DEFAULT now()
    );
  `);
  console.log('✅ Verified public.event_photos table');

  console.log('--- 5. Checking public.feedbacks ---');
  await c.query(`
    CREATE TABLE IF NOT EXISTS public.feedbacks (
      id text PRIMARY KEY,
      title text,
      content text,
      rating integer DEFAULT 5,
      type text DEFAULT 'feedback',
      status text DEFAULT 'pending',
      user_id uuid,
      association_id uuid,
      created_at timestamptz DEFAULT now()
    );
  `);
  console.log('✅ Verified public.feedbacks table');

  await c.end();
  console.log('🎉 DDL Patch Completed Successfully!');
}

main().catch((err) => {
  console.error('DDL ERROR:', err);
  process.exit(1);
});
