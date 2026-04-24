// App.jsx
import { Routes, Route } from "react-router-dom";
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext'; // Add this import
import "./App.css";
// In index.js or App.jsx
import './styles/sinhala-fonts.css';

import ElderlyLoginForm from "./components/ElderlyLoginForm";
import ElderlyRegistrationForm from "./components/ElderlyRegistrationForm";
import LibertaHomePage from "./Pages/LibertaHomePage";
import MyProfilePage from "./Pages/MyProfilePage";
import FriendsPage from "./Pages/FriendsPage";
import HelpPage from "./Pages/HelpPage";
import ChatPage from "./Pages/ChatPage";
import SettingsPage from "./Pages/SettingsPage";   
import ElderlyCareChatbot from "./Pages/ElderlyCareChatbot";
import Layout from "./components/Layout";
import OAuthCallback from './pages/OAuthCallback';

function App() {
  return (
    <LanguageProvider>  {/* LanguageProvider should be at the top level */}
      <ThemeProvider>
        <ChatProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<ElderlyRegistrationForm />} />
              <Route path="/" element={<ElderlyLoginForm />} />
              <Route path="/liberta-home" element={<LibertaHomePage />} />
              <Route path="/profile/:id" element={<MyProfilePage />} />
              <Route path="/FriendsPage" element={<FriendsPage />} />
              <Route path="/HelpPage" element={<HelpPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/ElderlyCareChatbot" element={<ElderlyCareChatbot />} />
              <Route path="/auth/google/callback" element={<OAuthCallback />} />
            </Routes>
          </Layout>
        </ChatProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;