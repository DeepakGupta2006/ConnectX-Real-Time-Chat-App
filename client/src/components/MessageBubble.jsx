// Owner: Member 1 (Frontend Developer)  -  feature/chat-ui
import { useState } from 'react';
import { fileUrl } from '../services/api';
import { formatSize, formatTime } from '../utils/format';

function Ticks({ status }) {
  // sent ✓   delivered ✓✓ (grey)   read ✓✓ (blue)
  const label = { sent: 'Sent', delivered: 'Delivered', read: 'Read' }[status] || 'Sent';
  return (
    <span className={`ticks ${status === 'read' ? 'read' : ''}`} title={label} aria-label={label}>
      {status === 'sent' ? '✓' : '✓✓'}
    </span>
  );
}

function Attachment({ file }) {
  const url = fileUrl(file.file_url);
  if (file.mime_type?.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer noopener">
        <img className="attach-img" src={url} alt={file.file_name} loading="lazy" />
      </a>
    );
  }
  return (
    <a className="attach-file" href={url} download={file.file_name} target="_blank" rel="noreferrer noopener">
      <span className="attach-icon">📄</span>
      <span className="attach-meta">
        <strong>{file.file_name}</strong>
        <small>{formatSize(file.size_bytes)} · Download</small>
      </span>
    </a>
  );
}

export default function MessageBubble({ msg, mine, showSender, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const startEdit = () => {
    setDraft(msg.body || '');
    setError('');
    setEditing(true);
  };

  const saveEdit = async () => {
    const text = draft.trim();
    if (!text || text === msg.body) return setEditing(false);
    try {
      await onEdit(msg.id, text);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (window.confirm('Delete this message for everyone?')) {
      try {
        await onDelete(msg.id);
      } catch (err) {
        window.alert(err.message);
      }
    }
  };

  return (
    <div className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
      <div className={`bubble ${msg.deleted ? 'deleted' : ''}`}>
        {showSender && !mine && <div className="sender">{msg.sender_name}</div>}

        {msg.deleted ? (
          <em>🚫 This message was deleted</em>
        ) : (
          <>
            {msg.attachment && <Attachment file={msg.attachment} />}
            {editing ? (
              <div className="edit-box">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                    if (e.key === 'Escape') setEditing(false);
                  }}
                  rows={2}
                  autoFocus
                />
                {error && <small className="form-error">{error}</small>}
                <div className="edit-actions">
                  <button className="btn small" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn small primary" onClick={saveEdit}>Save</button>
                </div>
              </div>
            ) : (
              msg.body && <div className="text">{msg.body}</div>
            )}
          </>
        )}

        <div className="meta">
          {msg.edited_at && !msg.deleted && <span>edited</span>}
          <span>{formatTime(msg.created_at)}</span>
          {mine && !msg.deleted && <Ticks status={msg.status} />}
        </div>

        {mine && !msg.deleted && !editing && (
          <div className="msg-actions">
            {msg.body && <button onClick={startEdit} title="Edit" aria-label="Edit message">✏️</button>}
            <button onClick={remove} title="Delete" aria-label="Delete message">🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}
