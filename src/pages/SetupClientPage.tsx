import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { BORDER, COLORS } from "../constants/theme";

export const SetupClientPage = () => {
  const navigate = useNavigate();
  const [effectiveStartDate, setEffectiveStartDate] = useState("2025-12-25");
  const [insuredInfo, setInsuredInfo] = useState<string | null>(null);
  const [payorInfo, setPayorInfo] = useState<string | null>(null);

  // Load insured info from localStorage on mount
  useEffect(() => {
    const savedInfo = localStorage.getItem("insuredInfo");
    if (savedInfo) {
      setInsuredInfo(savedInfo);
    }
  }, []);

  // Listen for storage changes and custom events (when coming back from Client Information or Payor Information pages)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedInsuredInfo = localStorage.getItem("insuredInfo");
      setInsuredInfo(savedInsuredInfo);
      const savedPayorInfo = localStorage.getItem("payorInfo");
      setPayorInfo(savedPayorInfo);
    };

    const handleInsuredUpdate = () => {
      const savedInfo = localStorage.getItem("insuredInfo");
      setInsuredInfo(savedInfo);
    };

    const handlePayorUpdate = () => {
      const savedInfo = localStorage.getItem("payorInfo");
      setPayorInfo(savedInfo);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("insuredInfoUpdated", handleInsuredUpdate);
    window.addEventListener("payorInfoUpdated", handlePayorUpdate);
    // Also check on focus (when returning to page)
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("insuredInfoUpdated", handleInsuredUpdate);
      window.removeEventListener("payorInfoUpdated", handlePayorUpdate);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  const handleBack = () => {
    window.history.back();
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleClearInsured = () => {
    setInsuredInfo(null);
    // Clear from localStorage or database if needed
    localStorage.removeItem("insuredInfo");
  };

  const handleEditInsured = () => {
    navigate({ to: "/client-information" });
  };

  const handleAddPayor = () => {
    navigate({ to: "/payor-information" });
  };

  const handleClearPayor = () => {
    setPayorInfo(null);
    localStorage.removeItem("payorInfo");
    localStorage.removeItem("payorFormData");
  };

  const handleEditPayor = () => {
    navigate({ to: "/payor-information" });
  };

  const handleNext = () => {
    navigate({ to: "/configure-quote" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Setup Client" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Title and Description */}
            <div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.PRIMARY }}>
                Setup Client
              </h1>
              <p className="text-gray-600 text-sm">
                Please set up the insured and optionally the payor for the quote.
              </p>
            </div>

            {/* Effective Start Date */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Effective Start Date</label>
              <input
                type="date"
                value={effectiveStartDate}
                onChange={(e) => setEffectiveStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                style={{ borderRadius: BORDER.borderRadius }}
              />
              <div className="text-sm text-gray-500 mt-1">{formatDate(effectiveStartDate)}</div>
            </div>

            {/* Insured Section */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                Insured
              </h2>
              <div className="bg-white p-4 rounded-lg border border-gray-300 mb-3" style={{ borderRadius: BORDER.borderRadius }}>
                <input
                  type="text"
                  value={insuredInfo || ""}
                  placeholder="No insured information"
                  readOnly
                  className="w-full px-4 py-3 bg-transparent border-none text-[#000000] placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClearInsured}
                  className="px-4 py-2 bg-gray-200 text-[#0D175C] rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Clear
                </button>
                <button
                  onClick={handleEditInsured}
                  className="px-4 py-2 bg-gray-200 text-[#0D175C] rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Payor Section */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                Payor
              </h2>
              {payorInfo ? (
                <>
                  <div className="bg-white p-4 rounded-lg border border-gray-300 mb-3" style={{ borderRadius: BORDER.borderRadius }}>
                    <input
                      type="text"
                      value={payorInfo}
                      placeholder="No payor information"
                      readOnly
                      className="w-full px-4 py-3 bg-transparent border-none text-[#000000] placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClearPayor}
                      className="px-4 py-2 bg-gray-200 text-[#0D175C] rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      style={{ borderRadius: BORDER.borderRadius }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleEditPayor}
                      className="px-4 py-2 bg-gray-200 text-[#0D175C] rounded-lg font-medium hover:bg-gray-300 transition-colors"
                      style={{ borderRadius: BORDER.borderRadius }}
                    >
                      Edit
                    </button>
                  </div>
                </>
              ) : (
                <Button onClick={handleAddPayor} fullWidth variant="primary">
                  ADD
                </Button>
              )}
            </div>

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

