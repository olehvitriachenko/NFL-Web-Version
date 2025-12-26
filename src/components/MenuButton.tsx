import { FiChevronRight } from "react-icons/fi";
import type { ComponentType } from "react";

interface MenuButtonProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
}

export const MenuButton = ({ icon: Icon, label, onClick }: MenuButtonProps) => {
  return (
    <button
      className="w-full bg-white px-9 py-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all text-left"
      style={{ borderRadius: 10 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-6">
        <div className="text-[#0D175C] flex-shrink-0">
          <Icon size={36} />
        </div>
        <span className="flex-1 text-2xl font-medium text-[#000000]">
          {label}
        </span>
        <FiChevronRight className="text-gray-500 flex-shrink-0" size={30} />
      </div>
    </button>
  );
};
