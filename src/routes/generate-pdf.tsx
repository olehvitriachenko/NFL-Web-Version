import { createFileRoute } from '@tanstack/react-router';
import { GeneratePDFPage } from '../pages/GeneratePDFPage';

export const Route = createFileRoute('/generate-pdf')({
  component: GeneratePDFPage,
});
