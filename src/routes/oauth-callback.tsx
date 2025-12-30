import { createFileRoute } from '@tanstack/react-router';
import { OAuthCallbackPage } from '../pages/OAuthCallbackPage';

export const Route = createFileRoute('/oauth-callback')({
  component: OAuthCallbackPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      code: (search.code as string) || undefined,
      state: (search.state as string) || undefined,
      error: (search.error as string) || undefined,
    };
  },
});

