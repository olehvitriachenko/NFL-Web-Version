import { useEffect, useState } from 'react';
import { FiTrash2, FiEdit } from 'react-icons/fi';
import type { AgentInfo } from '../types/agent';
import { db } from '../utils/database';

interface AgentListProps {
  onEdit?: (agent: AgentInfo & { id: number; createdAt: string }) => void;
}

export const AgentList = ({ onEdit }: AgentListProps) => {
  const [agents, setAgents] = useState<(AgentInfo & { id: number; createdAt: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      await db.init();
      const allAgents = await db.getAllAgents();
      setAgents(allAgents);
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
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Failed to delete agent');
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No saved agents yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          style={{ borderRadius: 10 }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#000000] mb-2">
                {agent.firstName} {agent.lastName}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Email:</span> {agent.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {agent.phone}
                </p>
                {agent.street && (
                  <p>
                    <span className="font-medium">Address:</span> {agent.street}
                    {agent.city && `, ${agent.city}`}
                    {agent.state && `, ${agent.state}`}
                    {agent.zipCode && ` ${agent.zipCode}`}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Saved: {new Date(agent.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              {onEdit && (
                <button
                  onClick={() => onEdit(agent)}
                  className="p-2 text-[#0D175C] hover:bg-gray-100 transition-colors"
                  style={{ borderRadius: 10 }}
                  aria-label="Edit"
                >
                  <FiEdit size={18} />
                </button>
              )}
              <button
                onClick={() => handleDelete(agent.id)}
                className="p-2 text-red-600 hover:bg-red-50 transition-colors"
                style={{ borderRadius: 10 }}
                aria-label="Delete"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

