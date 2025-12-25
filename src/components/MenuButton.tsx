import { FiChevronRight } from 'react-icons/fi';
import type { ComponentType } from 'react';

interface MenuButtonProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
}

export const MenuButton = ({ icon: Icon, label, onClick }: MenuButtonProps) => {
  return (
    <button
      className="w-full bg-white rounded-xl px-6 py-4 mb-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all text-left"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div className="text-[#1e40af] flex-shrink-0">
          <Icon size={24} />
        </div>
        <span className="flex-1 text-base font-medium text-[#1d1d1f]">
          {label}
        </span>
        <FiChevronRight className="text-[#6e6e73] flex-shrink-0" size={20} />
      </div>
    </button>
  );
};
