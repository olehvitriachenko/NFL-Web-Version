import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { db } from '../utils/database';
import type { AgentInfo } from '../types/agent';

export const AgentInfoPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AgentInfo>({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const initializeData = async () => {
      await db.init();
      await loadAgents();
      // Load the last saved agent into the form
      const allAgents = await db.getAllAgents();
      if (allAgents.length > 0) {
        const lastAgent = allAgents[0]; // First one is the most recent (ORDER BY createdAt DESC)
        setFormData({
          firstName: lastAgent.firstName,
          lastName: lastAgent.lastName,
          street: lastAgent.street,
          city: lastAgent.city,
          state: lastAgent.state,
          zipCode: lastAgent.zipCode,
          phone: lastAgent.phone,
          email: lastAgent.email,
        });
        setEditingId(lastAgent.id);
      }
    };
    initializeData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.init();
      if (editingId) {
        // Update existing agent
        await db.updateAgent(editingId, formData);
        alert('Agent info updated successfully!');
        // Reload agents to get updated data
        await loadAgents();
        // Update form with data from DB
        const allAgents = await db.getAllAgents();
        const updatedAgent = allAgents.find((a) => a.id === editingId);
        if (updatedAgent) {
          setFormData({
            firstName: updatedAgent.firstName,
            lastName: updatedAgent.lastName,
            street: updatedAgent.street,
            city: updatedAgent.city,
            state: updatedAgent.state,
            zipCode: updatedAgent.zipCode,
            phone: updatedAgent.phone,
            email: updatedAgent.email,
          });
        }
      } else {
        // Create new agent
        const newId = await db.saveAgent(formData);
        alert('Agent info saved successfully!');
        // Set editing ID to the newly created agent
        setEditingId(newId);
        // Reload agents to get the new agent with all data
        await loadAgents();
        // Update form with data from DB
        const allAgents = await db.getAllAgents();
        const newAgent = allAgents.find((a) => a.id === newId);
        if (newAgent) {
          setFormData({
            firstName: newAgent.firstName,
            lastName: newAgent.lastName,
            street: newAgent.street,
            city: newAgent.city,
            state: newAgent.state,
            zipCode: newAgent.zipCode,
            phone: newAgent.phone,
            email: newAgent.email,
          });
        }
      }
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Failed to save agent info');
    }
  };

  const handleEdit = (agent: AgentInfo & { id: number; createdAt: string }) => {
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
    setEditingId(agent.id);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    navigate({ to: '/' });
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const [agents, setAgents] = useState<(AgentInfo & { id: number; createdAt: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, [refreshKey]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      await db.init();
      const allAgents = await db.getAllAgents();
      setAgents(allAgents);
      
      // If editing, update form with latest data from database
      if (editingId) {
        const currentAgent = allAgents.find((a) => a.id === editingId);
        if (currentAgent) {
          setFormData({
            firstName: currentAgent.firstName,
            lastName: currentAgent.lastName,
            street: currentAgent.street,
            city: currentAgent.city,
            state: currentAgent.state,
            zipCode: currentAgent.zipCode,
            phone: currentAgent.phone,
            email: currentAgent.email,
          });
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        await db.deleteAgent(id);
        await loadAgents();
        if (editingId === id) {
          setFormData({
            firstName: '',
            lastName: '',
            street: '',
            city: '',
            state: '',
            zipCode: '',
            phone: '',
            email: '',
          });
          setEditingId(null);
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Failed to delete agent');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OfflineIndicator />
      <PageHeader title="Agent Info" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          {/* New/Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 shadow-sm"
            style={{ borderRadius: 10 }}
          >
            <div className="flex flex-col gap-1">
              <FormField
                label="First Name"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
              <FormField
                label="Last Name"
                name="lastName"
                placeholder="Last Name"
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
              <div className="flex gap-4">
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
                placeholder="Phone"
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
            </div>
            <div className="mt-8 pt-6 flex flex-col gap-1">
              <Button type="submit" fullWidth>
                {editingId ? 'UPDATE' : 'SAVE'}
              </Button>
              {agents.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setFormData({
                      firstName: '',
                      lastName: '',
                      street: '',
                      city: '',
                      state: '',
                      zipCode: '',
                      phone: '',
                      email: '',
                    });
                    setEditingId(null);
                  }}
                >
                  ADD ANOTHER AGENT
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

