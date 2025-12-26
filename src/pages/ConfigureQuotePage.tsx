import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { navigateBack } from "../utils/navigation";
import { BORDER, COLORS } from "../constants/theme";
import { FiChevronDown } from "react-icons/fi";

// Type for quote data
interface QuoteData {
  product: string;
  paymentMethod: string;
  paymentMode: string;
  faceAmount: string;
  planCode: string;
  waiverOfPremium: boolean;
  accidentalDeath: boolean;
  accidentalDeathType: "ADB" | "ADD";
  accidentalDeathAmount: string;
  dependentChild: boolean;
  dependentChildAmount: string;
  guaranteedInsurability: boolean;
  guaranteedInsurabilityAmount: string;
  premium: string;
}

// Mock data - will be replaced with API call later
const fetchMockQuoteData = async (): Promise<QuoteData> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        product: "PWL - Participating Whole Life",
        paymentMethod: "Regular",
        paymentMode: "Monthly",
        faceAmount: "10,000",
        planCode: "54015",
        waiverOfPremium: false,
        accidentalDeath: false,
        accidentalDeathType: "ADB",
        accidentalDeathAmount: "0",
        dependentChild: false,
        dependentChildAmount: "1000",
        guaranteedInsurability: false,
        guaranteedInsurabilityAmount: "5000",
        premium: "14.73",
      });
    }, 100);
  });
};

