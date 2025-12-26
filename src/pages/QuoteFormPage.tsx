import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { BORDER, COLORS } from "../constants/theme";
import { useQuickFormStore } from "../stores/QuickFormStore";

export const QuoteFormPage = () => {
  const navigate = useNavigate();
  const { insured, payorEnabled, payor, updateForm } = useQuickFormStore();

  // Функция для нормализации smoking habit (приводит к формату опций select)
  const normalizeSmokingHabit = (value: string): "Non smoker" | "Smoker" => {
    if (value === "Non-smoker" || value === "Non smoker" || value.toLowerCase().includes("non")) {
      return "Non smoker";
    }
    return "Smoker";
  };

  // Локальные состояния для формы (преобразуем из стора)
  const [age, setAge] = useState(insured.age);
  const [sex, setSex] = useState<"male" | "female">(insured.sex === "Male" ? "male" : "female");
  const [smokingHabit, setSmokingHabit] = useState<"Non smoker" | "Smoker">(normalizeSmokingHabit(insured.smokingHabit));
  const [payorToggle, setPayorToggle] = useState(payorEnabled);
  const [payorAge, setPayorAge] = useState(Math.max(payor?.age || 30, 18)); // Минимум 18
  const [payorSex, setPayorSex] = useState<"male" | "female">(payor?.sex === "Male" ? "male" : "female");
  const [payorSmokingHabit, setPayorSmokingHabit] = useState<"Non smoker" | "Smoker">(normalizeSmokingHabit(payor?.smokingHabit || "Non smoker"));

  // Если возраст insured меньше 18, payor обязателен
  const isPayorRequired = age < 18;

  // Автоматически включаем payor, если возраст insured меньше 18
  useEffect(() => {
    if (isPayorRequired && !payorToggle) {
      setPayorToggle(true);
    }
  }, [age, isPayorRequired, payorToggle]);

  // Синхронизация со стором при изменении локальных состояний
  useEffect(() => {
    updateForm({
      insured: {
        age,
        sex: sex === "male" ? "Male" : "Female",
        smokingHabit,
      },
    });
  }, [age, sex, smokingHabit, updateForm]);

  // Синхронизация payorEnabled
  useEffect(() => {
    updateForm({
      payorEnabled: payorToggle,
    });
  }, [payorToggle, updateForm]);

  // Синхронизация данных payor
  useEffect(() => {
    if (payorToggle) {
      // Убеждаемся, что возраст payor не меньше 18
      const validPayorAge = Math.max(payorAge, 18);
      if (validPayorAge !== payorAge) {
        setPayorAge(validPayorAge);
      }
      updateForm({
        payor: {
          age: validPayorAge,
          sex: payorSex === "male" ? "Male" : "Female",
          smokingHabit: payorSmokingHabit,
        },
      });
    }
  }, [payorToggle, payorAge, payorSex, payorSmokingHabit, updateForm]);

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
                onChange={(e) => setSmokingHabit(normalizeSmokingHabit(e.target.value))}
                className="w-full pl-4 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200 appearance-none"
                style={{ 
                  borderRadius: BORDER.borderRadius,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '12px'
                }}
              >
                <option value="Non smoker">Non smoker</option>
                <option value="Smoker">Smoker</option>
              </select>
            </div>

            {/* Payor Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#000000] transition-all duration-200">
                Payor
                {isPayorRequired && (
                  <span className="text-sm font-normal text-gray-600 ml-2">(Required)</span>
                )}
              </h2>
              <label className={`relative inline-flex items-center ${isPayorRequired ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={payorToggle}
                  onChange={(e) => !isPayorRequired && setPayorToggle(e.target.checked)}
                  disabled={isPayorRequired}
                  className="sr-only peer"
                />
                <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#0D175C]/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 ease-in-out peer-checked:bg-[#0D175C] ${isPayorRequired ? 'peer-checked:bg-[#0D175C]' : ''}`}></div>
              </label>
            </div>

            {/* Payor Sections - appears when payor is active */}
            {payorToggle && (
              <>
                {/* Payor Age Section */}
                <div className="flex flex-col gap-4">
                  <div
                    className="bg-white p-6 rounded-lg shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-md animate-fade-in-up"
                    style={{ borderRadius: BORDER.borderRadius }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all duration-200"
                        style={{ backgroundColor: COLORS.PRIMARY }}
                      >
                        Age: {payorAge}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={payorAge}
                      onChange={(e) => setPayorAge(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer transition-all duration-200"
                      style={{
                        background: `linear-gradient(to right, ${COLORS.PRIMARY} 0%, ${COLORS.PRIMARY} ${((payorAge - 18) / (100 - 18)) * 100}%, #e5e7eb ${((payorAge - 18) / (100 - 18)) * 100}%, #e5e7eb 100%)`,
                      }}
                    />
                  </div>
                </div>

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
                    onChange={(e) => setPayorSmokingHabit(normalizeSmokingHabit(e.target.value))}
                    className="w-full pl-4 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-[#000000] focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200 appearance-none"
                    style={{ 
                      borderRadius: BORDER.borderRadius,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23000' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '12px'
                    }}
                  >
                    <option value="Non smoker">Non smoker</option>
                    <option value="Smoker">Smoker</option>
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
