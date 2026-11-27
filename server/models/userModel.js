// Owner: Member 3 (Database Developer)
const db = require('../config/db');

const PUBLIC = 'id, username, email, avatar_url, last_seen, created_at';

exports.create = async ({ username, email, passwordHash }) => {
  const { rows } = await db.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3) RETURNING ${PUBLIC}`,
    [username, email, passwordHash]
  );
  return rows[0];
};

// Includes password_hash - only use for login!
exports.findByEmailWithHash = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
};

exports.findById = async (id) => {
  const { rows } = await db.query(`SELECT ${PUBLIC} FROM users WHERE id = $1`, [id]);
  return rows[0] || null;
};

// Search by username (case-insensitive), never returns the searching user.
exports.search = async (q, excludeId, limit = 20) => {
  const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
  const { rows } = await db.query(
    `SELECT id, username, avatar_url, last_seen
       FROM users
      WHERE username ILIKE $1 AND id <> $2
      ORDER BY username
      LIMIT $3`,
    [like, excludeId, limit]
  );
  return rows;
};

exports.updateProfile = async (id, { username, avatar_url }) => {
  const { rows } = await db.query(
    `UPDATE users
        SET username   = COALESCE($2, username),
            avatar_url = CASE WHEN $3::boolean THEN $4 ELSE avatar_url END
      WHERE id = $1
      RETURNING ${PUBLIC}`,
    [id, username ?? null, avatar_url !== undefined, avatar_url ?? null]
  );
  return rows[0];
};

exports.touchLastSeen = async (id) => {
  const { rows } = await db.query(
    'UPDATE users SET last_seen = now() WHERE id = $1 RETURNING last_seen',
    [id]
  );
  return rows[0]?.last_seen;
};
