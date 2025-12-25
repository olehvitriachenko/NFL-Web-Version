import { useNavigate } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { MenuButton } from "../components/MenuButton";
import { OfflineIndicator } from "../components/OfflineIndicator";
import {
  FiUser,
  FiMessageSquare,
  FiMail,
  FiFileText,
  FiFile,
} from "react-icons/fi";

export const HomePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Очистити дані сесії (якщо є)
    localStorage.removeItem("agentInfo");
    // Перенаправити на сторінку логіну
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <OfflineIndicator />
      <Header onLogout={handleLogout} />
      <div className="flex-1 flex items-center justify-center pt-[79.2px]">
        <div className="max-w-[900px] w-full px-[15px] py-[22.5px]">
          <h1 className="text-[48px] font-bold text-[#000000] text-center mb-12">
            Welcome!
          </h1>
          <div className="flex flex-col items-center gap-[15px]">
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
            <MenuButton
              icon={FiFile}
              label="Generate Mock PDF"
              onClick={() => navigate({ to: "/generate-pdf" })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
