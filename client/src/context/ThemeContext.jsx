// Owner: Member 1 (Frontend Developer)
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('connectx_theme') ||
      (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // CSS reads <html data-theme="dark|light">
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('connectx_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
