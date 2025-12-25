import { createFileRoute } from '@tanstack/react-router';
import { ClientInformationPage } from '../pages/ClientInformationPage';

export const Route = createFileRoute('/client-information')({
  component: ClientInformationPage,
});
