// Owner: Member 3 (Database Developer)
const db = require('../config/db');

// Delivery status as seen by the sender:
//   'read'      -> every other member has read it
//   'delivered' -> every other member's device has received it
//   'sent'      -> saved on the server only
const SELECT_MESSAGE = `
  SELECT m.id, m.conversation_id, m.sender_id, u.username AS sender_name,
         m.body, m.deleted, m.edited_at, m.created_at,
         a.file_url, a.file_name, a.mime_type, a.size_bytes,
         (SELECT COUNT(*) FROM conversation_members cm
           WHERE cm.conversation_id = m.conversation_id AND cm.user_id <> m.sender_id)::int AS recipients,
         (SELECT COUNT(*) FROM message_status ms WHERE ms.message_id = m.id)::int AS delivered_count,
         (SELECT COUNT(*) FROM message_status ms
           WHERE ms.message_id = m.id AND ms.status = 'read')::int AS read_count
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    LEFT JOIN attachments a ON a.message_id = m.id`;

function statusOf(r) {
  if (r.recipients > 0 && r.read_count >= r.recipients) return 'read';
  if (r.recipients > 0 && r.delivered_count >= r.recipients) return 'delivered';
  return 'sent';
}

function shape(r) {
  return {
    id: r.id,
    conversation_id: r.conversation_id,
    sender_id: r.sender_id,
    sender_name: r.sender_name,
    body: r.deleted ? null : r.body,
    deleted: r.deleted,
    edited_at: r.edited_at,
    created_at: r.created_at,
    attachment:
      r.file_url && !r.deleted
        ? { file_url: r.file_url, file_name: r.file_name, mime_type: r.mime_type, size_bytes: r.size_bytes }
        : null,
    status: statusOf(r),
  };
}

exports.getById = async (id) => {
  const { rows } = await db.query(`${SELECT_MESSAGE} WHERE m.id = $1`, [id]);
  return rows[0] ? shape(rows[0]) : null;
};

// Newest `limit` messages (optionally older than `before`), returned oldest -> newest.
exports.listByConversation = async (conversationId, before, limit = 30) => {
  const { rows } = await db.query(
    `${SELECT_MESSAGE}
      WHERE m.conversation_id = $1 AND ($2::int IS NULL OR m.id < $2)
      ORDER BY m.id DESC
      LIMIT $3`,
    [conversationId, before || null, limit + 1]
  );
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).reverse().map(shape);
  return { messages: page, hasMore };
};

exports.create = async ({ conversationId, senderId, body, attachment }) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const m = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, body)
       VALUES ($1, $2, $3) RETURNING id`,
      [conversationId, senderId, body || null]
    );
    const id = m.rows[0].id;
    if (attachment) {
      await client.query(
        `INSERT INTO attachments (message_id, file_url, file_name, mime_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, attachment.file_url, attachment.file_name, attachment.mime_type, attachment.size_bytes]
      );
    }
    // the sender has obviously read their own message
    await client.query(
      `UPDATE conversation_members SET last_read_message_id = GREATEST(last_read_message_id, $3)
        WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, senderId, id]
    );
    await client.query('COMMIT');
    return exports.getById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Only the author may edit, and only text of a non-deleted message.
exports.edit = async (id, senderId, body) => {
  const { rowCount } = await db.query(
    `UPDATE messages SET body = $3, edited_at = now()
      WHERE id = $1 AND sender_id = $2 AND NOT deleted`,
    [id, senderId, body]
  );
  return rowCount ? exports.getById(id) : null;
};

exports.softDelete = async (id, senderId) => {
  const { rowCount } = await db.query(
    `UPDATE messages SET deleted = true, body = NULL
      WHERE id = $1 AND sender_id = $2 AND NOT deleted`,
    [id, senderId]
  );
  return rowCount ? exports.getById(id) : null;
};

// Status of specific messages (used to push tick updates to senders).
exports.getStatuses = async (ids) => {
  if (!ids.length) return [];
  const { rows } = await db.query(
    `${SELECT_MESSAGE} WHERE m.id = ANY($1::int[])`,
    [ids]
  );
  return rows.map((r) => ({ id: r.id, status: statusOf(r) }));
};

// Mark one message as delivered to the given users (ignores already-read ones).
exports.markDelivered = async (messageId, userIds) => {
  if (!userIds.length) return;
  await db.query(
    `INSERT INTO message_status (message_id, user_id, status)
     SELECT $1, UNNEST($2::int[]), 'delivered'
     ON CONFLICT (message_id, user_id) DO NOTHING`,
    [messageId, userIds]
  );
};

// When a user comes online: everything sent to them while offline is now delivered.
// Returns [{ id, conversation_id }]
exports.markAllDeliveredFor = async (userId) => {
  const { rows } = await db.query(
    `WITH ins AS (
       INSERT INTO message_status (message_id, user_id, status)
       SELECT m.id, $1, 'delivered'
         FROM messages m
         JOIN conversation_members cm ON cm.conversation_id = m.conversation_id AND cm.user_id = $1
        WHERE m.sender_id <> $1
          AND NOT EXISTS (SELECT 1 FROM message_status ms WHERE ms.message_id = m.id AND ms.user_id = $1)
       ON CONFLICT DO NOTHING
       RETURNING message_id
     )
     SELECT ins.message_id AS id, m.conversation_id
       FROM ins JOIN messages m ON m.id = ins.message_id`,
    [userId]
  );
  return rows;
};

// User opened a conversation: mark everything as read + reset the unread counter.
// Returns the ids of messages whose status changed.
exports.markConversationRead = async (conversationId, userId) => {
  const { rows } = await db.query(
    `WITH upd AS (
       INSERT INTO message_status (message_id, user_id, status)
       SELECT m.id, $2, 'read' FROM messages m
        WHERE m.conversation_id = $1 AND m.sender_id <> $2
       ON CONFLICT (message_id, user_id)
         DO UPDATE SET status = 'read', updated_at = now()
         WHERE message_status.status <> 'read'
       RETURNING message_id
     ), bump AS (
       UPDATE conversation_members
          SET last_read_message_id =
              (SELECT COALESCE(MAX(id), 0) FROM messages WHERE conversation_id = $1)
        WHERE conversation_id = $1 AND user_id = $2
     )
     SELECT message_id FROM upd`,
    [conversationId, userId]
  );
  return rows.map((r) => r.message_id);
};
