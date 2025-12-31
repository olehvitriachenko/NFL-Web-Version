import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { navigateBack } from "../utils/navigation";
import { BORDER } from "../constants/theme";
import { useQuickFormStore } from "../stores/QuickFormStore";
import { useAnalytics } from "../hooks/useAnalytics";

export const ClientInformationPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const analytics = useAnalytics();
  const { updateConfigure } = useQuickFormStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [smokingHabit, setSmokingHabit] = useState<"Non Smoker" | "Standard">("Non Smoker");
  const [rateTable, setRateTable] = useState<"None" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16">("None");
  const [rateFlatExtra, setRateFlatExtra] = useState("");

  // Load saved data if exists (only insured data, not payor)
  useEffect(() => {
    const savedData = localStorage.getItem("insuredFormData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setDateOfBirth(data.dateOfBirth || "");
        setSex(data.sex || "male");
        setSmokingHabit(data.smokingHabit || "Non Smoker");
        setRateTable(data.rateTable || "None");
        setRateFlatExtra(data.rateFlatExtra || "");
      } catch (e) {
        console.error("Error parsing saved data:", e);
      }
    }
  }, []);

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleSave = () => {
    // Отслеживание сохранения информации о клиенте
    const age = dateOfBirth ? new Date().getFullYear() - new Date(dateOfBirth).getFullYear() : "";
    
    analytics.trackClick('save_client_info', 'client_information_form', 'button');
    analytics.trackFormInteraction('client_information_form', 'submit', 7);
    analytics.trackEvent('client_information_saved', {
      has_first_name: !!firstName,
      has_last_name: !!lastName,
      has_date_of_birth: !!dateOfBirth,
      age: age || null,
      sex: sex,
      smoking_habit: smokingHabit,
      has_rate_table: rateTable !== "None",
      has_flat_extra: !!rateFlatExtra
    });
    
    // Format insured info string
    const insuredInfoString = `${firstName} ${lastName}${firstName || lastName ? ", " : ""}${sex === "male" ? "Male" : "Female"}${age ? `, Age ${age}` : ""}, ${smokingHabit}`;
    
    // Save formatted string for display
    localStorage.setItem("insuredInfo", insuredInfoString);
    
    // Save full form data for editing
    localStorage.setItem("insuredFormData", JSON.stringify({
      firstName,
      lastName,
      dateOfBirth,
      sex,
      smokingHabit,
      rateTable,
      rateFlatExtra,
    }));

    // Update store with table and flatExtra values
    const table = rateTable !== "None" ? parseInt(rateTable, 10) : undefined;
    const flatExtra = rateFlatExtra && rateFlatExtra.trim() !== "" ? parseFloat(rateFlatExtra) : undefined;
    
    updateConfigure({
      table: table && !isNaN(table) ? table : undefined,
      flatExtra: flatExtra && !isNaN(flatExtra) && flatExtra > 0 ? flatExtra : undefined,
    });
    
    // Trigger custom event to notify SetupClientPage
    window.dispatchEvent(new Event("insuredInfoUpdated"));
    
    // Navigate back after saving
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Client Information" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Form Fields */}
            <div className="flex flex-col gap-4">
              <FormField
                label="First Name"
                name="firstName"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <FormField
                label="Last Name"
                name="lastName"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <FormField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                placeholder="MM/DD/YYYY"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>

            {/* Sex Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Sex</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSex("male")}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    sex === "male"
                      ? "bg-[#39458C] text-white"
                      : "bg-[#0D175C80] text-white"
                  }`}
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Male
                </button>
                <button
                  onClick={() => setSex("female")}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    sex === "female"
                      ? "bg-[#39458C] text-white"
                      : "bg-[#0D175C80] text-white"
                  }`}
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Smoking Habit Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Smoking Habit</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSmokingHabit("Non Smoker")}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    smokingHabit === "Non Smoker"
                      ? "bg-[#39458C] text-white"
                      : "bg-[#0D175C80] text-white"
                  }`}
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Non Smoker
                </button>
                <button
                  onClick={() => setSmokingHabit("Standard")}
                  className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    smokingHabit === "Standard"
                      ? "bg-[#39458C] text-white"
                      : "bg-[#0D175C80] text-white"
                  }`}
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Standard
                </button>
              </div>
            </div>

            {/* Rate - Table Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Rate - Table</label>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setRateTable("None")}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex-shrink-0 ${
                    rateTable === "None"
                      ? "bg-[#39458C] text-white"
                      : "bg-[#0D175C80] text-white"
                  }`}
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  None
                </button>
                {Array.from({ length: 15 }, (_, i) => (i + 2).toString() as "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16").map((value) => (
                  <button
                    key={value}
                    onClick={() => setRateTable(value)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex-shrink-0 ${
                      rateTable === value
                        ? "bg-[#39458C] text-white"
                        : "bg-[#0D175C80] text-white"
                    }`}
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate - Flat Extra Section */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600">Rate - Flat Extra</label>
              <input
                type="text"
                value={rateFlatExtra}
                onChange={(e) => setRateFlatExtra(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                style={{ borderRadius: BORDER.borderRadius }}
                placeholder="Rate - Flat Extra"
              />
            </div>

            {/* Save Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleSave} fullWidth>
                SAVE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

