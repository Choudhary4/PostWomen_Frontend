import { environmentService } from './environmentService';

class OAuthService {
  constructor() {
    this.providers = new Map();
    this.activeTokens = new Map();
    this.refreshTimers = new Map();
    
    // Load saved providers and tokens from localStorage
    this.loadSavedData();
  }

  // OAuth Provider Management
  addProvider(provider) {
    const providerId = provider.id || `provider_${Date.now()}`;
    const fullProvider = {
      ...provider,
      id: providerId,
      createdAt: new Date().toISOString()
    };
    
    this.providers.set(providerId, fullProvider);
    this.saveProviders();
    return fullProvider;
  }

  updateProvider(providerId, updates) {
    const provider = this.providers.get(providerId);
    if (provider) {
      const updatedProvider = { ...provider, ...updates, updatedAt: new Date().toISOString() };
      this.providers.set(providerId, updatedProvider);
      this.saveProviders();
      return updatedProvider;
    }
    return null;
  }

  deleteProvider(providerId) {
    const deleted = this.providers.delete(providerId);
    if (deleted) {
      this.saveProviders();
      // Also clean up any associated tokens
      this.activeTokens.delete(providerId);
      this.clearRefreshTimer(providerId);
    }
    return deleted;
  }

  getProvider(providerId) {
    return this.providers.get(providerId);
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  // OAuth 2.0 Flow Implementation
  async startAuthorizationCodeFlow(providerId, requestData = {}) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error('OAuth provider not found');
    }

    if (provider.grantType !== 'authorization_code') {
      throw new Error('Provider is not configured for authorization code flow');
    }

