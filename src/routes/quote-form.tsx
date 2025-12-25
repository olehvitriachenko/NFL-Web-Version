import { createFileRoute } from '@tanstack/react-router';
import { QuoteFormPage } from '../pages/QuoteFormPage';

export const Route = createFileRoute('/quote-form')({
  component: QuoteFormPage,
});
