// App.jsx
import { Routes, Route } from "react-router-dom";
import { ChatProvider } from './context/ChatContext';
import "./App.css";

import ElderlyLoginForm from "./components/ElderlyLoginForm";
import ElderlyRegistrationForm from "./components/ElderlyRegistrationForm";
import LibertaHomePage from "./Pages/LibertaHomePage";
import MyProfilePage from "./Pages/MyProfilePage";
import FriendsPage from "./Pages/FriendsPage";
import HelpPage from "./Pages/HelpPage";
import ChatPage from "./Pages/ChatPage";
import SettingsPage from "./Pages/SettingsPage";

function App() {
  return (
    <ChatProvider>
      <Routes>
        <Route path="/login" element={<ElderlyRegistrationForm />} />
        <Route path="/" element={<ElderlyLoginForm />} />
        <Route path="/liberta-home" element={<LibertaHomePage />} />
        <Route path="/profile/:id" element={<MyProfilePage />} />
        <Route path="/FriendsPage" element={<FriendsPage />} />
        <Route path="/HelpPage" element={<HelpPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </ChatProvider>
  );
}

export default App;