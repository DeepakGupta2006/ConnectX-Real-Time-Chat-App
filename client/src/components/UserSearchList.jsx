// Owner: Member 1 (Frontend Developer)
// Search box + results. Used by the sidebar (start a chat) and the new-group dialog.
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Avatar from './Avatar';

export function useUserSearch(query) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setUsers([]);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    // wait 300 ms after the last keystroke so we don't call the API on every letter
    const t = setTimeout(async () => {
      try {
        const data = await api.searchUsers(q);
        if (!cancelled) setUsers(data.users);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  return { users, loading };
}

export default function UserSearchList({ users, loading, query, onPick, isOnline }) {
  if (!query.trim()) return null;
  if (loading && !users.length) return <div className="empty-hint">Searching…</div>;
  if (!users.length) return <div className="empty-hint">No users found</div>;
  return (
    <ul className="list">
      {users.map((u) => (
        <li key={u.id}>
          <button className="list-item" onClick={() => onPick(u)}>
            <Avatar name={u.username} url={u.avatar_url} size={40} online={isOnline?.(u.id)} />
            <span className="list-item-main">
              <span className="list-item-title">{u.username}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
