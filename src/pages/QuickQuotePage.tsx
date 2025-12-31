import { useNavigate, useRouter } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { navigateBack } from '../utils/navigation';
import { BORDER } from '../constants/theme';
import { useQuickFormStore } from '../stores/QuickFormStore';
import { useAnalytics } from '../hooks/useAnalytics';
import nflLogo from "/Company/company-a-logo.png";
import amlLogo from "/Company/company-b-logo.png";

export const QuickQuotePage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const analytics = useAnalytics();
  const { updateForm } = useQuickFormStore();

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const handleCompanySelect = (company: 'nfl' | 'aml') => {
    // Маппинг: nfl -> CompanyA (National Farm Life), aml -> CompanyB (American Farm Life)
    const companyStoreValue: 'CompanyA' | 'CompanyB' = company === 'nfl' ? 'CompanyA' : 'CompanyB';
    
    // Сохраняем выбранную компанию в стор
    updateForm({ company: companyStoreValue });
    
    // Navigate to quote form with selected company
    navigate({ to: '/quote-form', search: { company } });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <PageHeader title="Quick Quote" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <h1 className="text-center text-[#000000] font-bold" style={{ fontSize: '23px', marginBottom: '50px' }}>
            Select a company before proceeding
          </h1>
          <div className="flex justify-between gap-6">
            {/* National FARM LIFE */}
            <button
              onClick={() => handleCompanySelect('nfl')}
              className="bg-gray-200 p-6 px-12 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              <img
                src={nflLogo}
                alt="National FARM LIFE"
                className="h-20 object-contain"
              />
            </button>

            {/* American FARM LIFE */}
            <button
              onClick={() => handleCompanySelect('aml')}
              className="bg-gray-200 p-6 px-12 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              <img
                src={amlLogo}
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

