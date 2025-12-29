import { createFileRoute } from '@tanstack/react-router';
import { QuickQuotePage } from '../pages/QuickQuotePage';

export const Route = createFileRoute('/quick-quote')({
  component: QuickQuotePage,
});
