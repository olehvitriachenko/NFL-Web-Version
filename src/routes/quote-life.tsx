import { createFileRoute } from '@tanstack/react-router';
import { SetupClientPage } from '../pages/SetupClientPage';

export const Route = createFileRoute('/quote-life')({
  component: SetupClientPage,
});
