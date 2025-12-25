import { FiLogOut } from "react-icons/fi";

interface HeaderProps {
  onLogout?: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  return (
    <header className="bg-white px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#1e40af] to-[#3b82f6] rounded-md flex items-center justify-center text-white font-bold text-lg">
            N
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold text-[#1e40af]">National</span>
            <span className="text-xs font-medium text-[#3b82f6] tracking-wide">
              FARM • LIFE
            </span>
          </div>
        </div>
        {onLogout && (
          <button
            className="p-2 text-[#1e40af] hover:bg-[#f5f5f7] rounded-lg transition-colors"
            onClick={onLogout}
            aria-label="Logout"
          >
            <FiLogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
};

