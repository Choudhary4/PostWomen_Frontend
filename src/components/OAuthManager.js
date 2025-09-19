import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Key, Globe, CheckCircle, XCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { oauthService } from '../services/oauthService';

const OAuthManager = ({ isOpen, onClose, onOAuthSelect }) => {
  const [providers, setProviders] = useState([]);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [activeTokens, setActiveTokens] = useState(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProviders();
      loadTokenStatus();
    }
  }, [isOpen]);

  const loadProviders = () => {
    const allProviders = oauthService.getAllProviders();
    setProviders(allProviders);
  };

  const loadTokenStatus = () => {
    const providers = oauthService.getAllProviders();
    const tokenMap = new Map();
    
    providers.forEach(provider => {
      const tokens = oauthService.getTokens(provider.id);
      tokenMap.set(provider.id, tokens);
    });
    
    setActiveTokens(tokenMap);
  };

  const handleAddProvider = (providerData) => {
    try {
      oauthService.addProvider(providerData);
      loadProviders();
      setShowAddProvider(false);
    } catch (error) {
      alert('Error adding provider: ' + error.message);
    }
  };

  const handleUpdateProvider = (providerId, updates) => {
    try {
      oauthService.updateProvider(providerId, updates);
      loadProviders();
      setEditingProvider(null);
    } catch (error) {
      alert('Error updating provider: ' + error.message);
    }
  };

  const handleDeleteProvider = (providerId) => {
    if (window.confirm('Are you sure you want to delete this OAuth provider?')) {
      oauthService.deleteProvider(providerId);
      loadProviders();
      loadTokenStatus();
    }
  };

  const handleAuthorize = async (provider) => {
    setLoading(true);
    try {
      if (provider.grantType === 'authorization_code') {
        await oauthService.startAuthorizationCodeFlow(provider.id);
      } else if (provider.grantType === 'client_credentials') {
        await oauthService.clientCredentialsFlow(provider.id);
      }
      loadTokenStatus();
    } catch (error) {
      alert('Authorization failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async (providerId) => {
    setLoading(true);
    try {
      await oauthService.refreshToken(providerId);
      loadTokenStatus();
    } catch (error) {
      alert('Token refresh failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTokens = (providerId) => {
    if (window.confirm('Are you sure you want to clear stored tokens?')) {
      oauthService.clearTokens(providerId);
      loadTokenStatus();
    }
  };

  const handleUseProvider = (provider) => {
    const tokens = activeTokens.get(provider.id);
    if (tokens && tokens.access_token) {
      onOAuthSelect && onOAuthSelect(provider, tokens);
      onClose();
    } else {
      alert('No valid tokens available. Please authorize first.');
    }
  };

  const formatExpiryTime = (expiresAt) => {
    if (!expiresAt) return 'No expiry';
    const now = Date.now();
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">OAuth 2.0 Manager</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddProvider(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} />
              <span>Add Provider</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {providers.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No OAuth Providers</h3>
              <p className="text-gray-600 mb-4">Add an OAuth provider to start using OAuth 2.0 authentication</p>
              <button
                onClick={() => setShowAddProvider(true)}
                className="btn-primary"
              >
                Add Your First Provider
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {providers.map(provider => {
                const tokens = activeTokens.get(provider.id);
                const hasValidTokens = tokens && tokens.access_token && (!tokens.expires_at || tokens.expires_at > Date.now());
                
                return (
                  <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {provider.grantType === 'authorization_code' ? 'Authorization Code' : 'Client Credentials'} Flow
                        </p>
                        {provider.scope && (
                          <p className="text-xs text-gray-500 mt-1">Scope: {provider.scope}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingProvider(provider)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Edit Provider"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="p-2 text-red-400 hover:text-red-600"
                          title="Delete Provider"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Token Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Token Status</span>
                        {hasValidTokens ? (
                          <div className="flex items-center space-x-1 text-green-600">
                            <CheckCircle size={16} />
                            <span className="text-sm">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <XCircle size={16} />
                            <span className="text-sm">Not Authorized</span>
                          </div>
                        )}
                      </div>
                      
                      {tokens && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Expires: {formatExpiryTime(tokens.expires_at)}</div>
                          {tokens.refresh_token && (
                            <div>Refresh Token: Available</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {!hasValidTokens ? (
                        <button
                          onClick={() => handleAuthorize(provider)}
                          disabled={loading}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          <ExternalLink size={14} />
                          <span>Authorize</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUseProvider(provider)}
                          className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Key size={14} />
                          <span>Use for Request</span>
                        </button>
                      )}
                      
                      {tokens && tokens.refresh_token && (
                        <button
                          onClick={() => handleRefreshToken(provider.id)}
                          disabled={loading}
                          className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          <RefreshCw size={14} />
                          <span>Refresh</span>
                        </button>
                      )}
                      
                      {tokens && (
                        <button
                          onClick={() => handleClearTokens(provider.id)}
                          className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <Trash2 size={14} />
                          <span>Clear Tokens</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Provider Modal */}
        {(showAddProvider || editingProvider) && (
          <ProviderForm
            provider={editingProvider}
            onSave={editingProvider ? 
              (updates) => handleUpdateProvider(editingProvider.id, updates) :
              handleAddProvider
            }
            onCancel={() => {
              setShowAddProvider(false);
              setEditingProvider(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

const ProviderForm = ({ provider, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: provider?.name || '',
    grantType: provider?.grantType || 'authorization_code',
    clientId: provider?.clientId || '',
    clientSecret: provider?.clientSecret || '',
    authorizationUrl: provider?.authorizationUrl || '',
    tokenUrl: provider?.tokenUrl || '',
    redirectUri: provider?.redirectUri || `${window.location.origin}/oauth/callback`,
    scope: provider?.scope || '',
    usePKCE: provider?.usePKCE || false
  });

  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = oauthService.getProviderTemplates();

  const handleTemplateSelect = (templateKey) => {
    if (templateKey && templates[templateKey]) {
      const template = templates[templateKey];
      setFormData(prev => ({
        ...prev,
        ...template,
        clientId: prev.clientId,
        clientSecret: prev.clientSecret,
        redirectUri: prev.redirectUri
      }));
    }
    setSelectedTemplate(templateKey);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.clientId || !formData.tokenUrl) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.grantType === 'authorization_code' && !formData.authorizationUrl) {
      alert('Authorization URL is required for authorization code flow');
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {provider ? 'Edit OAuth Provider' : 'Add OAuth Provider'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Template Selection */}
          {!provider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Use Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Custom Configuration</option>
                {Object.entries(templates).map(([key, template]) => (
                  <option key={key} value={key}>{template.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="My OAuth Provider"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grant Type *
              </label>
              <select
                value={formData.grantType}
                onChange={(e) => setFormData(prev => ({ ...prev, grantType: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="authorization_code">Authorization Code</option>
                <option value="client_credentials">Client Credentials</option>
              </select>
            </div>
          </div>

          {/* Client Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client ID *
              </label>
              <input
                type="text"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret {formData.grantType === 'client_credentials' ? '*' : '(Optional)'}
              </label>
              <input
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData(prev => ({ ...prev, clientSecret: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required={formData.grantType === 'client_credentials'}
              />
            </div>
          </div>

          {/* URLs */}
          {formData.grantType === 'authorization_code' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Authorization URL *
              </label>
              <input
                type="url"
                value={formData.authorizationUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, authorizationUrl: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="https://provider.com/oauth/authorize"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token URL *
            </label>
            <input
              type="url"
              value={formData.tokenUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, tokenUrl: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="https://provider.com/oauth/token"
              required
            />
          </div>

          {formData.grantType === 'authorization_code' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Redirect URI
              </label>
              <input
                type="url"
                value={formData.redirectUri}
                onChange={(e) => setFormData(prev => ({ ...prev, redirectUri: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                This should be configured in your OAuth provider settings
              </p>
            </div>
          )}

          {/* Additional Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scope
            </label>
            <input
              type="text"
              value={formData.scope}
              onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="read write profile"
            />
          </div>

          {formData.grantType === 'authorization_code' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="usePKCE"
                checked={formData.usePKCE}
                onChange={(e) => setFormData(prev => ({ ...prev, usePKCE: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="usePKCE" className="text-sm text-gray-700">
                Use PKCE (Proof Key for Code Exchange)
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {provider ? 'Update Provider' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OAuthManager;