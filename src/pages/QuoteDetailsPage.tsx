import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { BORDER, COLORS } from "../constants/theme";
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
    window.history.back();
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
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader
        title="Quote Details"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Insured Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Insured Summary</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="text-[#000000] font-medium">{insured.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sex:</span>
                  <span className="text-[#000000] font-medium">{insured.sex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Smoking Habit:</span>
                  <span className="text-[#000000] font-medium">{insured.smokingHabit}</span>
                </div>
              </div>
            </div>

            {/* Payor Summary */}
            {payorEnabled && payor && (
              <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
                <h2 className="text-xl font-bold text-[#000000] mb-4">Payor Summary</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age:</span>
                    <span className="text-[#000000] font-medium">{payor.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sex:</span>
                    <span className="text-[#000000] font-medium">{payor.sex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Smoking Habit:</span>
                    <span className="text-[#000000] font-medium">{payor.smokingHabit}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Product Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Product Summary</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="text-[#000000] font-medium">{product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Face Amount:</span>
                  <span className="text-[#000000] font-medium">${formatNumber(faceAmount || 0)}.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Premium:</span>
                  <span className="text-[#000000] font-medium">${formatCurrency(premiumResult.totalPremium || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Mode:</span>
                  <span className="text-[#000000] font-medium">{paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="text-[#000000] font-medium">{paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Riders/Benefits */}
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Riders/Benefits</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Options</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Face Amount</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riders.map((rider, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-[#000000]">{rider.option}</td>
                        <td className="py-3 px-4 text-right text-[#000000]">${formatNumber(rider.faceAmount)}.00</td>
                        <td className="py-3 px-4 text-right text-[#000000]">${formatCurrency(rider.premium)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="py-3 px-4 text-[#000000]">Total</td>
                      <td className="py-3 px-4 text-right text-[#000000]">${formatNumber(totalFaceAmount)}.00</td>
                      <td className="py-3 px-4 text-right text-[#000000]">${formatCurrency(totalPremium)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Examinations */}
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Examinations</h2>
              {examinations.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {examinations.map((exam, index) => (
                    <div key={index} className="text-[#000000]">
                      {exam.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No examinations required</p>
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

