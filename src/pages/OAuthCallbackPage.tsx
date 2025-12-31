import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { handleOAuthCallback } from '../services/oauth';
import { useAnalytics } from '../hooks/useAnalytics';

// Check if running in Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).electron !== 'undefined';
};

export const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const search = useSearch({ from: '/oauth-callback' });
  const analytics = useAnalytics();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[OAuthCallback] useEffect triggered');
    console.log('[OAuthCallback] Current URL:', window.location.href);
    console.log('[OAuthCallback] Search params:', window.location.search);
    console.log('[OAuthCallback] Hash:', window.location.hash);
    
    const processCallback = async (code: string, state: string, errorParam?: string) => {
      try {
        console.log('[OAuthCallback] processCallback called with:', { 
          code: code ? code.substring(0, 20) + '...' : 'missing', 
          state: state || 'missing',
          errorParam 
        });

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code || !state) {
          throw new Error('Missing code or state in callback URL');
        }

        console.log('[OAuthCallback] Processing callback...');
        console.log('[OAuthCallback] Code:', code.substring(0, 20) + '...');
        console.log('[OAuthCallback] State:', state);

        // Handle OAuth callback with timeout
        try {
          await Promise.race([
            handleOAuthCallback(code, state),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('OAuth callback timeout after 60 seconds')), 60000)
            )
          ]);

          console.log('[OAuthCallback] Callback processed successfully');
          setStatus('success');

          // Отслеживание успешного логина
          analytics.trackEvent('login_success', {
            method: 'oauth',
            provider: 'nflic'
          });

          // Redirect to home page after a short delay
          setTimeout(() => {
            console.log('[OAuthCallback] Navigating to /home...');
            navigate({ to: '/home' });
          }, 1000);
        } catch (timeoutError) {
          console.error('[OAuthCallback] Timeout or error:', timeoutError);
          // Even on timeout, try to navigate if we have tokens
          const hasTokens = localStorage.getItem('@oauth_access_token') || 
                           localStorage.getItem('@auth_refresh_token');
          if (hasTokens) {
            console.log('[OAuthCallback] Has tokens, navigating anyway...');
            setStatus('success');
            setTimeout(() => {
              navigate({ to: '/home' });
            }, 500);
          } else {
            throw timeoutError;
          }
        }
      } catch (err) {
        console.error('[OAuthCallback] Error processing callback:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to process OAuth callback';
        setError(errorMessage);
        setStatus('error');
        
        // Отслеживание ошибки логина
        analytics.trackEvent('login_error', {
          method: 'oauth',
          provider: 'nflic',
          error: errorMessage
        });
      }
    };

    // Always check URL parameters first (works in both Electron and web)
    // In Electron, params might be in hash: #/oauth-callback?code=...&state=...
    let urlParams = new URLSearchParams(window.location.search);
    
    // If no params in search, check hash - this is critical for Electron file:// protocol
    if (!urlParams.get('code') && !urlParams.get('state') && !urlParams.get('error')) {
      const hash = window.location.hash;
      console.log('[OAuthCallback] Checking hash for params:', hash);
      if (hash.includes('?')) {
        const hashQuery = hash.substring(hash.indexOf('?') + 1);
        console.log('[OAuthCallback] Hash query string:', hashQuery);
        urlParams = new URLSearchParams(hashQuery);
      }
    }
    
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');

    console.log('[OAuthCallback] URL params extracted:', { 
      code: code ? code.substring(0, 20) + '...' : null, 
      state: state || null, 
      errorParam: errorParam || null 
    });

    // Process URL parameters FIRST if available (for HTTP-based callback in dev mode)
    if (code && state) {
      console.log('[OAuthCallback] Processing callback from URL parameters...');
      processCallback(code, state, errorParam || undefined);
      return; // Exit early - don't set up protocol listener if we already have URL params
    } else if (errorParam) {
      console.log('[OAuthCallback] Processing error from URL parameters...');
      processCallback('', '', errorParam);
      return; // Exit early
    }

    // If no URL parameters, check if running in Electron and wait for protocol callback
    if (isElectron()) {
      console.log('[OAuthCallback] No URL params, running in Electron, setting up protocol listener...');
      
      // Listen for OAuth callback from main process (protocol-based callback)
      const electron = (window as any).electron;
      if (electron && electron.onOAuthCallback) {
        console.log('[OAuthCallback] Electron IPC available, registering callback listener...');
        
        let callbackReceived = false;
        const cleanup = electron.onOAuthCallback((data: { code?: string; state?: string; error?: string; errorDescription?: string }) => {
          console.log('[OAuthCallback] ===== Received callback from Electron protocol =====');
          console.log('[OAuthCallback] Data received:', {
            code: data.code ? data.code.substring(0, 20) + '...' : undefined,
            state: data.state,
            error: data.error
          });
          callbackReceived = true;
          if (data.error) {
            processCallback('', '', data.error);
          } else if (data.code && data.state) {
            processCallback(data.code, data.state);
          } else {
            console.warn('[OAuthCallback] Protocol callback missing code/state');
            setError('Missing code or state in callback');
            setStatus('error');
          }
        });

        // Set timeout for protocol callback (increased to 15 seconds)
        const timeout = setTimeout(() => {
          if (!callbackReceived) {
            console.error('[OAuthCallback] ❌ Timeout waiting for protocol callback after 15 seconds');
            setError('Missing code or state in callback URL');
            setStatus('error');
          }
        }, 15000);

        // Cleanup on unmount
        return () => {
          clearTimeout(timeout);
          if (cleanup) cleanup();
        };
      } else {
        console.warn('[OAuthCallback] Electron IPC not available');
        setError('Missing code or state in callback URL');
        setStatus('error');
      }
    } else {
      // Web mode, no URL params, no protocol - error
      console.warn('[OAuthCallback] No code, state, or error in URL parameters (web mode)');
      setError('Missing code or state in callback URL');
      setStatus('error');
    }
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

