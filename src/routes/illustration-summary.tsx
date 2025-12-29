import { createFileRoute } from '@tanstack/react-router';
import { IllustrationSummaryPage } from '../pages/IllustrationSummaryPage';

export const Route = createFileRoute('/illustration-summary')({
  component: IllustrationSummaryPage,
});
