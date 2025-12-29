import { FiChevronRight } from 'react-icons/fi';
import type { ComponentType } from 'react';
import { COLORS } from '../constants/theme';

interface MenuButtonProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
}

export const MenuButton = ({ icon: Icon, label, onClick }: MenuButtonProps) => {
  return (
    <button
      className="w-full bg-white px-9 py-6 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all text-left"
      style={{ borderRadius: 25 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-6">
        <div className="flex-shrink-0" style={{ color: '#2F80ED' }}>
          <Icon size={36} />
        </div>
        <span className="flex-1 text-2xl font-semibold" style={{ color: COLORS.BLACK }}>
          {label}
        </span>
        <FiChevronRight className="flex-shrink-0" size={30} style={{ color: COLORS.BLACK }} />
      </div>
    </button>
  );
};
