import { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { Button } from './Button';
import { db } from '../utils/database';
import type { AgentInfo } from '../types/agent';

interface AgentFormProps {
  agent: AgentInfo & { id: number; createdAt: string };
  onDelete: (id: number) => void;
  onUpdate: () => void;
}

export const AgentForm = ({ agent, onDelete, onUpdate }: AgentFormProps) => {
  const [formData, setFormData] = useState<AgentInfo>({
    firstName: agent.firstName,
    lastName: agent.lastName,
    street: agent.street,
    city: agent.city,
    state: agent.state,
    zipCode: agent.zipCode,
    phone: agent.phone,
    email: agent.email,
  });

  useEffect(() => {
    setFormData({
      firstName: agent.firstName,
      lastName: agent.lastName,
      street: agent.street,
      city: agent.city,
      state: agent.state,
      zipCode: agent.zipCode,
      phone: agent.phone,
      email: agent.email,
    });
  }, [agent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.updateAgent(agent.id, formData);
      alert('Agent updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Failed to update agent');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 shadow-sm"
      style={{ borderRadius: 10 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-[#000000]">
          {agent.firstName} {agent.lastName}
        </h3>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onDelete(agent.id)}
        >
          DELETE
        </Button>
      </div>
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
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <FormField
            label="State"
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
          />
        </div>
        <div className="flex-1">
          <FormField
            label="ZIP Code"
            name="zipCode"
            placeholder="00000"
            value={formData.zipCode}
            onChange={handleChange}
          />
        </div>
      </div>
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
      />
      <FormField
        label="Email (required)"
        name="email"
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <div className="mt-8 pt-6">
        <Button type="submit" fullWidth>
          UPDATE
        </Button>
      </div>
    </form>
  );
};

