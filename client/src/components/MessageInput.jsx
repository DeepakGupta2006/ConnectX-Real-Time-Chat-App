// Owner: Member 1 (Frontend Developer)  -  feature/chat-ui
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useChat } from '../hooks/useChat';
import { formatSize } from '../utils/format';

const EMOJIS = [
  '😀', '😂', '🤣', '😊', '😍', '😘', '😎', '🤔', '😅', '😉', '🙂', '😢',
  '😭', '😡', '🥳', '😴', '🤯', '🙏', '👍', '👎', '👏', '🙌', '💪', '🤝',
  '👋', '👀', '🔥', '✨', '🎉', '💯', '❤️', '💔', '☕', '🍕', '🚀', '✅',
];

export default function MessageInput({ conversationId }) {
  const { sendMessage, notifyTyping, stopTyping } = useChat();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null); // uploaded attachment waiting to be sent
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState('');
  const taRef = useRef(null);
  const fileRef = useRef(null);

  // a different chat was opened: reset the composer and focus it
  useEffect(() => {
    setText('');
    setFile(null);
    setError('');
    setEmojiOpen(false);
    taRef.current?.focus();
  }, [conversationId]);

  // auto-grow the textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [text]);

  const pickFile = async (e) => {
    const picked = e.target.files?.[0];
    e.target.value = '';
    if (!picked) return;
    setError('');
    setUploading(true);
    try {
      setFile(await api.upload(picked));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if ((!body && !file) || sending || uploading) return;
    setSending(true);
    setError('');
    try {
      await sendMessage({ body, attachment: file });
      setText('');
      setFile(null);
      stopTyping();
    } catch (err) {
      setError(err.message); // text stays in the box so nothing is lost
    } finally {
      setSending(false);
      taRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const addEmoji = (emoji) => {
    setText((t) => t + emoji);
    taRef.current?.focus();
  };

  return (
    <form className="composer" onSubmit={submit}>
      {error && <div className="composer-error" role="alert">{error}</div>}
      {(file || uploading) && (
        <div className="file-chip">
          {uploading ? 'Uploading…' : <>📎 {file.file_name} <small>({formatSize(file.size_bytes)})</small></>}
          {file && <button type="button" onClick={() => setFile(null)} aria-label="Remove attachment">×</button>}
        </div>
      )}
      {emojiOpen && (
        <div className="emoji-panel">
          {EMOJIS.map((em) => (
            <button type="button" key={em} onClick={() => addEmoji(em)}>{em}</button>
          ))}
        </div>
      )}
      <div className="composer-row">
        <button type="button" className="icon-btn" onClick={() => setEmojiOpen((o) => !o)} aria-label="Emoji" title="Emoji">😊</button>
        <button type="button" className="icon-btn" onClick={() => fileRef.current.click()} aria-label="Attach file" title="Attach a file or image">📎</button>
        <input ref={fileRef} type="file" hidden onChange={pickFile} />
        <textarea
          ref={taRef}
          value={text}
          rows={1}
          placeholder="Type a message"
          maxLength={5000}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) notifyTyping();
          }}
          onKeyDown={onKeyDown}
          onBlur={stopTyping}
        />
        <button className="btn primary send" disabled={sending || uploading || (!text.trim() && !file)} aria-label="Send">
          ➤
        </button>
      </div>
    </form>
  );
}
