import { useState, useEffect } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { PageHeader } from '../components/PageHeader';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { navigateBack } from '../utils/navigation';
import { db } from '../utils/database';
import type { AgentInfo } from '../types/agent';
import { useAnalytics } from '../hooks/useAnalytics';

export const AgentInfoPage = () => {
  const navigate = useNavigate();
  const router = useRouter();
  const analytics = useAnalytics();
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateField = (name: string, value: string): string => {
    if (!value.trim()) {
      if (name === 'zipCode') {
        return 'ZIP code is required';
      }
      return `${name === 'firstName' ? 'First Name' : name === 'lastName' ? 'Last Name' : name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }
    
    if (name === 'zipCode' && value.trim().length !== 5) {
      return 'ZIP code must be 5 digits';
    }
    
    if (name === 'zipCode' && !/^\d+$/.test(value.trim())) {
      return 'ZIP code must be 5 digits';
    }
    
    return '';
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    analytics.trackInputFocus(name, 'agent_info_form');
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    analytics.trackInputBlur(name, 'agent_info_form');
    
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }
    if (!formData.street.trim()) {
      newErrors.street = 'Street is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (formData.zipCode.trim().length !== 5 || !/^\d+$/.test(formData.zipCode.trim())) {
      newErrors.zipCode = 'ZIP code must be 5 digits';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        setErrors({});
      }
    };
    initializeData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      analytics.trackFormInteraction('agent_info_form', 'submit', Object.keys(formData).length);
      analytics.trackEvent('agent_info_validation_error', {
        fields_count: Object.keys(formData).length,
        errors_count: Object.keys(errors).length
      });
      return;
    }
    
    analytics.trackFormInteraction('agent_info_form', 'submit', Object.keys(formData).length);
    
    try {
      await db.init();
      if (editingId) {
        // Update existing agent
        await db.updateAgent(editingId, formData);
        
        // Отслеживание обновления информации об агенте
        analytics.trackEvent('agent_info_updated', {
          agent_id: editingId,
          has_email: !!formData.email,
          has_phone: !!formData.phone
        });
        
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
          setErrors({});
        }
      } else {
        // Create new agent
        const newId = await db.saveAgent(formData);
        
        // Отслеживание сохранения новой информации об агенте
        analytics.trackEvent('agent_info_created', {
          agent_id: newId,
          has_email: !!formData.email,
          has_phone: !!formData.phone
        });
        
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
          setErrors({});
        }
      }
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error saving agent:', error);
      alert('Failed to save agent info');
    }
  };

  const handleBack = () => {
    navigateBack(router, () => navigate({ to: '/home' }));
  };

  const handleHome = () => {
    navigate({ to: '/home' });
  };

  const [agents, setAgents] = useState<(AgentInfo & { id: number; createdAt: string })[]>([]);

  useEffect(() => {
    loadAgents();
  }, [refreshKey]);

  const loadAgents = async () => {
    try {
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
          setErrors({});
        }
      }
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Agent Info" onBack={handleBack} onHome={handleHome} />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-6">
        <div className="w-full max-w-[600px]">
          {/* New/Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8"
            style={{ borderRadius: 10 }}
          >
            <div className="flex flex-col gap-4">
              <FormField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.firstName}
                required
              />
              <FormField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.lastName}
                required
              />
              <FormField
                label="Street"
                name="street"
                value={formData.street}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.street}
                required
              />
              <FormField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.city}
                required
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <FormField
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    error={errors.state}
                    required
                  />
                </div>
                <div className="flex-1">
                  <FormField
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    error={errors.zipCode}
                    required
                  />
                </div>
              </div>
              <FormField
                label="Phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.phone}
                required
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.email}
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
                    setErrors({});
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

