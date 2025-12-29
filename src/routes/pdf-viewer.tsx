import { createFileRoute } from '@tanstack/react-router';
import { PDFViewerPage } from '../pages/PDFViewerPage';

export const Route = createFileRoute('/pdf-viewer')({
  component: PDFViewerPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      file: (search.file as string) || null,
    };
  },
});


