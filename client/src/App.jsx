// Owner: Member 1 (Frontend Developer)
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext'; // Member 4
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';

function Splash() {
  return (
    <div className="splash">
      <div className="logo-badge">X</div>
    </div>
  );
}

// Only logged-in users get in. ChatProvider (socket + chat state) lives only here,
// so the socket opens on login and closes on logout.
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <ChatProvider>{children}</ChatProvider>;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/" element={<Protected><Chat /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
