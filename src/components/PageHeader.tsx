import { FiArrowLeft, FiHome } from 'react-icons/fi';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  onHome?: () => void;
}

export const PageHeader = ({ title, onBack, onHome }: PageHeaderProps) => {
  return (
    <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {onBack && (
          <button
            className="p-2 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors flex-shrink-0"
            onClick={onBack}
            aria-label="Back"
          >
            <FiArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-xl font-semibold text-[#1d1d1f] flex-1 text-center m-0">
          {title}
        </h1>
        {onHome && (
          <button
            className="p-2 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors flex-shrink-0"
            onClick={onHome}
            aria-label="Home"
          >
            <FiHome size={20} />
          </button>
        )}
      </div>
    </header>
  );
};