    // Generate state parameter for security
    const state = this.generateSecureRandom();
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    // Store state and code verifier for later verification
    const authSession = {
      state,
      codeVerifier,
      providerId,
      requestData,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(`oauth_session_${state}`, JSON.stringify(authSession));

    // Build authorization URL
    const authUrl = new URL(provider.authorizationUrl);
    const params = {
      client_id: provider.clientId,
      redirect_uri: provider.redirectUri,
      response_type: 'code',
      scope: provider.scope || '',
      state: state,
      ...(provider.usePKCE && {
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      })
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value) authUrl.searchParams.set(key, value);
    });

    // Open authorization URL in new window
    const authWindow = window.open(
      authUrl.toString(),
      'oauth_auth',
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // Monitor for the redirect
    return this.monitorAuthWindow(authWindow, state);
  }

  async handleAuthorizationCallback(callbackUrl) {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`OAuth authorization failed: ${error}`);
    }

    if (!code || !state) {
      throw new Error('Invalid authorization callback: missing code or state');
    }

    // Retrieve and validate session
    const sessionData = sessionStorage.getItem(`oauth_session_${state}`);
    if (!sessionData) {
      throw new Error('Invalid or expired authorization session');
    }

    const session = JSON.parse(sessionData);
    sessionStorage.removeItem(`oauth_session_${state}`);

    // Exchange code for tokens
    return this.exchangeCodeForTokens(session, code);
  }

  async exchangeCodeForTokens(session, code) {
    const provider = this.getProvider(session.providerId);
    if (!provider) {
      throw new Error('OAuth provider not found');
    }

    const tokenData = {
      grant_type: 'authorization_code',
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code: code,
      redirect_uri: provider.redirectUri,
      ...(provider.usePKCE && {
        code_verifier: session.codeVerifier
      })
    };

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(tokenData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }

      const tokens = await response.json();
      
      // Store tokens
      this.storeTokens(session.providerId, tokens);
      
      // Set up automatic refresh if refresh_token is available
      if (tokens.refresh_token && tokens.expires_in) {
        this.scheduleTokenRefresh(session.providerId, tokens.expires_in);
      }

      return {
        providerId: session.providerId,
        tokens,
        requestData: session.requestData
      };
    } catch (error) {
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
  }

  async clientCredentialsFlow(providerId) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error('OAuth provider not found');
    }

    if (provider.grantType !== 'client_credentials') {
      throw new Error('Provider is not configured for client credentials flow');
    }

    const tokenData = {
      grant_type: 'client_credentials',
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      scope: provider.scope || ''
    };

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(tokenData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token request failed: ${response.status} ${errorData}`);
      }

      const tokens = await response.json();
      
      // Store tokens
      this.storeTokens(providerId, tokens);
      
      // Set up automatic refresh
      if (tokens.expires_in) {
        this.scheduleTokenRefresh(providerId, tokens.expires_in);
      }

      return tokens;
    } catch (error) {
      throw new Error(`Client credentials flow failed: ${error.message}`);
    }
  }

  async refreshToken(providerId) {
    const provider = this.getProvider(providerId);
    const tokenData = this.activeTokens.get(providerId);
    
    if (!provider || !tokenData || !tokenData.refresh_token) {
      throw new Error('Cannot refresh token: missing provider or refresh token');
    }

    const refreshData = {
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
      client_id: provider.clientId,
      client_secret: provider.clientSecret
    };

    try {
      const response = await fetch(provider.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(refreshData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
      }

      const newTokens = await response.json();
      
      // Update stored tokens (preserve refresh_token if not provided)
      const updatedTokens = {
        ...tokenData,
        ...newTokens,
        refresh_token: newTokens.refresh_token || tokenData.refresh_token,
        updated_at: Date.now()
      };
      
      this.storeTokens(providerId, updatedTokens);
      
      // Schedule next refresh
      if (newTokens.expires_in) {
        this.scheduleTokenRefresh(providerId, newTokens.expires_in);
      }

      return updatedTokens;
    } catch (error) {
      // If refresh fails, clear tokens
      this.clearTokens(providerId);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  // Token Management
  storeTokens(providerId, tokens) {
    const tokenData = {
      ...tokens,
      providerId,
      stored_at: Date.now(),
      expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null
    };
    
    this.activeTokens.set(providerId, tokenData);
    this.saveTokens();
  }

  getTokens(providerId) {
    const tokens = this.activeTokens.get(providerId);
    if (!tokens) return null;

    // Check if token is expired
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      // Try to refresh if possible
      if (tokens.refresh_token) {
        this.refreshToken(providerId).catch(console.error);
      }
      return null;
    }

    return tokens;
  }

  clearTokens(providerId) {
    this.activeTokens.delete(providerId);
    this.clearRefreshTimer(providerId);
    this.saveTokens();
  }

  // Apply OAuth token to request
  applyOAuthToRequest(request, providerId) {
    const tokens = this.getTokens(providerId);
    if (!tokens || !tokens.access_token) {
      throw new Error('No valid OAuth token available');
    }

    const provider = this.getProvider(providerId);
    const tokenType = tokens.token_type || 'Bearer';

    return {
      ...request,
      headers: {
        ...request.headers,
        'Authorization': `${tokenType} ${tokens.access_token}`
      }
    };
  }

  // Utility Methods
  scheduleTokenRefresh(providerId, expiresIn) {
    this.clearRefreshTimer(providerId);
    
    // Refresh 5 minutes before expiry, or at 90% of token lifetime
    const refreshTime = Math.min(expiresIn - 300, expiresIn * 0.9) * 1000;
    
    if (refreshTime > 0) {
      const timer = setTimeout(() => {
        this.refreshToken(providerId).catch(console.error);
      }, refreshTime);
      
      this.refreshTimers.set(providerId, timer);
    }
  }

  clearRefreshTimer(providerId) {
    const timer = this.refreshTimers.get(providerId);
    if (timer) {
      clearTimeout(timer);
      this.refreshTimers.delete(providerId);
    }
  }

  generateSecureRandom() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  monitorAuthWindow(authWindow, state) {
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authorization cancelled by user'));
        }
      }, 1000);

      // Listen for message from popup
      const messageHandler = (event) => {
        if (event.source === authWindow) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          authWindow.close();

          if (event.data.type === 'oauth_callback') {
            this.handleAuthorizationCallback(event.data.url)
              .then(resolve)
              .catch(reject);
          } else if (event.data.type === 'oauth_error') {
            reject(new Error(event.data.error || 'Authorization failed'));
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        authWindow.close();
        reject(new Error('Authorization timeout'));
      }, 600000);
    });
  }

  // Persistence
  saveProviders() {
    const providersData = Object.fromEntries(this.providers);
    localStorage.setItem('oauth_providers', JSON.stringify(providersData));
  }

  saveTokens() {
    const tokensData = Object.fromEntries(this.activeTokens);
    localStorage.setItem('oauth_tokens', JSON.stringify(tokensData));
  }

  loadSavedData() {
    try {
      // Load providers
      const savedProviders = localStorage.getItem('oauth_providers');
      if (savedProviders) {
        const providersData = JSON.parse(savedProviders);
        this.providers = new Map(Object.entries(providersData));
      }

      // Load tokens
      const savedTokens = localStorage.getItem('oauth_tokens');
      if (savedTokens) {
        const tokensData = JSON.parse(savedTokens);
        this.activeTokens = new Map(Object.entries(tokensData));
        
        // Set up refresh timers for valid tokens
        this.activeTokens.forEach((tokens, providerId) => {
          if (tokens.expires_at && tokens.refresh_token) {
            const expiresIn = Math.max(0, (tokens.expires_at - Date.now()) / 1000);
            if (expiresIn > 0) {
              this.scheduleTokenRefresh(providerId, expiresIn);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load OAuth data:', error);
    }
  }

  // Predefined OAuth providers
  getProviderTemplates() {
    return {
      google: {
        name: 'Google',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        grantType: 'authorization_code',
        usePKCE: true,
        scope: 'openid email profile'
      },
      github: {
        name: 'GitHub',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        grantType: 'authorization_code',
        usePKCE: false,
        scope: 'user:email'
      },
      microsoft: {
        name: 'Microsoft',
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        grantType: 'authorization_code',
        usePKCE: true,
        scope: 'openid email profile'
      },
      auth0: {
        name: 'Auth0',
        authorizationUrl: 'https://YOUR_DOMAIN.auth0.com/authorize',
        tokenUrl: 'https://YOUR_DOMAIN.auth0.com/oauth/token',
        grantType: 'authorization_code',
        usePKCE: true,
        scope: 'openid email profile'
      }
    };
  }
}

export const oauthService = new OAuthService();