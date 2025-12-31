import { createFileRoute } from '@tanstack/react-router';
import { FirebaseTestPage } from '../pages/FirebaseTestPage';

export const Route = createFileRoute('/firebase-test')({
  component: FirebaseTestPage,
});
