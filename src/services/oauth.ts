/**
 * OAuth Service - OAuth 2.0 PKCE flow implementation
 */

import CryptoJS from 'crypto-js';
import { getIdentifyUrl, getTokenUrl, getUserInfoUrl, getClientId } from '../config/oauth';
import { db } from '../utils/database';
import type { AgentInfo } from '../types/agent';
import { HttpService } from './auth/httpService';

/**
 * Generate random bytes and convert to base64url
 */
function generateRandomBytes(length: number): string {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...array));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate code challenge from code verifier
 */
function generateCodeChallenge(codeVerifier: string): string {
  const hash = CryptoJS.SHA256(codeVerifier);
  const hashBase64 = hash.toString(CryptoJS.enc.Base64);
  // Convert to base64url
  return hashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Start OAuth authorization flow
 */
export function startOAuthFlow(): void {
  try {
    console.log('[OAuth] Starting authorization flow...');

    // Generate code verifier (32 bytes, base64url)
    const codeVerifier = generateRandomBytes(32);

    // Generate code challenge (SHA256(code_verifier))
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Generate state (16 bytes, base64url)
    const state = generateRandomBytes(16);

    // Store code verifier and state in localStorage for later use
    localStorage.setItem('@oauth_code_verifier', codeVerifier);
    localStorage.setItem('@oauth_auth_state', state);

    console.log('[OAuth] Generated code verifier, challenge, and state');

    // Get identify URL
    const identifyUrl = getIdentifyUrl({
      codeChallenge,
      state,
    });

    console.log('[OAuth] Redirecting to authorization URL:', identifyUrl);

    // Redirect to authorization URL in the same window
    window.location.href = identifyUrl;
  } catch (error) {
    console.error('[OAuth] Error starting authorization:', error);
    throw error;
  }
}

/**
 * Handle OAuth callback - exchange code for token and process user info
 */
export async function handleOAuthCallback(code: string, state: string): Promise<void> {
  try {
    console.log('[OAuth] Handling callback...');

    // Retrieve stored state and code verifier
    const storedState = localStorage.getItem('@oauth_auth_state');
    const storedCodeVerifier = localStorage.getItem('@oauth_code_verifier');

    if (!storedState || !storedCodeVerifier) {
      throw new Error('No stored OAuth state found');
    }

    // Verify state (CSRF protection)
    if (state !== storedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    console.log('[OAuth] State verified, exchanging code for token...');

    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code, storedCodeVerifier);

    console.log('[OAuth] Token received, fetching user info...');

    // Fetch user info
    const userInfo = await fetchAndStoreUserInfo(tokenResponse.access_token);

    // Save OAuth token (temporary)
    localStorage.setItem('@oauth_access_token', tokenResponse.access_token);
    if (tokenResponse.expires_in) {
      const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;
      localStorage.setItem('@oauth_access_token_expires_at', expiresAt.toString());
    }

    // Exchange OAuth token for backend tokens
    console.log('[OAuth] Exchanging OAuth token for backend tokens...');
    let backendResponse: any = null;
    try {
      backendResponse = await Promise.race([
        HttpService.loginNfl(tokenResponse.access_token),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Backend login timeout')), 30000)
        )
      ]) as any;
      
      if (backendResponse?.tokens) {
        console.log('[OAuth] Backend tokens received and saved');
      } else {
        console.warn('[OAuth] Backend login completed but no tokens received');
      }
    } catch (error) {
      console.error('[OAuth] Backend login failed, but continuing with OAuth token:', error);
      // Continue even if backend login fails - we still have OAuth token
      backendResponse = null;
    }

    // Save agent information from backend response (has priority over OAuth userInfo)
    // Use Promise.allSettled to not block on agent save
    const agentSavePromises: Promise<void>[] = [];
    if (backendResponse.user) {
      console.log('[OAuth] Saving agent from backend response...');
      agentSavePromises.push(saveAgentFromUserData(backendResponse.user, userInfo));
    } else if (userInfo) {
      // Fallback to OAuth userInfo if backend doesn't return user data
      console.log('[OAuth] Saving agent from OAuth userInfo...');
      agentSavePromises.push(saveAgentFromUserData(userInfo, userInfo));
    }
    
    // Don't wait for agent save - it's not critical
    if (agentSavePromises.length > 0) {
      Promise.allSettled(agentSavePromises).then((results) => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn(`[OAuth] Agent save ${index} failed:`, result.reason);
          }
        });
      });
    }

    // Clean up OAuth state
    localStorage.removeItem('@oauth_code_verifier');
    localStorage.removeItem('@oauth_auth_state');

    console.log('[OAuth] Callback processed successfully');
  } catch (error) {
    console.error('[OAuth] Error handling callback:', error);
    // Clean up on error
    localStorage.removeItem('@oauth_code_verifier');
    localStorage.removeItem('@oauth_auth_state');
    throw error;
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; expires_in?: number }> {
  try {
    const tokenUrl = getTokenUrl();
    const clientId = getClientId();

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        code_verifier: codeVerifier,
      }),
    });

    console.log('[OAuth] Token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OAuth] Token exchange failed:', response.status, errorText);
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('[OAuth] Token received successfully');
    return data;
  } catch (error) {
    console.error('[OAuth] Error exchanging code for token:', error);
    throw error;
  }
}

