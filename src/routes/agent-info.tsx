import { createFileRoute } from '@tanstack/react-router';
import { AgentInfoPage } from '../pages/AgentInfoPage';

export const Route = createFileRoute('/agent-info')({
  component: AgentInfoPage,
});