export const ConfigureQuotePage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const [product, setProduct] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [faceAmount, setFaceAmount] = useState("");
  const [planCode, setPlanCode] = useState("");
  const [waiverOfPremium, setWaiverOfPremium] = useState(false);
  const [accidentalDeath, setAccidentalDeath] = useState(false);
  const [accidentalDeathType, setAccidentalDeathType] = useState<"ADB" | "ADD">(
    "ADB"
  );
  const [accidentalDeathAmount, setAccidentalDeathAmount] = useState("0");
  const [dependentChild, setDependentChild] = useState(false);
  const [dependentChildAmount, setDependentChildAmount] = useState("1000");
  const [guaranteedInsurability, setGuaranteedInsurability] = useState(false);
  const [guaranteedInsurabilityAmount, setGuaranteedInsurabilityAmount] =
    useState("5000");
  const [premium, setPremium] = useState("14.73");
  const [loading, setLoading] = useState(true);

  // Load dynamic data on mount
  useEffect(() => {
    const loadQuoteData = async () => {
      try {
        // TODO: Replace with actual API call
        const data = await fetchMockQuoteData();

        setProduct(data.product);
        setPaymentMethod(data.paymentMethod);
        setPaymentMode(data.paymentMode);
        setFaceAmount(data.faceAmount);
        setPlanCode(data.planCode);
        setWaiverOfPremium(data.waiverOfPremium);
        setAccidentalDeath(data.accidentalDeath);
        setAccidentalDeathType(data.accidentalDeathType);
        setAccidentalDeathAmount(data.accidentalDeathAmount);
        setDependentChild(data.dependentChild);
        setDependentChildAmount(data.dependentChildAmount);
        setGuaranteedInsurability(data.guaranteedInsurability);
        setGuaranteedInsurabilityAmount(data.guaranteedInsurabilityAmount);
        setPremium(data.premium);
      } catch (error) {
        console.error("Error loading quote data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuoteData();
  }, []);

  // Premium will be calculated by backend - just display the value from API

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleDetails = () => {
    navigate({ to: "/quote-details" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading quote data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader
        title="Configure Quote"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Premium Display */}
            <div className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: COLORS.PRIMARY }}
              >
                Premium: ${premium}
              </p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              {/* Product */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Product
                </label>
                <div className="relative">
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 appearance-none pr-10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    <option value="PWL - Participating Whole Life">
                      PWL - Participating Whole Life
                    </option>
                    <option value="Flexible Premium Annuity">
                      Flexible Premium Annuity
                    </option>
                    <option value="Payroll Participating">
                      Payroll Participating
                    </option>
                    <option value="Legacy Term - 10 Year">
                      Legacy Term - 10 Year
                    </option>
                    <option value="Legacy Term - 20 Year">
                      Legacy Term - 20 Year
                    </option>
                    <option value="Legacy Term - 30 Year">
                      Legacy Term - 30 Year
                    </option>
                    <option value="Payroll - 20 Year Term">
                      Payroll - 20 Year Term
                    </option>
                  </select>
                  <FiChevronDown
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 appearance-none pr-10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    <option value="Regular">Regular</option>
                  </select>
                  <FiChevronDown
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Payment Mode
                </label>
                <div className="relative">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 appearance-none pr-10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                  <FiChevronDown
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Face Amount */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Face Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="text"
                    value={faceAmount}
                    onChange={(e) => setFaceAmount(e.target.value)}
                    className="w-full px-4 pl-8 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                    placeholder="10,000"
                  />
                </div>
              </div>
            </div>

            {/* Plan Code */}
            <div className="text-sm text-gray-600">Plan code {planCode}</div>

            {/* Toggle Options */}
            <div
              className="flex flex-col gap-0 bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              {/* Waiver of Premium */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <span className="text-[#000000] font-medium">
                  Waiver of Premium
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waiverOfPremium}
                    onChange={(e) => setWaiverOfPremium(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                </label>
              </div>

              {/* Accidental Death */}
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-[#000000] font-medium">
                    Accidental Death
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accidentalDeath}
                      onChange={(e) => setAccidentalDeath(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                  </label>
                </div>
                {accidentalDeath && (
                  <div className="px-4 pb-3 flex flex-col gap-3">
                    {/* ADB/ADD Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAccidentalDeathType("ADB")}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                          accidentalDeathType === "ADB"
                            ? "bg-[#0D175C] text-white"
                            : "bg-gray-200 text-[#000000]"
                        }`}
                        style={{ borderRadius: BORDER.borderRadius }}
                      >
                        ADB
                      </button>
                      <button
                        onClick={() => setAccidentalDeathType("ADD")}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                          accidentalDeathType === "ADD"
                            ? "bg-[#0D175C] text-white"
                            : "bg-gray-200 text-[#000000]"
                        }`}
                        style={{ borderRadius: BORDER.borderRadius }}
                      >
                        ADD
                      </button>
                    </div>
                    {/* Accidental Death Amount */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-gray-600">
                        Accidental Death Amount
                      </label>
                      <input
                        type="text"
                        value={accidentalDeathAmount}
                        onChange={(e) =>
                          setAccidentalDeathAmount(e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                        style={{ borderRadius: BORDER.borderRadius }}
                        placeholder="0"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Min: $10,000.00</span>
                        <span>Max: $10,000.00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dependent Child */}
              <div className="border-b border-gray-200">
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-[#000000] font-medium">
                    Dependent Child
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dependentChild}
                      onChange={(e) => setDependentChild(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                  </label>
                </div>
                {dependentChild && (
                  <div className="px-4 pb-3 flex gap-2">
                    {["1000", "2000", "3000", "4000"].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDependentChildAmount(amount)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                          dependentChildAmount === amount
                            ? "bg-[#0D175C] text-white"
                            : "bg-gray-200 text-[#000000]"
                        }`}
                        style={{ borderRadius: BORDER.borderRadius }}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Guaranteed Insurability */}
              <div>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-[#000000] font-medium">
                    Guaranteed Insurability
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guaranteedInsurability}
                      onChange={(e) =>
                        setGuaranteedInsurability(e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] hover:shadow-md"></div>
                  </label>
                </div>
                {guaranteedInsurability && (
                  <div className="px-4 pb-3 flex gap-2">
                    {["5000", "10000"].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setGuaranteedInsurabilityAmount(amount)}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                          guaranteedInsurabilityAmount === amount
                            ? "bg-[#0D175C] text-white"
                            : "bg-gray-200 text-[#000000]"
                        }`}
                        style={{ borderRadius: BORDER.borderRadius }}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Details Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleDetails} fullWidth>
                DETAILS
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
