import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { BORDER } from '../constants/theme';

export const QuickQuotePage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    window.history.back();
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const handleCompanySelect = (company: 'nfl' | 'aml') => {
    // Navigate to quote form with selected company
    navigate({ to: '/quote-form', search: { company } });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Quick Quote" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <h1 className="text-center text-[#000000] font-bold" style={{ fontSize: '23px', marginBottom: '100px' }}>
            Select a company before proceeding
          </h1>
          <div className="flex flex-col gap-6">
            {/* National FARM LIFE */}
            <button
              onClick={() => handleCompanySelect('nfl')}
              className="bg-white p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              <img
                src="/nfl_brand_logo.png"
                alt="National FARM LIFE"
                className="h-20 object-contain"
              />
            </button>

            {/* American FARM LIFE */}
            <button
              onClick={() => handleCompanySelect('aml')}
              className="bg-white p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              <img
                src="/aml_brand_logo.jpg"
                alt="American FARM LIFE"
                className="h-20 object-contain"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

