// Owner: Member 1 (Frontend Developer)
import { useState } from 'react';
import Modal from './Modal';
import UserSearchList, { useUserSearch } from './UserSearchList';
import { useChat } from '../hooks/useChat';

export default function NewGroupModal({ onClose }) {
  const { createGroup, isOnline } = useChat();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // [{id, username}]
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { users, loading } = useUserSearch(query);

  const add = (u) => {
    if (!selected.some((s) => s.id === u.id)) setSelected([...selected, u]);
    setQuery('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await createGroup(name.trim(), selected.map((s) => s.id));
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="New group" onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>
          Group name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required autoFocus />
        </label>

        <label>
          Add people
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by username…" />
        </label>
        <div className="search-results">
          <UserSearchList users={users} loading={loading} query={query} onPick={add} isOnline={isOnline} />
        </div>

        {selected.length > 0 && (
          <div className="chips">
            {selected.map((u) => (
              <span className="chip" key={u.id}>
                {u.username}
                <button type="button" onClick={() => setSelected(selected.filter((s) => s.id !== u.id))} aria-label={`Remove ${u.username}`}>×</button>
              </span>
            ))}
          </div>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn primary" disabled={busy || !name.trim() || !selected.length}>
          {busy ? 'Creating…' : `Create group${selected.length ? ` (${selected.length + 1} members)` : ''}`}
        </button>
      </form>
    </Modal>
  );
}
