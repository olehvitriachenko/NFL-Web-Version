import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { handleOAuthCallback } from '../services/oauth';

export const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const search = useSearch({ from: '/oauth-callback' });
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract code and state from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const errorParam = urlParams.get('error');

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code || !state) {
          throw new Error('Missing code or state in callback URL');
        }

        console.log('[OAuthCallback] Processing callback...');

        // Handle OAuth callback
        await handleOAuthCallback(code, state);

        console.log('[OAuthCallback] Callback processed successfully');
        setStatus('success');

        // Redirect to home page after a short delay
        setTimeout(() => {
          navigate({ to: '/home' });
        }, 1000);
      } catch (err) {
        console.error('[OAuthCallback] Error processing callback:', err);
        setError(err instanceof Error ? err.message : 'Failed to process OAuth callback');
        setStatus('error');
      }
    };

    processCallback();
  }, [navigate, search]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-[10px]">
      <div className="w-full max-w-md">
        <div className="px-[10px] py-[15px] flex flex-col gap-6 items-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D175C]"></div>
              <p className="text-gray-600 text-lg">Processing authentication...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <p className="text-gray-600 text-lg">Authentication successful!</p>
              <p className="text-gray-500 text-sm">Redirecting to home page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-500 text-5xl mb-4">✗</div>
              <p className="text-red-600 text-lg font-semibold">Authentication failed</p>
              <p className="text-gray-600 text-sm text-center mb-4">{error}</p>
              <button
                onClick={() => navigate({ to: '/' })}
                className="px-6 py-2 bg-[#0D175C] text-white rounded hover:bg-[#0a1245] transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

