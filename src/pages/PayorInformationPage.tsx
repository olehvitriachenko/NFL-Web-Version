import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { BORDER, COLORS } from "../constants/theme";

export const PayorInformationPage = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [smokingHabit, setSmokingHabit] = useState<"Non Smoker" | "Standard">("Non Smoker");
  const [rateTable, setRateTable] = useState<"None" | "2" | "3" | "4" | "5" | "6">("None");
  const [rateFlatExtra, setRateFlatExtra] = useState("");

  // Load saved data if exists
  useEffect(() => {
    const savedData = localStorage.getItem("payorFormData");
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
    window.history.back();
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleSave = () => {
    // Format payor info string
    const age = dateOfBirth ? new Date().getFullYear() - new Date(dateOfBirth).getFullYear() : "";
    const payorInfoString = `${firstName} ${lastName}${firstName || lastName ? ", " : ""}${sex === "male" ? "Male" : "Female"}${age ? `, Age ${age}` : ""}, ${smokingHabit}`;
    
    // Save formatted string for display
    localStorage.setItem("payorInfo", payorInfoString);
    
    // Save full form data for editing
    localStorage.setItem("payorFormData", JSON.stringify({
      firstName,
      lastName,
      dateOfBirth,
      sex,
      smokingHabit,
      rateTable,
      rateFlatExtra,
    }));
    
    // Trigger custom event to notify SetupClientPage
    window.dispatchEvent(new Event("payorInfoUpdated"));
    
    // Navigate back after saving
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Payor Information" onBack={handleBack} onHome={handleHome} />
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
                  className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                    sex === "male"
                      ? "bg-[#0D175C] text-white"
                      : "bg-gray-200 text-[#000000]"
                  }`}
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Male
                </button>
                <button
                  onClick={() => setSex("female")}
                  className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                    sex === "female"
                      ? "bg-[#0D175C] text-white"
                      : "bg-gray-200 text-[#000000]"
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
                  className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                    smokingHabit === "Non Smoker"
                      ? "bg-[#0D175C] text-white"
                      : "bg-gray-200 text-[#000000]"
                  }`}
                  style={{ borderRadius: BORDER.borderRadius }}
                >
                  Non Smoker
                </button>
                <button
                  onClick={() => setSmokingHabit("Standard")}
                  className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                    smokingHabit === "Standard"
                      ? "bg-[#0D175C] text-white"
                      : "bg-gray-200 text-[#000000]"
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
              <div className="flex gap-2 flex-wrap">
                {(["None", "2", "3", "4", "5", "6"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setRateTable(value)}
                    className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                      rateTable === value
                        ? "bg-[#0D175C] text-white"
                        : "bg-gray-200 text-[#000000]"
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

