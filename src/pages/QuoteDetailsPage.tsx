import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { navigateBack } from "../utils/navigation";
import { BORDER } from "../constants/theme";
import { useQuickFormStore } from "../stores/QuickFormStore";
import type { Requirement } from "../services/qualificationExaminations";

// Helper function to format number with commas and decimals
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper function to format number with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

export const QuoteDetailsPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const { 
    insured, 
    payorEnabled,
    payor,
    product, 
    faceAmount, 
    paymentMode, 
    paymentMethod,
    waiverOfPremiumEnabled,
    accidentalDeathEnabled,
    accidentalDeath,
    dependentChildEnabled,
    dependentChild,
    guaranteedInsurabilityEnabled,
    guaranteedInsurability,
    getPremium,
    getExaminations
  } = useQuickFormStore();

  const [premiumResult, setPremiumResult] = useState<{
    premiumBasicRate: number;
    premiumWOP?: number;
    premiumAcidentalDeth?: number;
    premiumDependentChild?: number;
    premiumGuaranteedInsurability?: number;
    totalPremium: number;
    totalAnnualPremium: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [examinations, setExaminations] = useState<Requirement[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const premium = await getPremium();
        setPremiumResult(premium);
        
        const exams = getExaminations();
        setExaminations(exams);
      } catch (error) {
        console.error("Error loading quote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [getPremium, getExaminations]);

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleIllustrate = () => {
    navigate({ to: "/illustration-summary" });
  };

  if (loading || !premiumResult || !insured) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading quote data...</p>
        </div>
      </div>
    );
  }

  // Build riders array
  const riders: Array<{ option: string; faceAmount: number; premium: number }> = [];
  
  // Base Plan
  riders.push({
    option: "Base Plan",
    faceAmount: faceAmount || 0,
    premium: premiumResult.premiumBasicRate || 0,
  });

  // Waiver of Premium
  if (waiverOfPremiumEnabled && premiumResult.premiumWOP) {
    riders.push({
      option: "Waiver of Premium",
      faceAmount: faceAmount || 0,
      premium: premiumResult.premiumWOP,
    });
  }

  // Accidental Death
  if (accidentalDeathEnabled && accidentalDeath?.value && premiumResult.premiumAcidentalDeth) {
    const adType = accidentalDeath.type === 'ADB' ? 'ADB' : 'ADD';
    riders.push({
      option: `Accidental Death (${adType})`,
      faceAmount: accidentalDeath.value,
      premium: premiumResult.premiumAcidentalDeth,
    });
  }

  // Dependent Child
  if (dependentChildEnabled && dependentChild && premiumResult.premiumDependentChild) {
    riders.push({
      option: "Dependent Child",
      faceAmount: dependentChild,
      premium: premiumResult.premiumDependentChild,
    });
  }

  // Guaranteed Insurability
  if (guaranteedInsurabilityEnabled && guaranteedInsurability && premiumResult.premiumGuaranteedInsurability) {
    riders.push({
      option: "Guaranteed Insurability",
      faceAmount: guaranteedInsurability,
      premium: premiumResult.premiumGuaranteedInsurability,
    });
  }

  const totalFaceAmount = riders.reduce((sum, rider) => sum + rider.faceAmount, 0);
  const totalPremium = riders.reduce((sum, rider) => sum + rider.premium, 0);

  return (
    <div className="min-h-screen bg-white">
      <PageHeader
        title="Quote Details"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Insured Summary */}
            <div className="bg-white p-6 rounded-lg" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Insured Summary</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-black font-bold">Age</span>
                  <span className="text-[#000000] font-medium">{insured.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Sex</span>
                  <span className="text-[#000000] font-medium">{insured.sex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Smoking Habit</span>
                  <span className="text-[#000000] font-medium">{insured.smokingHabit}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Payor Summary */}
            {payorEnabled && payor && (
              <div className="bg-white p-6 rounded-lg" style={{ borderRadius: BORDER.borderRadius }}>
                <h2 className="text-xl font-bold text-[#000000] mb-4">Payor Summary</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-black font-bold">Age</span>
                    <span className="text-[#000000] font-medium">{payor.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black font-bold">Sex</span>
                    <span className="text-[#000000] font-medium">{payor.sex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black font-bold">Smoking Habit</span>
                    <span className="text-[#000000] font-medium">{payor.smokingHabit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            {(payorEnabled && payor) && <div className="border-t border-gray-200"></div>}

            {/* Product Summary */}
            <div className="bg-white p-6 rounded-lg" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Product Summary</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-black font-bold">Product</span>
                  <span className="text-[#000000] font-medium">{product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Face Amount</span>
                  <span className="text-[#000000] font-medium">${formatNumber(faceAmount || 0)}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Premium</span>
                  <span className="text-[#000000] font-medium">${formatCurrency(premiumResult.totalPremium || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Payment Mode</span>
                  <span className="text-[#000000] font-medium">{paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black font-bold">Payment Method</span>
                  <span className="text-[#000000] font-medium">{paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Riders/Benefits */}
            <div className="bg-white p-6 rounded-lg" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Riders/Benefits</h2>
              <table className="w-full">
                <thead>
                  <tr className="text-black font-bold">
                    <th className="text-left py-3 text-sm">Options</th>
                    <th className="text-right py-3 text-sm">Face Amount</th>
                    <th className="text-right py-3 text-sm">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map((rider, index) => (
                    <tr key={index}>
                      <td className="py-3 text-[#000000]">{rider.option}</td>
                      <td className="py-3 text-right text-[#000000]">${formatNumber(rider.faceAmount)}.00</td>
                      <td className="py-3 text-right text-[#000000]">${formatCurrency(rider.premium)}</td>
                    </tr>
                  ))}
                  <tr >
                    <td className="py-3 text-[#000000]">Total</td>
                    <td className="py-3 text-right text-[#000000]">${formatNumber(totalFaceAmount)}.00</td>
                    <td className="py-3 text-right text-[#000000]">${formatCurrency(totalPremium)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Examinations */}
            <div className="bg-white p-6 rounded-lg" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Examinations</h2>
              {examinations.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {examinations.map((exam, index) => (
                    <div key={index} className="text-[#000000] text-center">
                      {exam.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center">No examinations needed</p>
              )}
            </div>

            {/* Illustrate Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleIllustrate} fullWidth>
                ILLUSTRATE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

