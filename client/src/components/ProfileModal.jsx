// Owner: Member 1 (Frontend Developer)
import { useRef, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

export default function ProfileModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar_url);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.some((ext) => file.name.toLowerCase().endsWith(ext)))
      return setError('Please choose an image (jpg, png, gif or webp)');
    setError('');
    try {
      setAvatar((await api.upload(file)).file_url);
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await updateProfile({ username: username.trim(), avatar_url: avatar || null });
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Your profile" onClose={onClose}>
      <form onSubmit={save} className="form">
        <div className="profile-avatar">
          <Avatar name={username || user.username} url={avatar} size={88} />
          <div className="profile-avatar-actions">
            <button type="button" className="btn" onClick={() => fileRef.current.click()}>Change photo</button>
            {avatar && <button type="button" className="btn ghost" onClick={() => setAvatar(null)}>Remove</button>}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
          </div>
        </div>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30} required />
        </label>
        <label>
          Email
          <input value={user.email} disabled />
        </label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </Modal>
  );
}
