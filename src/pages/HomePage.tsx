import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { MenuButton } from "../components/MenuButton";
import { UpdateModal } from "../components/UpdateModal";
import {
  FiUser,
  FiMessageSquare,
  FiMail,
  FiFileText,
} from "react-icons/fi";
import { authStorage } from "../services/auth/authStorage";

export const HomePage = () => {
  const navigate = useNavigate();
  const [showUpdateModal, setShowUpdateModal] = useState(true);

  const handleLogout = async () => {
    try {
      // Очистить токены авторизации
      await authStorage.clearTokens();
      
      // Очистить OAuth токены (если есть)
      localStorage.removeItem('@oauth_access_token');
      localStorage.removeItem('@oauth_access_token_expires_at');
      localStorage.removeItem('@oauth_user_info');
      
      // Очистить данные сессии (если есть)
      localStorage.removeItem("agentInfo");
      
      // Перенаправить на страницу логина
      navigate({ to: "/" });
    } catch (error) {
      console.error('[HomePage] Error during logout:', error);
      // Все равно перенаправить на логин даже при ошибке
      navigate({ to: "/" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <Header onLogout={handleLogout} />
      <div className="flex-1 flex items-center justify-center pt-[79.2px] m-0">
        <div className="max-w-[900px] w-full px-[15px] py-[22.5px]">
          <h1 className="text-[48px] font-bold text-[#000000] text-center mb-12">
            Welcome!
          </h1>
          <div className="grid grid-cols-2 gap-[15px]">
            <MenuButton
              icon={FiUser}
              label="Agent Info"
              onClick={() => navigate({ to: "/agent-info" })}
            />
            <MenuButton
              icon={FiMessageSquare}
              label="Quick Quote"
              onClick={() => navigate({ to: "/quick-quote" })}
            />
            <MenuButton
              icon={FiMessageSquare}
              label="Quote life"
              onClick={() => navigate({ to: "/quote-life" })}
            />
            <MenuButton
              icon={FiMail}
              label="Quotes Mailbox"
              onClick={() => navigate({ to: "/quotes-mailbox" })}
            />
            <MenuButton
              icon={FiFileText}
              label="Illustration History"
              onClick={() => navigate({ to: "/illustration-history" })}
            />
          </div>
        </div>
      </div>
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onUpdate={() => {
          console.log('Update now clicked');
          setShowUpdateModal(false);
          // TODO: Implement actual update logic
        }}
        currentVersion="1.0.1"
        newVersion="1.0.22"
      />
    </div>
  );
};
