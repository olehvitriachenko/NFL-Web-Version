import { createFileRoute } from '@tanstack/react-router';
import { EmailQuotePage } from '../pages/EmailQuotePage';

export const Route = createFileRoute('/email-quote')({
  component: EmailQuotePage,
});
