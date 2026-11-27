// Owner: Member 3 (Database Developer)
// Usage: npm run db:init   (creates all tables from database/schema.sql)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Database schema is ready.');
  } catch (err) {
    console.error('❌ Could not initialise database:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
