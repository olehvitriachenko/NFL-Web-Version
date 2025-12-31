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
import { useAnalytics } from "../hooks/useAnalytics";

export const HomePage = () => {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [showUpdateModal, setShowUpdateModal] = useState(true);

  const handleLogout = async () => {
    // Отслеживание выхода
    analytics.trackEvent('logout', {});
    
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
      analytics.trackEvent('logout_error', {
        error: error instanceof Error ? error.message : 'unknown'
      });
      // Все равно перенаправить на логин даже при ошибке
      navigate({ to: "/" });
    }
  };

  const handleMenuClick = (menuItem: string, path: string) => {
    analytics.trackClick('menu_button', menuItem.toLowerCase().replace(/\s+/g, '_'), 'menu');
    analytics.trackEvent('menu_navigation', {
      menu_item: menuItem,
      destination: path
    });
    navigate({ to: path });
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
              onClick={() => handleMenuClick("Agent Info", "/agent-info")}
            />
            <MenuButton
              icon={FiMessageSquare}
              label="Quick Quote"
              onClick={() => handleMenuClick("Quick Quote", "/quick-quote")}
            />
            <MenuButton
              icon={FiMessageSquare}
              label="Quote life"
              onClick={() => handleMenuClick("Quote life", "/quote-life")}
            />
            <MenuButton
              icon={FiMail}
              label="Quotes Mailbox"
              onClick={() => handleMenuClick("Quotes Mailbox", "/quotes-mailbox")}
            />
            <MenuButton
              icon={FiFileText}
              label="Illustration History"
              onClick={() => handleMenuClick("Illustration History", "/illustration-history")}
            />
          </div>
        </div>
      </div>
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => {
          analytics.trackClick('update_modal', 'close', 'modal');
          analytics.trackEvent('update_modal_closed', {
            current_version: "1.0.1",
            new_version: "1.0.22"
          });
          setShowUpdateModal(false);
        }}
        onUpdate={() => {
          analytics.trackClick('update_modal', 'update_now', 'button');
          analytics.trackEvent('update_triggered', {
            current_version: "1.0.1",
            new_version: "1.0.22"
          });
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
