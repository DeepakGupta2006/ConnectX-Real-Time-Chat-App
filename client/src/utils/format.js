// Owner: Member 1 (Frontend Developer)
const sameDay = (a, b) => a.toDateString() === b.toDateString();
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// "Today" / "Yesterday" / "12 Mar 2026" - used for the separators inside a chat
export function formatDay(iso) {
  const d = new Date(iso);
  if (sameDay(d, new Date())) return 'Today';
  if (sameDay(d, daysAgo(1))) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

// time for the sidebar: "10:32" today, "Yesterday", otherwise the short date
export function formatSidebarTime(iso) {
  const d = new Date(iso);
  if (sameDay(d, new Date())) return formatTime(iso);
  if (sameDay(d, daysAgo(1))) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function formatLastSeen(iso) {
  if (!iso) return 'offline';
  const d = new Date(iso);
  if (sameDay(d, new Date())) return `last seen today at ${formatTime(iso)}`;
  if (sameDay(d, daysAgo(1))) return `last seen yesterday at ${formatTime(iso)}`;
  return `last seen ${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const isSameDay = (a, b) => sameDay(new Date(a), new Date(b));
