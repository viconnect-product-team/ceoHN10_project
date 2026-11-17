const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function run() {
  try {
    await client.connect();

    const targets = ['events', 'ceohn10_events', 'event_registrations', 'documents', 'tasks', 'ceohn10_transactions', 'notifications', 'direct_messages', 'feedback'];
    for (const t of targets) {
      const chk = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name = $1`, [t]);
      if (chk.rows.length > 0) {
        const count = await client.query(`SELECT count(*) FROM "${t}"`);
        console.log(`Table [${t}]: ${count.rows[0].count} rows`);
      } else {
        console.log(`Table [${t}]: DOES NOT EXIST`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
