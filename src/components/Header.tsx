import nflLogo from "/branded_logo_trans.png";
import { TbLogout } from "react-icons/tb";

interface HeaderProps {
  onLogout?: () => void;
}

export const Header = ({ onLogout }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 px-[10.8px] py-[7.2px] z-50">
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
            className="p-[3.6px] text-[#2F80ED] hover:bg-gray-100 transition-colors"
            style={{ borderRadius: 10 }}
            onClick={onLogout}
            aria-label="Logout"
          >
            <TbLogout size={30} />
          </button>
        )}
      </div>
    </header>
  );
};
