import { useNavigate, useRouter } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { navigateBack } from '../utils/navigation';

interface Quote {
  id: string;
  createdDate: string; // Format: "12/25/2025 9:18 PM"
  policyType: string; // e.g., "PWL - Participating Whole Life"
  dateTime: string; // Format: "12/25/2025 9:18 PM"
  amount: number;
  monthlyCost: number;
}

// Mock data matching the image
const mockQuotes: Quote[] = [
  {
    id: '1',
    createdDate: '12/25/2025 9:18 PM',
    policyType: 'PWL - Participating Whole Life',
    dateTime: '12/25/2025 9:18 PM',
    amount: 10000,
    monthlyCost: 14.73,
  },
  {
    id: '2',
    createdDate: '12/25/2025 12:38 PM',
    policyType: 'PWL - Participating Whole Life',
    dateTime: '12/25/2025 12:38 PM',
    amount: 100000,
    monthlyCost: 84.34,
  },
  {
    id: '3',
    createdDate: '12/24/2025 5:52 PM',
    policyType: 'PWL - Participating Whole Life',
    dateTime: '12/24/2025 5:52 PM',
    amount: 100000,
    monthlyCost: 84.34,
  },
  {
    id: '4',
    createdDate: '12/24/2025 1:38 PM',
    policyType: 'PWL - Participating Whole Life',
    dateTime: '12/24/2025 1:38 PM',
    amount: 10000,
    monthlyCost: 14.73,
  },
];

export const QuotesMailboxPage = () => {
  const navigate = useNavigate();
  const router = useRouter();

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const handleViewPdf = (quoteId: string) => {
    // TODO: Implement PDF viewing functionality
    console.log('View PDF for quote:', quoteId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white">
      <OfflineIndicator />
      <PageHeader title="Mail" onBack={handleBack} onHome={handleHome} />
      
      {/* Sent Banner */}
      <div className="bg-[#39458C] w-[calc(100%-90px)] rounded-lg mx-auto py-2">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-white text-base font-bold">Sent</h2>
        </div>
      </div>

      {/* Quotes List */}
      <div className="px-4 py-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-4">
          {mockQuotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
              style={{ borderRadius: 10 }}
            >
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Created:</span> {quote.createdDate}
                </p>
                <h3 className="text-base font-bold text-[#000000] mb-2">
                  {quote.policyType}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {quote.dateTime}
                </p>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-base font-bold text-[#000000] mb-1">
                    {formatCurrency(quote.amount)}
                  </p>
                  <p className="text-sm text-gray-700">
                    {formatCurrency(quote.monthlyCost)}/Monthly
                  </p>
                </div>
                <button
                  onClick={() => handleViewPdf(quote.id)}
                  className="bg-[#39458C] text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-[#0D175C]/90 transition-colors flex-shrink-0"
                  style={{ borderRadius: 10 }}
                >
                  VIEW PDF
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};
