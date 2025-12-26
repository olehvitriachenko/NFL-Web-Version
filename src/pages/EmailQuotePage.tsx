import { useState, useEffect } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { PageHeader } from "../components/PageHeader";
import { OfflineIndicator } from "../components/OfflineIndicator";
import { Button } from "../components/Button";
import { FormField } from "../components/FormField";
import { navigateBack } from "../utils/navigation";
import { BORDER, COLORS } from "../constants/theme";
import { db } from "../utils/database";

export const EmailQuotePage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [clientStreet, setClientStreet] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientState, setClientState] = useState("");
  const [clientZipCode, setClientZipCode] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("email@email.com");
  const [payorFirstName, setPayorFirstName] = useState("");
  const [payorLastName, setPayorLastName] = useState("");
  const [payorEmail, setPayorEmail] = useState("email@email.com");

  // Mock quote data - will be replaced with API data
  const quoteData = {
    details: "Male/Age 30/Non smoker $10,000",
    initialPremium: "Initial Contract Premium: $14.73/Monthly",
  };

  useEffect(() => {
    const loadAgentInfo = async () => {
      try {
        await db.init();
        const agents = await db.getAllAgents();
        if (agents.length > 0) {
          setAgentInfo(agents[0]);
        } else {
          // Mock agent data if no agent in database
          setAgentInfo({
            firstName: "John",
            lastName: "Doe",
            phone: "(940) 123 4567",
            email: "web.dev.test@nflic.com",
          });
        }
      } catch (error) {
        console.error("Error loading agent info:", error);
        // Fallback to mock data
        setAgentInfo({
          firstName: "John",
          lastName: "Doe",
          phone: "(940) 123 4567",
          email: "web.dev.test@nflic.com",
        });
      }
    };

    loadAgentInfo();
  }, []);

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: "/home" });
  };

  const handleEditInformation = () => {
    navigate({ to: "/agent-info" });
  };

  const handleViewPDF = () => {
    // TODO: Generate and view PDF
    console.log("View PDF");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Email Quote" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          <div className="flex flex-col gap-6">
            {/* Quote Details */}
            <div className="bg-gray-100 p-5 rounded-lg border border-gray-200" style={{ borderRadius: BORDER.borderRadius }}>
              <p className="text-[#000000] text-base mb-2 font-medium">{quoteData.details}</p>
              <p className="text-[#000000] text-base">{quoteData.initialPremium}</p>
            </div>

            {/* Agent Information */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                Agent Information
              </h2>
              {agentInfo && (
                <div className="bg-gray-100 p-5 rounded-lg mb-3 border border-gray-200" style={{ borderRadius: BORDER.borderRadius }}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[#000000] text-base font-medium">
                      {agentInfo.firstName} {agentInfo.lastName} (test account)
                    </p>
                    <p className="text-[#000000] text-base">{agentInfo.phone || "(940) 123 4567"}</p>
                  </div>
                  <p className="text-[#000000] text-base">{agentInfo.email || "web.dev.test@nflic.com"}</p>
                </div>
              )}
              <button
                onClick={handleEditInformation}
                className="text-[#0D175C] hover:text-[#39458C] transition-colors text-sm font-medium underline"
              >
                EDIT INFORMATION
              </button>
            </div>

            {/* Client Information */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                Client Information
              </h2>
              <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
                <div className="flex flex-col gap-4">
                <FormField
                  label="First Name"
                  name="clientFirstName"
                  placeholder="First Name"
                  value={clientFirstName}
                  onChange={(e) => setClientFirstName(e.target.value)}
                />
                <FormField
                  label="Last Name"
                  name="clientLastName"
                  placeholder="Last Name"
                  value={clientLastName}
                  onChange={(e) => setClientLastName(e.target.value)}
                />
                <FormField
                  label="Street"
                  name="clientStreet"
                  placeholder="Street"
                  value={clientStreet}
                  onChange={(e) => setClientStreet(e.target.value)}
                />
                <FormField
                  label="City"
                  name="clientCity"
                  placeholder="City"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                />
                <div className="flex gap-4">
                  <div className="flex-1">
                    <FormField
                      label="State"
                      name="clientState"
                      placeholder="State"
                      value={clientState}
                      onChange={(e) => setClientState(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      label="ZIP Code"
                      name="clientZipCode"
                      placeholder="00000"
                      value={clientZipCode}
                      onChange={(e) => setClientZipCode(e.target.value)}
                    />
                  </div>
                </div>
                <FormField
                  label="Phone"
                  name="clientPhone"
                  type="tel"
                  placeholder="(405) 918 9876"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
                <FormField
                  label="Email"
                  name="clientEmail"
                  type="email"
                  placeholder="email@email.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
                </div>
              </div>
            </div>

            {/* Payor Information */}
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.PRIMARY }}>
                Payor Information
              </h2>
              <div className="bg-white p-6 rounded-lg shadow-sm" style={{ borderRadius: BORDER.borderRadius }}>
                <div className="flex flex-col gap-4">
                <FormField
                  label="Payor First Name"
                  name="payorFirstName"
                  placeholder="First Name"
                  value={payorFirstName}
                  onChange={(e) => setPayorFirstName(e.target.value)}
                />
                <FormField
                  label="Payor Last Name"
                  name="payorLastName"
                  placeholder="Last Name"
                  value={payorLastName}
                  onChange={(e) => setPayorLastName(e.target.value)}
                />
                <FormField
                  label="Payor Email"
                  name="payorEmail"
                  type="email"
                  placeholder="email@email.com"
                  value={payorEmail}
                  onChange={(e) => setPayorEmail(e.target.value)}
                />
                </div>
              </div>
            </div>

            {/* View PDF Button */}
            <div className="flex flex-col gap-4">
              <Button onClick={handleViewPDF} fullWidth>
                VIEW PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

