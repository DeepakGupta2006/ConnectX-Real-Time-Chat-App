// Owner: Member 1 (Frontend Developer)  -  feature/chat-ui
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { useChat } from '../hooks/useChat';

export default function Chat() {
  const { activeId } = useChat();
  // on phones only one pane is visible: the list, or the open chat ("has-active")
  return (
    <div className={`app ${activeId != null ? 'has-active' : ''}`}>
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
