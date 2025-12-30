import nflLogo from "/branded_logo_trans.png";
import { TbLogout } from "react-icons/tb";
import { TbTrash } from "react-icons/tb";
import { useState } from "react";

interface HeaderProps {
  onLogout?: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  const [isResetting, setIsResetting] = useState(false);
  const isDev = import.meta.env.DEV;
  const isElectron = typeof window !== 'undefined' && window.electron !== undefined;
  const showResetButton = isDev && isElectron;

  const handleResetDatabase = async () => {
    if (!isDev || !isElectron) {
      return;
    }

    const confirmed = window.confirm(
      "Вы уверены, что хотите сбросить базу данных? Это удалит все котировки и PDF файлы. Это действие нельзя отменить."
    );

    if (!confirmed) {
      return;
    }

    setIsResetting(true);
    try {
      const db = window.electron?.db;
      if (db && 'resetQuotesAndPDFs' in db) {
        const result = await (db as any).resetQuotesAndPDFs();
        if (result.success) {
          const message = `База данных успешно сброшена!\n\nУдалено:\n- Котировок: ${result.deletedCounts?.quotes || 0}\n- Иллюстраций: ${result.deletedCounts?.illustrations || 0}\n- PDF файлов: ${result.deletedFilesCount || 0}`;
          alert(message);
          // Перезагружаем страницу для обновления данных
          window.location.reload();
        } else {
          alert(`Ошибка при сбросе базы данных: ${result.error || "Неизвестная ошибка"}`);
        }
      } else {
        alert("Функция сброса базы данных недоступна (не в Electron окружении)");
      }
    } catch (error) {
      console.error("Error resetting database:", error);
      alert(`Ошибка при сбросе базы данных: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full py-[7.2px] z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between m-0 px-[10.8px]">
        <div className="flex items-center gap-[3.6px]">
          <img
            src={nflLogo}
            alt="National FARM • LIFE"
            className="object-contain"
            style={{ height: "64.8px" }}
          />
        </div>
        <div className="flex items-center gap-[3.6px]">
          {showResetButton && (
            <button
              className="p-[3.6px] text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: 10 }}
              onClick={handleResetDatabase}
              disabled={isResetting}
              aria-label="Reset Database"
              title="Сбросить базу данных (только в dev режиме Electron)"
            >
              <TbTrash size={30} />
            </button>
          )}
          {onLogout && (
            <button
              className="p-[3.6px] text-[#2F80ED] hover:bg-gray-100 transition-colors"
              style={{ borderRadius: 10 }}
              onClick={onLogout}
              aria-label="Logout"
            >
              <TbLogout size={30} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
