// Owner: Member 1 (Frontend Developer)  -  feature/chat-ui
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../hooks/useChat';
import { formatSidebarTime } from '../utils/format';
import Avatar from './Avatar';
import UserSearchList, { useUserSearch } from './UserSearchList';
import NewGroupModal from './NewGroupModal';
import ProfileModal from './ProfileModal';

function lastMessageText(conv, myId) {
  const m = conv.last_message;
  if (!m) return 'No messages yet';
  const prefix = m.sender_id === myId ? 'You: ' : '';
  if (m.deleted) return `${prefix}🚫 Message deleted`;
  if (m.attachment_name && !m.body) return `${prefix}📎 ${m.attachment_name}`;
  return `${prefix}${m.body}`;
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    conversations, activeId, selectConversation, startDirect, isOnline,
    typing, connected, notifPermission, enableNotifications,
  } = useChat();

  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null); // 'group' | 'profile' | null
  const { users, loading } = useUserSearch(query);

  const openUser = async (u) => {
    setQuery('');
    try {
      await startDirect(u.id);
    } catch {
      /* the list simply stays as is */
    }
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-head">
        <button className="me" onClick={() => setModal('profile')} title="Edit profile">
          <Avatar name={user.username} url={user.avatar_url} size={40} online={connected} />
          <span className="me-text">
            <strong>{user.username}</strong>
            <small className="muted">{connected ? 'Online' : 'Connecting…'}</small>
          </span>
        </button>
        <div className="head-actions">
          {notifPermission === 'default' && (
            <button className="icon-btn" onClick={enableNotifications} title="Enable desktop notifications" aria-label="Enable notifications">🔔</button>
          )}
          <button className="icon-btn" onClick={() => setModal('group')} title="New group" aria-label="New group">👥</button>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle dark / light" aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="icon-btn" onClick={logout} title="Log out" aria-label="Log out">⏻</button>
        </div>
      </header>

      <div className="search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users to start a chat…"
          aria-label="Search users"
        />
      </div>

      <div className="sidebar-body">
        {query.trim() ? (
          <UserSearchList users={users} loading={loading} query={query} onPick={openUser} isOnline={isOnline} />
        ) : conversations.length === 0 ? (
          <div className="empty-hint">
            No chats yet.<br />Search for a username above to say hello 👋
          </div>
        ) : (
          <ul className="list">
            {conversations.map((c) => {
              const typers = Object.values(typing[c.id] || {});
              return (
                <li key={c.id}>
                  <button
                    className={`list-item ${c.id === activeId ? 'active' : ''}`}
                    onClick={() => selectConversation(c.id)}
                  >
                    <Avatar
                      name={c.name}
                      url={c.avatar_url}
                      size={48}
                      online={c.is_group ? undefined : isOnline(c.other_user_id)}
                    />
                    <span className="list-item-main">
                      <span className="list-item-row">
                        <span className="list-item-title">{c.is_group && '👥 '}{c.name}</span>
                        {c.last_message && (
                          <small className={c.unread ? 'accent' : 'muted'}>{formatSidebarTime(c.last_message.created_at)}</small>
                        )}
                      </span>
                      <span className="list-item-row">
                        {typers.length ? (
                          <span className="typing-text">typing…</span>
                        ) : (
                          <span className="list-item-sub">{lastMessageText(c, user.id)}</span>
                        )}
                        {c.unread > 0 && <span className="badge">{c.unread > 99 ? '99+' : c.unread}</span>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modal === 'group' && <NewGroupModal onClose={() => setModal(null)} />}
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
    </aside>
  );
}
