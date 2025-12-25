import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { BORDER, COLORS } from "../constants/theme";

export const QuoteDetailsPage = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    window.history.back();
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleIllustrate = () => {
    navigate({ to: "/illustration-summary" });
  };

  // Mock data - will be replaced with API data
  const quoteData = {
    insured: {
      age: 30,
      sex: "Male",
      smokingHabit: "Non smoker",
    },
    product: {
      product: "PWL - Participating Whole Life",
      faceAmount: "$10,000.00",
      premium: "$14.73",
      paymentMode: "Monthly",
      paymentMethod: "Regular",
    },
    riders: [
      {
        option: "Base Plan",
        faceAmount: "$10,000.00",
        premium: "$14.73",
      },
    ],
  };

  const totalFaceAmount = quoteData.riders.reduce(
    (sum, rider) => sum + parseFloat(rider.faceAmount.replace(/[$,]/g, "")),
    0
  );
  const totalPremium = quoteData.riders.reduce(
    (sum, rider) => sum + parseFloat(rider.premium.replace(/[$,]/g, "")),
    0
  );

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
                  <span className="text-[#000000] font-medium">{quoteData.insured.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sex:</span>
                  <span className="text-[#000000] font-medium">{quoteData.insured.sex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Smoking Habit:</span>
                  <span className="text-[#000000] font-medium">{quoteData.insured.smokingHabit}</span>
                </div>
              </div>
            </div>

            {/* Product Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Product Summary</h2>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="text-[#000000] font-medium">{quoteData.product.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Face Amount:</span>
                  <span className="text-[#000000] font-medium">{quoteData.product.faceAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Premium:</span>
                  <span className="text-[#000000] font-medium">{quoteData.product.premium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Mode:</span>
                  <span className="text-[#000000] font-medium">{quoteData.product.paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="text-[#000000] font-medium">{quoteData.product.paymentMethod}</span>
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
                    {quoteData.riders.map((rider, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4 text-[#000000]">{rider.option}</td>
                        <td className="py-3 px-4 text-right text-[#000000]">{rider.faceAmount}</td>
                        <td className="py-3 px-4 text-right text-[#000000]">{rider.premium}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-300 font-semibold">
                      <td className="py-3 px-4 text-[#000000]">Total</td>
                      <td className="py-3 px-4 text-right text-[#000000]">${totalFaceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-4 text-right text-[#000000]">${totalPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Examinations */}
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-4">Examinations</h2>
              <p className="text-gray-500 text-sm">No examinations required</p>
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

