// Owner: Member 1 (Frontend Developer)
import { useTheme } from '../context/ThemeContext';

export default function AuthLayout({ title, subtitle, children, footer }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="auth-page">
      <button className="icon-btn auth-theme" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="auth-card">
        <div className="logo-badge">X</div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </div>
  );
}
