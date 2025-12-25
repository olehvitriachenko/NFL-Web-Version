import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { OfflineIndicator } from '../components/OfflineIndicator';

interface AgentInfoPageProps {
  onBack: () => void;
  onHome: () => void;
  onSave?: (data: AgentInfo) => void;
}

export interface AgentInfo {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
}

export const AgentInfoPage = ({ onBack, onHome, onSave }: AgentInfoPageProps) => {
  const [formData, setFormData] = useState<AgentInfo>({
    firstName: 'John',
    lastName: 'Doe (test account)',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '(940) 123 4567',
    email: 'web.dev.test@nflic.com',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    // Можна додати повідомлення про успішне збереження
    alert('Agent info saved!');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Agent Info" onBack={onBack} onHome={onHome} />
      <div className="max-w-[600px] mx-auto px-6 py-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl p-8 shadow-sm"
        >
          <FormField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
          <FormField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
          <FormField
            label="Street"
            name="street"
            placeholder="Street"
            value={formData.street}
            onChange={handleChange}
          />
          <FormField
            label="City"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
          />
          <FormField
            label="State"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
          />
          <FormField
            label="ZIP Code"
            name="zipCode"
            placeholder="00000"
            value={formData.zipCode}
            onChange={handleChange}
          />
          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <div className="mt-8 pt-6">
            <Button type="submit" fullWidth>
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

