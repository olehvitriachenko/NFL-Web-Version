import { FiLogOut } from "react-icons/fi";
import nflLogo from "/nfl_brand_logo.png";

interface HeaderProps {
  onLogout?: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white px-[10.8px] py-[7.2px] shadow-sm z-50">
      <div className="w-full flex items-center justify-between m-0">
        <div className="flex items-center gap-[3.6px]">
          <img
            src={nflLogo}
            alt="National FARM • LIFE"
            className="object-contain"
            style={{ height: "64.8px" }}
          />
        </div>
        {onLogout && (
          <button
            className="p-[3.6px] text-[#0D175C] hover:bg-gray-100 transition-colors"
            style={{ borderRadius: 10 }}
            onClick={onLogout}
            aria-label="Logout"
          >
            <FiLogOut size={24} />
          </button>
        )}
      </div>
    </header>
  );
};