/**
 * Fetch and store user info from OAuth provider
 */
async function fetchAndStoreUserInfo(accessToken: string): Promise<any> {
  try {
    const userInfoUrl = getUserInfoUrl();

    const response = await fetch(userInfoUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`User info fetch failed: ${response.status} ${errorText}`);
    }

    const userInfo = await response.json();
    
    console.log('[OAuth] User info received from server:', JSON.stringify(userInfo, null, 2));
    
    // Store user info
    localStorage.setItem('@oauth_user_info', JSON.stringify(userInfo));

    return userInfo;
  } catch (error) {
    console.error('[OAuth] Error fetching user info:', error);
    throw error;
  }
}

/**
 * Save agent information from user data
 */
async function saveAgentFromUserData(user: any, oauthUserInfo?: any): Promise<void> {
  try {
    console.log('[OAuth] Saving agent information...');
    console.log('[OAuth] User data received:', JSON.stringify(user, null, 2));
    if (oauthUserInfo) {
      console.log('[OAuth] OAuth user info:', JSON.stringify(oauthUserInfo, null, 2));
    }

    // Try to extract data from various possible formats
    // Backend response typically has first_name and last_name
    let firstName = 
      user.first_name || 
      user.firstName || 
      user.given_name ||
      user.name?.first ||
      user.name?.firstName ||
      '';
    
    let lastName = 
      user.last_name || 
      user.lastName || 
      user.family_name ||
      user.name?.last ||
      user.name?.lastName ||
      '';

    // If name is a single string (e.g., "Developer App Test"), split it
    if ((!firstName || !lastName) && user.name && typeof user.name === 'string') {
      const nameParts = user.name.trim().split(/\s+/);
      if (nameParts.length > 0) {
        firstName = nameParts[0] || firstName;
      }
      if (nameParts.length > 1) {
        // Join all parts after the first one as last name
        lastName = nameParts.slice(1).join(' ') || lastName;
      }
    }

    const email = 
      user.email || 
      user.email_address ||
      '';

    const phone = 
      oauthUserInfo?.phone || 
      user.phone || 
      user.phone_number ||
      user.telephone ||
      '';

    const street = 
      user.street || 
      user.address?.street || 
      user.address?.street_address ||
      user.address_line1 ||
      '';

    const city = 
      user.city || 
      user.address?.city || 
      '';

    const state = 
      user.state || 
      user.address?.state || 
      user.address?.region ||
      '';

    const zipCode = 
      user.zip_code || 
      user.zipCode || 
      user.zip ||
      user.address?.zipCode || 
      user.address?.postal_code ||
      '';

    const agentInfo: AgentInfo = {
      firstName,
      lastName,
      email,
      phone,
      street,
      city,
      state,
      zipCode,
    };

    console.log('[OAuth] Extracted agent info:', JSON.stringify(agentInfo, null, 2));

    // Only save if we have at least email and one of the name fields
    if (!agentInfo.email) {
      console.warn('[OAuth] No email found in user data, skipping agent save');
      return;
    }

    // Ensure required fields have at least empty strings (not undefined)
    const finalAgentInfo: AgentInfo = {
      firstName: firstName || '',
      lastName: lastName || '',
      email: email,
      phone: phone || '',
      street: street || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
    };

    console.log('[OAuth] Final agent info to save:', JSON.stringify(finalAgentInfo, null, 2));

    // Save agent with timeout to prevent hanging
    const saveAgentWithTimeout = async () => {
      return Promise.race([
        (async () => {
          // Check if agent already exists by email
          const agents = await db.getAllAgents();
          const existingAgent = agents.find(a => a.email === finalAgentInfo.email);

          if (existingAgent) {
            // Update existing agent
            await db.updateAgent(existingAgent.id, finalAgentInfo);
            console.log('[OAuth] Agent information updated, ID:', existingAgent.id);
          } else {
            // Create new agent
            const agentId = await db.saveAgent(finalAgentInfo);
            console.log('[OAuth] Agent information saved, ID:', agentId);
          }
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Agent save timeout')), 5000)
        )
      ]);
    };

    await saveAgentWithTimeout().catch((error) => {
      console.warn('[OAuth] Agent save failed or timed out, continuing anyway:', error);
      // Don't throw - agent save is not critical for auth flow
    });
  } catch (error) {
    console.error('[OAuth] Error saving agent information:', error);
    // Don't throw - agent info save failure shouldn't break auth flow
  }
}

