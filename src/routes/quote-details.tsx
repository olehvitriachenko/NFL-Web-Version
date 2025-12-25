import { createFileRoute } from '@tanstack/react-router';
import { QuoteDetailsPage } from '../pages/QuoteDetailsPage';

export const Route = createFileRoute('/quote-details')({
  component: QuoteDetailsPage,
});
