import { useNetworkStatus } from '../hooks/useOfflineCache';

export const OfflineIndicator = () => {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white px-4 py-2 text-center z-[10000] text-sm font-medium shadow-md">
      ⚠️ Offline mode - using cached data
    </div>
  );
};
