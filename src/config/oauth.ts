export type OAuthEnvironment = "dev" | "prod";

export const getOAuthEnvironment = (): OAuthEnvironment => {
  if (import.meta.env.DEV) {
    return "dev";
  }
  return "prod";
};

export const oauthConfig = {
  dev: {
    authServerBaseUrl:
      "https://authapp.test.agents.nflic.com/client/nflsi/illustrator",
    clientId: "MKU_i8xyRPwdbfjdakT4bZsbTs-0EpnIDeF7fi1aHcs",
  },
  prod: {
    authServerBaseUrl:
      "https://authapp.test.agents.nflic.com/client/nflsi/illustrator",
    clientId: "MKU_i8xyRPwdbfjdakT4bZsbTs-0EpnIDeF7fi1aHcs",
  },
};

export const getOAuthConfig = () => {
  const env = getOAuthEnvironment();
  return oauthConfig[env];
};

export const getClientId = (): string => {
  return getOAuthConfig().clientId;
};

/**
 * Check if running in Electron
 */
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof (window as any).electron !== 'undefined';
};

/**
 * Get callback URI based on current environment
 * For dev: http://localhost:5173/oauth/callback
 * For Electron production: nfl-app://oauth-callback
 * For web production: uses environment variable or constructs from window location
 */
export const getCallbackUri = (): string => {
  if (import.meta.env.DEV) {
    // Development: use localhost
    return "http://localhost:5173/oauth-callback";
  }
  
  // Check if running in Electron
  if (isElectron()) {
    // Electron production: use custom protocol
    return 'nfl-app://oauth-callback';
  }
  
  // Web production: use environment variable or construct from window location
  const prodCallback = import.meta.env.VITE_OAUTH_CALLBACK_URL;
  if (prodCallback) {
    return prodCallback;
  }

  // Fallback: try to construct from current window location
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    // Only use origin if it's http/https, not file://
    if (origin && !origin.startsWith("file://")) {
      return `${origin}/oauth-callback`;
    }
  }

  // Last resort: return relative path
  return "/oauth-callback";
};

export const getAuthServerBaseUrl = (): string => {
  return getOAuthConfig().authServerBaseUrl;
};

export const getIdentifyUrl = (params: {
  codeChallenge: string;
  state: string;
}): string => {
  const baseUrl = getAuthServerBaseUrl();
  const clientId = getClientId();
  const callbackUri = getCallbackUri();

  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    callback_uri: callbackUri,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    state: params.state,
  });

  return `${baseUrl}/identify?${queryParams.toString()}`;
};

export const getTokenUrl = (): string => {
  const baseUrl = getAuthServerBaseUrl();
  return `${baseUrl}/token`;
};

export const getUserInfoUrl = (): string => {
  const baseUrl = getAuthServerBaseUrl();
  return `${baseUrl}/userinfo`;
};
