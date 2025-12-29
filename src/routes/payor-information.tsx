import { createFileRoute } from '@tanstack/react-router';
import { PayorInformationPage } from '../pages/PayorInformationPage';

export const Route = createFileRoute('/payor-information')({
  component: PayorInformationPage,
});
