// Owner: Member 1 (Frontend Developer)  -  feature/chat-ui
import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { formatDay, formatLastSeen, isSameDay } from '../utils/format';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow() {
  const { user } = useAuth();
  const {
    activeId, activeConversation: conv, messages, hasMore, typing,
    selectConversation, loadOlder, editMessage, deleteMessage, isOnline, lastSeenOf,
  } = useChat();

  const scrollRef = useRef(null);
  const stickToBottom = useRef(true);
  const heightBeforeOlder = useRef(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const list = (activeId != null && messages[activeId]) || [];
  const lastId = list.at(-1)?.id;

  // Scroll handling: jump to bottom on a new message (if the user was already at the
  // bottom or sent it), and keep the position when older messages are prepended.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (heightBeforeOlder.current != null) {
      el.scrollTop = el.scrollHeight - heightBeforeOlder.current;
      heightBeforeOlder.current = null;
    } else if (stickToBottom.current || list.at(-1)?.sender_id === user.id) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lastId, list.length, user.id]);

  useLayoutEffect(() => {
    stickToBottom.current = true; // opening a chat always starts at the bottom
  }, [activeId]);

  if (activeId == null || !conv) {
    return (
      <main className="chat empty-chat">
        <div className="logo-badge big">X</div>
        <h2>ConnectX</h2>
        <p className="muted">Select a chat, or search for a user to start a conversation.</p>
      </main>
    );
  }

  const typers = Object.values(typing[activeId] || {});
  let subtitle;
  if (typers.length) {
    subtitle = <span className="typing-text">{conv.is_group ? `${typers.join(', ')} typing…` : 'typing…'}</span>;
  } else if (conv.is_group) {
    const online = conv.members.filter((m) => isOnline(m.id)).length;
    subtitle = `${conv.members.length} members · ${online} online`;
  } else if (isOnline(conv.other_user_id)) {
    subtitle = <span className="accent">online</span>;
  } else {
    const other = conv.members.find((m) => m.id === conv.other_user_id);
    subtitle = formatLastSeen(lastSeenOf(conv.other_user_id, other?.last_seen));
  }

  const onScroll = (e) => {
    const el = e.currentTarget;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const showOlder = async () => {
    heightBeforeOlder.current = scrollRef.current.scrollHeight;
    setLoadingOlder(true);
    try {
      await loadOlder(activeId);
    } finally {
      setLoadingOlder(false);
    }
  };

  return (
    <main className="chat">
      <header className="chat-head">
        <button className="icon-btn back" onClick={() => selectConversation(null)} aria-label="Back to chats">←</button>
        <Avatar name={conv.name} url={conv.avatar_url} size={42} online={conv.is_group ? undefined : isOnline(conv.other_user_id)} />
        <div className="chat-head-text">
          <strong>{conv.name}</strong>
          <small className="muted">{subtitle}</small>
        </div>
      </header>

      <div className="messages" ref={scrollRef} onScroll={onScroll}>
        {hasMore[activeId] && (
          <button className="btn small load-older" onClick={showOlder} disabled={loadingOlder}>
            {loadingOlder ? 'Loading…' : 'Load older messages'}
          </button>
        )}
        {list.length === 0 && <div className="empty-hint">No messages yet. Say hi! 👋</div>}
        {list.map((m, i) => (
          <Fragment key={m.id}>
            {(i === 0 || !isSameDay(list[i - 1].created_at, m.created_at)) && (
              <div className="day-sep"><span>{formatDay(m.created_at)}</span></div>
            )}
            <MessageBubble
              msg={m}
              mine={m.sender_id === user.id}
              showSender={conv.is_group && list[i - 1]?.sender_id !== m.sender_id}
              onEdit={editMessage}
              onDelete={deleteMessage}
            />
          </Fragment>
        ))}
      </div>

      <MessageInput conversationId={activeId} />
    </main>
  );
}
