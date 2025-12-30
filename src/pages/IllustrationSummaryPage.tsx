import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { navigateBack } from "../utils/navigation";
import { BORDER } from "../constants/theme";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import { useQuickFormStore } from "../stores/QuickFormStore";
import { getIllustrationData } from "../services/illustrationSummary";
import { shortSex } from "../utils/shortSex";
import { totalPrepaidNeeded } from "../services/prepayPolicy";

export const IllustrationSummaryPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const {
    insured,
    product,
    faceAmount,
    paymentMode,
    getPremium,
  } = useQuickFormStore();

  const [illustrationData, setIllustrationData] = useState<{
    policy: {
      type: string;
      details: string;
      initialPremium: string;
    };
    summary5Year: {
      premiums: { guaranteed: number | string; midpoint: number | string; current: number | string };
      cashSurrenderValue: { guaranteed: number | string; midpoint: number | string; current: number | string };
      totalPaidUp: { guaranteed: number | string; midpoint: number | string; current: number | string };
      deathBenefit: { guaranteed: number | string; midpoint: number | string; current: number | string };
    };
    summary10Year: {
      premiums: { guaranteed: number | string; midpoint: number | string; current: number | string };
      cashSurrenderValue: { guaranteed: number | string; midpoint: number | string; current: number | string };
      totalPaidUp: { guaranteed: number | string; midpoint: number | string; current: number | string };
      deathBenefit: { guaranteed: number | string; midpoint: number | string; current: number | string };
    };
    summary20Year: {
      premiums: { guaranteed: number | string; midpoint: number | string; current: number | string };
      cashSurrenderValue: { guaranteed: number | string; midpoint: number | string; current: number | string };
      totalPaidUp: { guaranteed: number | string; midpoint: number | string; current: number | string };
      deathBenefit: { guaranteed: number | string; midpoint: number | string; current: number | string };
    };
    summaryAge70: {
      premiums: { guaranteed: number | string; midpoint: number | string; current: number | string };
      cashSurrenderValue: { guaranteed: number | string; midpoint: number | string; current: number | string };
      totalPaidUp: { guaranteed: number | string; midpoint: number | string; current: number | string };
      deathBenefit: { guaranteed: number | string; midpoint: number | string; current: number | string };
    };
    summaryTargetYear: {
      premiums: { guaranteed: number | string; midpoint: number | string; current: number | string };
      cashSurrenderValue: { guaranteed: number | string; midpoint: number | string; current: number | string };
      totalPaidUp: { guaranteed: number | string; midpoint: number | string; current: number | string };
      deathBenefit: { guaranteed: number | string; midpoint: number | string; current: number | string };
    } | null;
    shouldShowTargetYear: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrepayOpen, setIsPrepayOpen] = useState(false);
  const [prepayYears, setPrepayYears] = useState(0);
  const [totalPrepayNeeded, setTotalPrepayNeeded] = useState(0);

  // Calculate total prepay needed when years or premium changes
  useEffect(() => {
    const calculatePrepay = async () => {
      try {
        const premiumResult = await getPremium();
        // Use totalAnnualPremium for prepay calculation (not modal premium)
        const annual = premiumResult.totalAnnualPremium;
        
        if (prepayYears > 0 && annual > 0) {
          const result = totalPrepaidNeeded(premiumResult.totalPremium * 12, prepayYears);
          setTotalPrepayNeeded(result);
        } else {
          setTotalPrepayNeeded(0);
        }
      } catch (error) {
        console.error('Error calculating prepay:', error);
        setTotalPrepayNeeded(0);
      }
    };
    
    calculatePrepay();
  }, [prepayYears, insured, product, faceAmount, paymentMode, getPremium]);

  useEffect(() => {
    const loadIllustrationData = async () => {
      try {
        setLoading(true);
        
        // Get premium data
        const premiumResult = await getPremium();
        
        // Get illustration data
        const illustrationResults = await getIllustrationData(
          getPremium,
          faceAmount,
          {
            sex: insured.sex,
            age: insured.age,
            smokingHabit: insured.smokingHabit,
          },
          product,
          paymentMode
        );

        // Format policy details
        const genderDisplay = shortSex(insured.sex) === 'M' ? 'Male' : 'Female';
        const smokingDisplay = insured.smokingHabit === 'Non-smoker' ? 'Non smoker' : 'Smoker';
        const details = `${genderDisplay}/Age ${insured.age}/${smokingDisplay} $${faceAmount.toLocaleString('en-US')}`;
        
        // Format premium
        const premiumDisplay = `$${premiumResult.totalPremium.toFixed(2)}/${paymentMode}`;
        
        // Get data for 5, 10, 20 years, age 70, and target year
        const age5Data = illustrationResults.age5;
        const age10Data = illustrationResults.age10;
        const age20Data = illustrationResults.age20;
        const age70Data = illustrationResults.age70;
        const targetYearData = illustrationResults.targetYear;

        // Calculate years for different sections
        const targetYear = 121 - insured.age;
        const age70Years = 70 - insured.age;
        
        // Check if target year already exists in other sections
        const existingYears = [5, 10, 20, age70Years];
        const shouldShowTargetYear = targetYear > 0 && !existingYears.includes(targetYear);

        // Helper to convert empty strings to "-", but keep 0 as 0
        const formatValue = (value: number | string | undefined): number | string => {
          if (value === undefined || value === '' || value === null) return '-';
          if (typeof value === 'number') {
            if (isNaN(value) || !isFinite(value)) return '-';
            // Return 0 as 0, not as "-"
            return value;
          }
          return value;
        };

        // Format summary data
        const formatSummaryData = (data: any) => {
          if (!data) {
            return {
              premiums: { guaranteed: '-', midpoint: '-', current: '-' },
              cashSurrenderValue: { guaranteed: '-', midpoint: '-', current: '-' },
              totalPaidUp: { guaranteed: '-', midpoint: '-', current: '-' },
              deathBenefit: { guaranteed: '-', midpoint: '-', current: '-' },
            };
          }

          return {
            premiums: {
              guaranteed: formatValue(data.premiums?.guaranteed || data.totalDeposit?.guaranteed),
              midpoint: formatValue(data.premiums?.midpoint || data.totalDeposit?.midpoint),
              current: formatValue(data.premiums?.current || data.totalDeposit?.current),
            },
            cashSurrenderValue: {
              guaranteed: formatValue(data.cashSurrenderValue?.guaranteed),
              midpoint: formatValue(data.cashSurrenderValue?.midpoint),
              current: formatValue(data.cashSurrenderValue?.current),
            },
            totalPaidUp: {
              guaranteed: formatValue(data.totalPaidUp?.guaranteed !== undefined ? data.totalPaidUp.guaranteed : data.reducedPaidUp?.guaranteed),
              midpoint: formatValue(data.totalPaidUp?.midpoint !== undefined ? data.totalPaidUp.midpoint : data.reducedPaidUp?.midpoint),
              current: formatValue(data.totalPaidUp?.current !== undefined ? data.totalPaidUp.current : data.reducedPaidUp?.current),
            },
            deathBenefit: {
              guaranteed: formatValue(data.deathBenefit?.guaranteed),
              midpoint: formatValue(data.deathBenefit?.midpoint),
              current: formatValue(data.deathBenefit?.current),
            },
          };
        };

        setIllustrationData({
          policy: {
            type: product,
            details,
            initialPremium: premiumDisplay,
          },
          summary5Year: formatSummaryData(age5Data),
          summary10Year: formatSummaryData(age10Data),
          summary20Year: formatSummaryData(age20Data),
          summaryAge70: formatSummaryData(age70Data),
          summaryTargetYear: shouldShowTargetYear ? formatSummaryData(targetYearData) : null,
          shouldShowTargetYear,
        });
      } catch (error) {
        console.error('Error loading illustration data:', error);
        // Get premium for fallback data
        let fallbackPremium = 0;
        try {
          const fallbackPremiumResult = await getPremium();
          fallbackPremium = fallbackPremiumResult.totalPremium;
        } catch (premiumError) {
          console.error('Error getting premium for fallback:', premiumError);
        }
        
        // Set default/fallback data on error
        const genderDisplay = shortSex(insured.sex) === 'M' ? 'Male' : 'Female';
        const smokingDisplay = insured.smokingHabit === 'Non-smoker' ? 'Non smoker' : 'Smoker';
        setIllustrationData({
          policy: {
            type: product,
            details: `${genderDisplay}/Age ${insured.age}/${smokingDisplay} $${faceAmount.toLocaleString('en-US')}`,
            initialPremium: `$${fallbackPremium.toFixed(2)}/${paymentMode}`,
          },
          summary5Year: {
            premiums: { guaranteed: '-', midpoint: '-', current: '-' },
            cashSurrenderValue: { guaranteed: '-', midpoint: '-', current: '-' },
            totalPaidUp: { guaranteed: '-', midpoint: '-', current: '-' },
            deathBenefit: { guaranteed: '-', midpoint: '-', current: '-' },
          },
          summary10Year: {
            premiums: { guaranteed: '-', midpoint: '-', current: '-' },
            cashSurrenderValue: { guaranteed: '-', midpoint: '-', current: '-' },
            totalPaidUp: { guaranteed: '-', midpoint: '-', current: '-' },
            deathBenefit: { guaranteed: '-', midpoint: '-', current: '-' },
          },
          summary20Year: {
            premiums: { guaranteed: '-', midpoint: '-', current: '-' },
            cashSurrenderValue: { guaranteed: '-', midpoint: '-', current: '-' },
            totalPaidUp: { guaranteed: '-', midpoint: '-', current: '-' },
            deathBenefit: { guaranteed: '-', midpoint: '-', current: '-' },
          },
          summaryAge70: {
            premiums: { guaranteed: '-', midpoint: '-', current: '-' },
            cashSurrenderValue: { guaranteed: '-', midpoint: '-', current: '-' },
            totalPaidUp: { guaranteed: '-', midpoint: '-', current: '-' },
            deathBenefit: { guaranteed: '-', midpoint: '-', current: '-' },
          },
          summaryTargetYear: null,
          shouldShowTargetYear: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadIllustrationData();
  }, [insured, product, faceAmount, paymentMode, getPremium]);

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleNext = () => {
    navigate({ to: "/email-quote" });
  };

  const formatNumber = (value: number | string) => {
    if (value === "-") return value;
    if (value === 0 || value === "0") return "0";
    return typeof value === "number" ? value.toLocaleString("en-US") : value;
  };

  const SummaryTable = ({
    title,
    data,
  }: {
    title: string;
    data: {
      premiums: { guaranteed: number | string; midpoint: number | string; current: number | string };
      cashSurrenderValue: { guaranteed: number | string; midpoint: number | string; current: number | string };
      totalPaidUp: { guaranteed: number | string; midpoint: number | string; current: number | string };
      deathBenefit: { guaranteed: number | string; midpoint: number | string; current: number | string };
    };
  }) => (
    <div className="bg-white p-6 rounded-lп" style={{ borderRadius: BORDER.borderRadius }}>
      <h2 className="text-xl font-bold text-[#000000] mb-4">{title}</h2>
      <div className="overflow-x-auto border border-gray-200 rounded-lg px-3">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700"></th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Guaranteed</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Midpoint</th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Current</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-[#000000] font-medium">Premiums</td>
              <td className="py-3 text-center text-[#000000]"><span className="border-gray-200 rounded-lg px-2">{formatNumber(data.premiums.guaranteed)}</span></td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.premiums.midpoint)}</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.premiums.current)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-[#000000] font-medium">Cash Surrender Value</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.cashSurrenderValue.guaranteed)}</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.cashSurrenderValue.midpoint)}</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.cashSurrenderValue.current)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-[#000000] font-medium">Total Paid-up</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.totalPaidUp.guaranteed)}</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.totalPaidUp.midpoint)}</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.totalPaidUp.current)}</td>
            </tr>
            <tr>
              <td className="py-3 text-[#000000] font-medium">Death Benefit</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.deathBenefit.guaranteed)}</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.deathBenefit.midpoint)}</td>
              <td className="py-3 text-center text-[#000000]">{formatNumber(data.deathBenefit.current)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading || !illustrationData) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <PageHeader
          title="Illustration Summary"
          onBack={handleBack}
          onHome={handleHome}
        />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
          <div className="text-center">
            <p className="text-gray-600">Loading illustration data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Illustration Summary"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Policy Details Card */}
            <div className="bg-white p-6 rounded-lg shadow-md" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-2">{illustrationData.policy.type}</h2>
              <p className="text-black font-medium mb-2">{illustrationData.policy.details}</p>
              <p className="text-gray-600">
                Initial Contract Premium: {illustrationData.policy.initialPremium}
              </p>
            </div>

            {/* Prepay Policy Card */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300" style={{ borderRadius: BORDER.borderRadius }}>
              <div className={`flex items-center justify-between ${isPrepayOpen ? 'mb-4' : ''}`}>
                <h2 className="text-xl font-bold text-[#000000]">Prepay Policy</h2>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>
                <button 
                  onClick={() => setIsPrepayOpen(!isPrepayOpen)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  {isPrepayOpen ? (
                    <FiChevronDown className="text-[#0D175C]" size={16} />
                  ) : (
                    <FiChevronRight className="text-[#0D175C]" size={16} />
                  )}
                </button>
              </div>
              
              {isPrepayOpen && (
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  <div className="text-gray-600">
                    Total Prepay Needed: <span className="font-semibold text-[#000000]">${totalPrepayNeeded.toFixed(2)}</span>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={prepayYears}
                      onChange={(e) => setPrepayYears(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all"
                      style={{ borderRadius: BORDER.borderRadius }}
                    >
                      {Array.from({ length: 21 }, (_, i) => i).map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FiChevronDown className="text-gray-400" size={20} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Summary 5 year */}
            <SummaryTable title="Summary 5 year" data={illustrationData.summary5Year} />

            {/* Summary 10 year */}
            <SummaryTable title="Summary 10 year" data={illustrationData.summary10Year} />

            {/* Summary 20 year */}
            <SummaryTable title="Summary 20 year" data={illustrationData.summary20Year} />

            {/* Summary Age 70 */}
            <SummaryTable title={`Summary Age 70`} data={illustrationData.summaryAge70} />

            {/* Summary Target Year - only show if not already in other sections */}
            {illustrationData.shouldShowTargetYear && illustrationData.summaryTargetYear && (
              <SummaryTable title={`At final year (${121 - insured.age})`} data={illustrationData.summaryTargetYear} />
            )}

            {/* Next Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleNext} fullWidth>
                NEXT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

