import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { navigateBack } from "../utils/navigation";
import { BORDER } from "../constants/theme";
import { FiPlay } from "react-icons/fi";

export const IllustrationSummaryPage = () => {
  const navigate = useNavigate();
  const router = useRouter();

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleNext = () => {
    navigate({ to: "/email-quote" });
  };

  // Mock data - will be replaced with API data
  const illustrationData = {
    policy: {
      type: "PWL - Participating Whole Life",
      details: "Male/Age 30/Non smoker $10,000",
      initialPremium: "$14.73/Monthly",
    },
    summary5Year: {
      premiums: { guaranteed: 884, midpoint: "-", current: "-" },
      cashSurrenderValue: { guaranteed: 180, midpoint: 193, current: 206 },
      totalPaidUp: { guaranteed: 0, midpoint: 502, current: 1004 },
      deathBenefit: { guaranteed: 10000, midpoint: 10063, current: 10125 },
    },
    summary10Year: {
      premiums: { guaranteed: 1768, midpoint: "-", current: "-" },
      cashSurrenderValue: { guaranteed: 0, midpoint: 0, current: 0 },
      totalPaidUp: { guaranteed: 0, midpoint: 0, current: 0 },
      deathBenefit: { guaranteed: 10000, midpoint: 10000, current: 10000 },
    },
  };

  const formatNumber = (value: number | string) => {
    if (value === "-" || value === 0) return value.toString();
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
    <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
      <h2 className="text-xl font-bold text-[#000000] mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700"></th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Guaranteed</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Midpoint</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Current</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-[#000000] font-medium">Premiums:</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.premiums.guaranteed)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.premiums.midpoint)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.premiums.current)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-[#000000] font-medium">Cash Surrender Value:</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.cashSurrenderValue.guaranteed)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.cashSurrenderValue.midpoint)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.cashSurrenderValue.current)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-3 px-4 text-[#000000] font-medium">Total Paid-up:</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.totalPaidUp.guaranteed)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.totalPaidUp.midpoint)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.totalPaidUp.current)}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-[#000000] font-medium">Death Benefit:</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.deathBenefit.guaranteed)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.deathBenefit.midpoint)}</td>
              <td className="py-3 px-4 text-right text-[#000000]">{formatNumber(data.deathBenefit.current)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader
        title="Illustration Summary"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Policy Details Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000] mb-2">{illustrationData.policy.type}</h2>
              <p className="text-gray-600 mb-2">{illustrationData.policy.details}</p>
              <p className="text-gray-600">
                Initial Contract Premium: <span className="font-semibold text-[#000000]">{illustrationData.policy.initialPremium}</span>
              </p>
            </div>

            {/* Prepay Policy Card */}
            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-between" style={{ borderRadius: BORDER.borderRadius }}>
              <h2 className="text-xl font-bold text-[#000000]">Prepay Policy</h2>
              <button className="p-2 text-[#0D175C] hover:bg-gray-100 transition-colors" style={{ borderRadius: BORDER.borderRadius }}>
                <FiPlay size={24} />
              </button>
            </div>

            {/* Summary 5 year */}
            <SummaryTable title="Summary 5 year" data={illustrationData.summary5Year} />

            {/* Summary 10 year */}
            <SummaryTable title="Summary 10 year" data={illustrationData.summary10Year} />

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

