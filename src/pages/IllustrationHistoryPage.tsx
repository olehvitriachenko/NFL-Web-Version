import { useState, useMemo } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { navigateBack } from '../utils/navigation';
import { FiSearch } from 'react-icons/fi';

interface Illustration {
  id: string;
  name: string;
  email: string;
  policyCode: string;
  date: string;
  deathBenefit: number;
  monthlyPayment: number;
}

// Mock data
const mockIllustrations: Illustration[] = [
  {
    id: '1',
    name: 'По про про Оророп',
    email: 'email@email.com',
    policyCode: 'PWL - 30 - M - N',
    date: 'December 25, 2025',
    deathBenefit: 10000,
    monthlyPayment: 14.73,
  },
  {
    id: '2',
    name: 'Jhgjhg Hjgjgh',
    email: 'email@email.com',
    policyCode: 'PWL - 25 - M - N',
    date: 'December 25, 2025',
    deathBenefit: 100000,
    monthlyPayment: 84.34,
  },
  {
    id: '3',
    name: 'name name',
    email: 'email@email.com',
    policyCode: 'PWL - 25 - M - N',
    date: 'December 24, 2025',
    deathBenefit: 100000,
    monthlyPayment: 84.34,
  },
  {
    id: '4',
    name: 'Too Foo',
    email: 'toofoo@example.com',
    policyCode: 'PWL - 20 - M - N',
    date: 'December 24, 2025',
    deathBenefit: 50000,
    monthlyPayment: 45.20,
  },
  {
    id: '5',
    name: 'John Doe',
    email: 'john.doe@example.com',
    policyCode: 'PWL - 30 - M - N',
    date: 'December 23, 2025',
    deathBenefit: 150000,
    monthlyPayment: 125.50,
  },
  {
    id: '6',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    policyCode: 'PWL - 25 - M - N',
    date: 'December 23, 2025',
    deathBenefit: 75000,
    monthlyPayment: 62.15,
  },
];

export const IllustrationHistoryPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const filteredIllustrations = useMemo(() => {
    if (!searchQuery.trim()) {
      return mockIllustrations;
    }

    const query = searchQuery.toLowerCase();
    return mockIllustrations.filter(
      (illustration) =>
        illustration.name.toLowerCase().includes(query) ||
        illustration.email.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Illustration History" onBack={handleBack} onHome={handleHome} />
      <div className="px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Search Bar */}
          <div className="relative mb-4">
            <FiSearch
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-base text-[#000000] placeholder:text-gray-400 focus:outline-none focus:border-[#0D175C] focus:ring-2 focus:ring-[#0D175C]/10"
              style={{ borderRadius: 10 }}
            />
          </div>

          {/* Illustration List */}
          <div className="space-y-3">
            {filteredIllustrations.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">No illustrations found</p>
              </div>
            ) : (
              filteredIllustrations.map((illustration) => (
                <div
                  key={illustration.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                  style={{ borderRadius: 10 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-[#000000] mb-1">
                        {illustration.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">{illustration.email}</p>
                      <p className="text-sm text-gray-700">{illustration.policyCode}</p>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-nowrap ml-4">
                      {illustration.date}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 mt-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-green-100 rounded"
                        style={{ backgroundColor: '#E8F5E9' }}
                      >
                        DEATH BENEFIT:
                      </span>
                      <span className="text-sm font-semibold text-[#000000]">
                        {formatCurrency(illustration.deathBenefit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-1 text-xs font-medium text-gray-700 bg-yellow-100 rounded"
                        style={{ backgroundColor: '#FFF9C4' }}
                      >
                        MONTHLY PAYMENT:
                      </span>
                      <span className="text-sm font-semibold text-[#000000]">
                        {formatCurrency(illustration.monthlyPayment)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
