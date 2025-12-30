import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { navigateBack } from "../utils/navigation";
import { BORDER, COLORS } from "../constants/theme";
import { useQuickFormStore } from "../stores/QuickFormStore";

export const QuoteFormPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const { insured, payorEnabled, payor, updateForm } = useQuickFormStore();

  // Функция для нормализации smoking habit (приводит к формату опций select)
  const normalizeSmokingHabit = (value: string): "Non smoker" | "Standard" => {
    if (value === "Non-smoker" || value === "Non smoker" || value.toLowerCase().includes("non")) {
      return "Non smoker";
    }
    return "Standard";
  };

  // Локальные состояния для формы (преобразуем из стора)
  const [age, setAge] = useState(insured.age || 30);
  const [sex, setSex] = useState<"male" | "female">(insured.sex === "Male" ? "male" : "female");
  const [smokingHabit, setSmokingHabit] = useState<"Non smoker" | "Standard">(normalizeSmokingHabit(insured.smokingHabit));
  const [payorToggle, setPayorToggle] = useState(payorEnabled);
  const [payorAge, setPayorAge] = useState(Math.max(payor?.age || 30, 18)); // Минимум 18
  const [payorSex, setPayorSex] = useState<"male" | "female">(payor?.sex === "Male" ? "male" : "female");
  const [payorSmokingHabit, setPayorSmokingHabit] = useState<"Non smoker" | "Standard">(normalizeSmokingHabit(payor?.smokingHabit || "Non smoker"));

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
      <PageHeader
        title="Quick Client Setup"
        onBack={handleBack}
        onHome={handleHome}
      />
      <div className="flex items-start justify-center px-6 pt-4 pb-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-4">
            {/* Insured Section */}
            <div className="flex flex-col gap-2">
              <label className="text-base font-bold text-black">Insured</label>
              <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#0D175C] text-white rounded-xl text-sm font-semibold">
                Age: {age}
              </span>
              </div>
              <div className="relative mt-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, ${COLORS.PRIMARY_LIGHT} 0%, ${COLORS.PRIMARY_LIGHT} ${((age) / (100)) * 100}%, #e5e7eb ${((age) / (100)) * 100}%, #e5e7eb 100%)`
                  }}
                />
                <style>{`
                  .slider::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: 2px solid #0D175C;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  }
                  .slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: white;
                    cursor: pointer;
                    border: 2px solid #0D175C;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  }
                `}</style>
              </div>
            </div>

            {/* Sex Section */}
            <div className="flex flex-col gap-2">
            <label className="px-3 py-1 bg-[#0D175C] text-white rounded-xl text-sm font-semibold w-fit">Sex</label>
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
            <label className="px-3 py-1 bg-[#0D175C] text-white rounded-xl text-sm font-semibold w-fit">Smoking Habit</label>
            <div className="relative">
              <select
                value={smokingHabit}
                onChange={(e) => setSmokingHabit(normalizeSmokingHabit(e.target.value))}
                className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200 appearance-none cursor-pointer"
                style={{ borderRadius: BORDER.borderRadius }}
              >
                <option value="Non smoker">Non smoker</option>
                <option value="Standard">Standard</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            </div>

            {/* Payor Section */}
            <div className="flex items-center justify-between">
              <label className="text-base font-bold text-black">
                Payor
              </label>
              <button
                type="button"
                onClick={() => !isPayorRequired && setPayorToggle(!payorToggle)}
                disabled={isPayorRequired}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#39458C] focus:ring-offset-2 ${
                  payorToggle ? "bg-[#39458C]" : "bg-gray-300"
                } ${isPayorRequired ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    payorToggle ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Payor Sections - appears when payor is active */}
            {payorToggle && (
              <>
                {/* Payor Age Section */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#0D175C] text-white rounded-xl text-sm font-semibold">
                      Age: {payorAge}
                    </span>
                  </div>
                  <div className="relative mt-2">
                    <input
                      type="range"
                      min="18"
                      max="100"
                      value={payorAge}
                      onChange={(e) => setPayorAge(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #39458C 0%, #39458C ${((payorAge - 18) / (100 - 18)) * 100}%, #e5e7eb ${((payorAge - 18) / (100 - 18)) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                </div>

                {/* Payor Sex Section */}
                <div className="flex flex-col gap-2">
                  <label className="px-3 py-1 bg-[#0D175C] text-white rounded-xl text-sm font-semibold w-fit">Sex</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setPayorSex("male")}
                      className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${                        payorSex === "male"
                          ? "bg-[#39458C] text-white"
                          : "bg-[#0D175C80] text-white"
                      }`}
                      style={{ borderRadius: BORDER.borderRadius }}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => setPayorSex("female")}
                      className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${                        payorSex === "female"
                          ? "bg-[#39458C] text-white"
                          : "bg-[#0D175C80] text-white"
                      }`}
                      style={{ borderRadius: BORDER.borderRadius }}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Payor Smoking Habit Section */}
                <div className="flex flex-col gap-2">
                  <label className="px-3 py-1 bg-[#0D175C] text-white rounded-xl text-sm font-semibold w-fit">Smoking Habit</label>
                  <div className="relative">
                    <select
                      value={payorSmokingHabit}
                      onChange={(e) => setPayorSmokingHabit(normalizeSmokingHabit(e.target.value))}
                      className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg text-black focus:outline-none focus:border-[#0D175C] focus:ring-4 focus:ring-[#0D175C]/10 transition-all duration-200 appearance-none cursor-pointer"
                      style={{ borderRadius: BORDER.borderRadius }}
                    >
                      <option value="Non smoker">Non smoker</option>
                      <option value="Standard">Standard</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
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
