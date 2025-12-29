import { createFileRoute } from '@tanstack/react-router';
import { ConfigureQuotePage } from '../pages/ConfigureQuotePage';

export const Route = createFileRoute('/configure-quote')({
  component: ConfigureQuotePage,
});
