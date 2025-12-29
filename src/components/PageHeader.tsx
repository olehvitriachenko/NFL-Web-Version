import { FiArrowLeft, FiHome } from "react-icons/fi";

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  onHome?: () => void;
}

export const PageHeader = ({ title, onBack, onHome }: PageHeaderProps) => {
  return (
    <header className="bg-white px-6 py-4 shadow-sm sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="flex-1 flex items-center">
          {onBack && (
            <button
              className="p-2 text-[#000000] hover:bg-gray-100 transition-colors flex-shrink-0"
              style={{ borderRadius: 10 }}
              onClick={onBack}
              aria-label="Back"
            >
              <FiArrowLeft size={20} />
            </button>
          )}
        </div>
        <h1 className="text-xl font-semibold text-[#000000] absolute left-1/2 transform -translate-x-1/2 m-0">
          {title}
        </h1>
        <div className="flex-1 flex items-center justify-end">
          {onHome && (
            <button
              className="p-2 text-[#000000] hover:bg-gray-100 transition-colors flex-shrink-0 m-0"
              style={{ borderRadius: 10 }}
              onClick={onHome}
              aria-label="Home"
            >
              <FiHome size={20} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
