// Owner: Member 3 (Database Developer)
const db = require('../config/db');

// ---- helpers --------------------------------------------------------------

async function membersOf(conversationIds) {
  if (!conversationIds.length) return {};
  const { rows } = await db.query(
    `SELECT cm.conversation_id, u.id, u.username, u.avatar_url, u.last_seen
       FROM conversation_members cm
       JOIN users u ON u.id = cm.user_id
      WHERE cm.conversation_id = ANY($1::int[])
      ORDER BY u.username`,
    [conversationIds]
  );
  const map = {};
  for (const r of rows) {
    (map[r.conversation_id] ||= []).push({
      id: r.id,
      username: r.username,
      avatar_url: r.avatar_url,
      last_seen: r.last_seen,
    });
  }
  return map;
}

function shape(row, members, viewerId) {
  const other = row.is_group ? null : members.find((m) => m.id !== viewerId);
  return {
    id: row.id,
    is_group: row.is_group,
    name: row.is_group ? row.name : other?.username ?? 'Unknown',
    avatar_url: other?.avatar_url ?? null,
    other_user_id: other?.id ?? null,
    members,
    unread: row.unread ?? 0,
    last_message: row.lm_id
      ? {
          id: row.lm_id,
          body: row.lm_deleted ? null : row.lm_body,
          sender_id: row.lm_sender_id,
          deleted: row.lm_deleted,
          attachment_name: row.lm_deleted ? null : row.lm_file,
          created_at: row.lm_created_at,
        }
      : null,
    created_at: row.created_at,
  };
}

const LIST_SQL = `
  SELECT c.id, c.is_group, c.name, c.created_at,
         lm.id AS lm_id, lm.body AS lm_body, lm.sender_id AS lm_sender_id,
         lm.deleted AS lm_deleted, lm.created_at AS lm_created_at,
         (SELECT file_name FROM attachments a WHERE a.message_id = lm.id LIMIT 1) AS lm_file,
         (SELECT COUNT(*) FROM messages m
           WHERE m.conversation_id = c.id
             AND m.id > cm.last_read_message_id
             AND m.sender_id <> $1
             AND NOT m.deleted)::int AS unread
    FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id = c.id AND cm.user_id = $1
    LEFT JOIN LATERAL (
      SELECT * FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1
    ) lm ON true
   WHERE ($2::int IS NULL OR c.id = $2)
   ORDER BY COALESCE(lm.created_at, c.created_at) DESC, c.id DESC`;

// ---- queries --------------------------------------------------------------

// All conversations of a user with last message, unread count and members.
exports.listForUser = async (userId) => {
  const { rows } = await db.query(LIST_SQL, [userId, null]);
  const members = await membersOf(rows.map((r) => r.id));
  return rows.map((r) => shape(r, members[r.id] || [], userId));
};

// A single conversation shaped from the point of view of `viewerId`.
exports.getForUser = async (conversationId, viewerId) => {
  const { rows } = await db.query(LIST_SQL, [viewerId, conversationId]);
  if (!rows[0]) return null;
  const members = await membersOf([rows[0].id]);
  return shape(rows[0], members[rows[0].id] || [], viewerId);
};

exports.getIdsForUser = async (userId) => {
  const { rows } = await db.query(
    'SELECT conversation_id FROM conversation_members WHERE user_id = $1',
    [userId]
  );
  return rows.map((r) => r.conversation_id);
};

exports.getMemberIds = async (conversationId) => {
  const { rows } = await db.query(
    'SELECT user_id FROM conversation_members WHERE conversation_id = $1',
    [conversationId]
  );
  return rows.map((r) => r.user_id);
};

exports.isMember = async (conversationId, userId) => {
  const { rows } = await db.query(
    'SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  return rows.length > 0;
};

// Returns { id, created } - reuses an existing 1-to-1 chat if there is one.
exports.findOrCreateDirect = async (userA, userB) => {
  const existing = await db.query(
    `SELECT c.id
       FROM conversations c
       JOIN conversation_members a ON a.conversation_id = c.id AND a.user_id = $1
       JOIN conversation_members b ON b.conversation_id = c.id AND b.user_id = $2
      WHERE c.is_group = false
      LIMIT 1`,
    [userA, userB]
  );
  if (existing.rows[0]) return { id: existing.rows[0].id, created: false };

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const c = await client.query(
      'INSERT INTO conversations (is_group, created_by) VALUES (false, $1) RETURNING id',
      [userA]
    );
    await client.query(
      'INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
      [c.rows[0].id, userA, userB]
    );
    await client.query('COMMIT');
    return { id: c.rows[0].id, created: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.createGroup = async (name, creatorId, memberIds) => {
  const ids = [...new Set([creatorId, ...memberIds])];
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const c = await client.query(
      'INSERT INTO conversations (is_group, name, created_by) VALUES (true, $1, $2) RETURNING id',
      [name, creatorId]
    );
    const convId = c.rows[0].id;
    await client.query(
      `INSERT INTO conversation_members (conversation_id, user_id)
       SELECT $1, UNNEST($2::int[])`,
      [convId, ids]
    );
    await client.query('COMMIT');
    return { id: convId, memberIds: ids };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
