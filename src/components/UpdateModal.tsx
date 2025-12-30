import { createPortal } from 'react-dom';
import { Button } from './Button';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  currentVersion?: string;
  newVersion?: string;
}

export const UpdateModal = ({
  isOpen,
  onClose,
  onUpdate,
  currentVersion = '1.0.1',
  newVersion = '1.0.22',
}: UpdateModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        className="bg-white rounded-[10px] w-full max-w-md shadow-xl animate-fade-in-up"
        style={{
          borderRadius: '10px',
        }}
      >
        <div className="p-6">
          {/* Title */}
          <h2 className="text-2xl font-bold text-[#0D175C] mb-4">
            Update available
          </h2>

          {/* Body text */}
          <p className="text-black mb-6 leading-relaxed">
            A newer version of the National Farm Life app is available ({newVersion}). 
            Please update now to ensure you have the latest features, performance improvements, 
            and security fixes.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 mb-4">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 normal-case"
            >
              Later
            </Button>
            <Button
              variant="primary"
              onClick={onUpdate}
              className="flex-1 normal-case"
            >
              Update now
            </Button>
          </div>

          {/* Current version info */}
          <p className="text-sm text-gray-500">
            Current version: {currentVersion}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

