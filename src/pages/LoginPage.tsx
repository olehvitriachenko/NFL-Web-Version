import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "../components/Button";
import nflLogo from "/nfl_brand_logo.png";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);

  const handleStart = () => {
    setIsOpening(true);
    // Симуляція відкриття браузера для автентифікації
    setTimeout(() => {
      navigate({ to: "/home" });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-[10px]">
      <div className="w-full max-w-md">
        <div
          className="bg-white shadow-lg px-[10px] py-[15px] flex flex-col gap-[60px]"
          style={{ borderRadius: 10 }}
        >
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-16">
              <img
                src={nflLogo}
                alt="National FARM • LIFE"
                className="h-28 object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-[#000000] mb-6">
              Welcome to
            </h1>
            <h2 className="text-4xl font-bold text-[#0D175C] mb-8">
              National Farm Life
            </h2>
            <p className="text-gray-500 text-base">
              Please choose your login method
            </p>
          </div>

          {/* Start Button */}
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={handleStart}
              fullWidth
              disabled={isOpening}
              className="shadow-md"
            >
              {isOpening ? "OPENING..." : "START WITH NFL"}
            </Button>

            {isOpening && (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D175C]"></div>
                <p className="text-gray-500 text-sm">
                  Opening browser for authentication...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
