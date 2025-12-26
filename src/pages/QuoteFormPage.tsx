import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { BORDER, COLORS } from "../constants/theme";
import { navigateBack } from "../utils/navigation";

export const QuoteFormPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  // const search = useSearch({ from: "/quote-form", strict: false }) as {
  //   company?: "nfl" | "aml";
  // };
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [smokingHabit, setSmokingHabit] = useState("Non smoker");
  const [payor, setPayor] = useState(false);
  const [payorSex, setPayorSex] = useState<"male" | "female">("male");
  const [payorSmokingHabit, setPayorSmokingHabit] = useState("Non smoker");

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleStartQuote = () => {
    // Navigate to configure quote page
    navigate({ to: "/configure-quote" });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader
        title="Quick Client Setup"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Insured Section */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-[#000000]">Insured</h2>
              <div
                className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md"
                style={{ borderRadius: BORDER.borderRadius }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all duration-200"
                    style={{ backgroundColor: COLORS.PRIMARY }}
                  >
                    Age: {age}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer transition-all duration-200"
                  style={{
                    background: `linear-gradient(to right, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY} ${age}%, #e5e7eb ${age}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            </div>

            {/* Sex Section */}
            <div
              className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              <span
                className="px-4 py-2 rounded-full text-white text-sm font-medium inline-block w-fit transition-all duration-200"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                Sex
              </span>
              <div className="flex gap-4">
                <button
                  onClick={() => setSex("male")}
                  className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    sex === "male" ? "text-white" : "text-white bg-gray-400"
                  }`}
                  style={{
                    backgroundColor:
                      sex === "male" ? COLORS.PRIMARY : "#9ca3af",
                    borderRadius: BORDER.borderRadius,
                  }}
                >
                  Male
                </button>
                <button
                  onClick={() => setSex("female")}
                  className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                    sex === "female" ? "text-white" : "text-white bg-gray-400"
                  }`}
                  style={{
                    backgroundColor:
                      sex === "female" ? COLORS.PRIMARY : "#9ca3af",
                    borderRadius: BORDER.borderRadius,
                  }}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Smoking Habit Section */}
            <div
              className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md"
              style={{ borderRadius: BORDER.borderRadius }}
            >
              <span
                className="px-4 py-2 rounded-full text-white text-sm font-medium inline-block w-fit transition-all duration-200"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                Smoking Habit
              </span>
              <select
                value={smokingHabit}
                onChange={(e) => setSmokingHabit(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                style={{ borderRadius: BORDER.borderRadius }}
              >
                <option value="Non smoker">Non smoker</option>
                <option value="Standard">Standard</option>
              </select>
            </div>

            {/* Payor Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#000000] transition-all duration-200">
                Payor
              </h2>
              <label className="relative inline-flex items-center cursor-not-allowed opacity-50">
                <input
                  type="checkbox"
                  checked={payor}
                  onChange={(e) => setPayor(e.target.checked)}
                  disabled={true}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C]"></div>
              </label>
            </div>

            {/* Payor Sections - appears when payor is active */}
            {payor && (
              <>
                {/* Payor Sex Section */}
                <div
                  className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4 animate-fade-in-up transition-all duration-300 hover:shadow-md"
                  style={{
                    borderRadius: BORDER.borderRadius,
                    animationDelay: "0.1s",
                  }}
                >
                  <span
                    className="px-4 py-2 rounded-full text-white text-sm font-medium inline-block w-fit transition-all duration-200"
                    style={{ backgroundColor: COLORS.PRIMARY }}
                  >
                    Sex
                  </span>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPayorSex("male")}
                      className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                        payorSex === "male"
                          ? "text-white"
                          : "text-white bg-gray-400"
                      }`}
                      style={{
                        backgroundColor:
                          payorSex === "male" ? COLORS.PRIMARY : "#9ca3af",
                        borderRadius: BORDER.borderRadius,
                      }}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => setPayorSex("female")}
                      className={`flex-1 py-4 px-6 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                        payorSex === "female"
                          ? "text-white"
                          : "text-white bg-gray-400"
                      }`}
                      style={{
                        backgroundColor:
                          payorSex === "female" ? COLORS.PRIMARY : "#9ca3af",
                        borderRadius: BORDER.borderRadius,
                      }}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Payor Smoking Habit Section */}
                <div
                  className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4 animate-fade-in-up transition-all duration-300 hover:shadow-md"
                  style={{
                    borderRadius: BORDER.borderRadius,
                    animationDelay: "0.2s",
                  }}
                >
                  <span
                    className="px-4 py-2 rounded-full text-white text-sm font-medium inline-block w-fit transition-all duration-200"
                    style={{ backgroundColor: COLORS.PRIMARY }}
                  >
                    Smoking Habit
                  </span>
                  <select
                    value={payorSmokingHabit}
                    onChange={(e) => setPayorSmokingHabit(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    <option value="Non smoker">Non smoker</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </>
            )}

            {/* Start Quote Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleStartQuote} fullWidth>
                START QUOTE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
