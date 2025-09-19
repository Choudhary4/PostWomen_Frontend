import React, { useState, useEffect } from 'react';
import { Send, Save, Plus, Trash2, Key, Eye, EyeOff, Globe, Settings } from 'lucide-react';
import { environmentService } from '../services/environmentService';
import TestScriptEditor from './TestScriptEditor';
import GraphQLQueryBuilder from './GraphQLQueryBuilder';
import OAuthManager from './OAuthManager';

const RequestBuilder = ({ 
  request, 
  onRequestChange, 
  onSendRequest, 
  onSaveRequest,
  collections,
  loading 
}) => {
  const [activeTab, setActiveTab] = useState('headers');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [saveRequestName, setSaveRequestName] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [activeEnvironment, setActiveEnvironment] = useState(null);
  const [showVariablePreview, setShowVariablePreview] = useState(false);

  useEffect(() => {
    // Load active environment
    const env = environmentService.getActiveEnvironment();
    setActiveEnvironment(env);
  }, []);

  const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const handleUrlChange = (e) => {
    onRequestChange({ ...request, url: e.target.value });
  };

  const handleMethodChange = (e) => {
    onRequestChange({ ...request, method: e.target.value });
  };

  const handleHeaderChange = (key, value, index) => {
    const newHeaders = { ...request.headers };
    
    if (key === '' && value === '') {
      // Remove empty header
      delete newHeaders[index];
    } else if (key) {
      delete newHeaders[index]; // Remove old key
      newHeaders[key] = value;
    }
    
    onRequestChange({ ...request, headers: newHeaders });
  };

  const addHeader = () => {
    const newHeaders = { ...request.headers };
    const newKey = `header_${Date.now()}`;
    newHeaders[newKey] = '';
    onRequestChange({ ...request, headers: newHeaders });
  };

  const removeHeader = (key) => {
    const newHeaders = { ...request.headers };
    delete newHeaders[key];
    onRequestChange({ ...request, headers: newHeaders });
  };

  const handleBodyChange = (e) => {
    onRequestChange({ ...request, body: e.target.value });
  };

  const handleScriptChange = (scriptType, value) => {
    onRequestChange({ ...request, [scriptType]: value });
  };

  const handleSaveRequest = () => {
    if (saveRequestName && selectedCollection) {
      onSaveRequest(saveRequestName, selectedCollection);
      setShowSaveModal(false);
      setSaveRequestName('');
      setSelectedCollection('');
    }
  };

  const getPreviewRequest = () => {
    const dynamicVars = environmentService.getDynamicVariables();
    return {
      url: environmentService.resolveVariables(request.url, dynamicVars),
      headers: Object.entries(request.headers).reduce((acc, [key, value]) => {
        const resolvedKey = environmentService.resolveVariables(key, dynamicVars);
        const resolvedValue = environmentService.resolveVariables(value, dynamicVars);
        acc[resolvedKey] = resolvedValue;
        return acc;
      }, {}),
      body: environmentService.resolveVariables(request.body, dynamicVars)
    };
  };

  const validateVariables = () => {
    const urlValidation = environmentService.validateVariables(request.url);
    const bodyValidation = environmentService.validateVariables(request.body || '');
    
    const headerValidations = Object.entries(request.headers).map(([key, value]) => ({
      key: environmentService.validateVariables(key),
      value: environmentService.validateVariables(value)
    }));

    return {
      url: urlValidation,
      body: bodyValidation,
      headers: headerValidations
    };
  };

  const validationResults = validateVariables();
  const hasValidationErrors = !validationResults.url.isValid || 
                             !validationResults.body.isValid ||
                             validationResults.headers.some(h => !h.key.isValid || !h.value.isValid);

  const canShowBody = ['POST', 'PUT', 'PATCH'].includes(request.method);
  
  // Detect GraphQL requests
  const isGraphQLRequest = request.url && 
    (request.url.includes('/graphql') || 
     request.url.includes('/graphiql') ||
     Object.values(request.headers).some(value => 
       typeof value === 'string' && value.includes('application/graphql')
     ));

  const handleGraphQLQueryChange = (query) => {
    onRequestChange({ 
      ...request, 
      body: JSON.stringify({ query }),
      headers: {
        ...request.headers,
        'Content-Type': 'application/json'
      }
    });
  };

  const handleGraphQLVariablesChange = (variables) => {
    try {
      const parsedVars = JSON.parse(variables);
      const currentBody = request.body ? JSON.parse(request.body) : {};
      onRequestChange({ 
        ...request, 
        body: JSON.stringify({ 
          ...currentBody, 
          variables: parsedVars 
        })
      });
    } catch (e) {
      // Invalid JSON, ignore
    }
  };

  const executeIntrospectionQuery = async () => {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          types {
            name
            description
            fields {
              name
              description
              type {
                name
                ofType {
                  name
                }
              }
            }
          }
        }
      }
    `;
    
    // Execute introspection query
    const introspectionRequest = {
      ...request,
      body: JSON.stringify({ query: introspectionQuery }),
      headers: {
        ...request.headers,
        'Content-Type': 'application/json'
      }
    };
    
    // This would trigger the actual request
    onSendRequest(introspectionRequest);
  };

  return (
    <div className="card p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-lg font-semibold text-gray-900">Request Builder</h2>
        <div className="flex items-center space-x-2">
          {activeEnvironment && (
            <div className="flex items-center space-x-2 px-2 sm:px-3 py-1 bg-green-50 rounded-lg">
              <Globe className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 hidden sm:inline">{activeEnvironment.name}</span>
              <span className="text-xs font-medium text-green-800 sm:hidden">{activeEnvironment.name.substring(0, 8)}...</span>
            </div>
          )}
          <button
            onClick={() => setShowVariablePreview(!showVariablePreview)}
            className={`p-2 rounded-lg touch-manipulation ${showVariablePreview ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
            title="Preview resolved variables"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* URL and Method */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <select
            value={request.method}
            onChange={handleMethodChange}
            className="px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white min-w-[100px] text-base sm:text-sm touch-manipulation"
          >
            {HTTP_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={request.url}
              onChange={handleUrlChange}
              placeholder="https://api.example.com/users or {{baseUrl}}/users"
              className={`input-field pr-10 text-base sm:text-sm ${!validationResults.url.isValid ? 'border-red-300' : ''}`}
            />
            {!validationResults.url.isValid && (
              <div className="absolute right-2 top-2 text-red-500" title={validationResults.url.errors.join(', ')}>
                ⚠️
              </div>
            )}
          </div>
          
          <button
            onClick={onSendRequest}
            disabled={loading || !request.url || hasValidationErrors}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm touch-manipulation"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Validation Errors */}
        {hasValidationErrors && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Variable Validation Errors:</p>
            <ul className="text-red-700 text-sm mt-1 space-y-1">
              {validationResults.url.errors.map((error, index) => (
                <li key={index}>URL: {error}</li>
              ))}
              {validationResults.body.errors.map((error, index) => (
                <li key={index}>Body: {error}</li>
              ))}
              {validationResults.headers.flatMap((h, index) => [
                ...h.key.errors.map(error => `Header ${index + 1} key: ${error}`),
                ...h.value.errors.map(error => `Header ${index + 1} value: ${error}`)
              ]).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Variable Preview */}
        {showVariablePreview && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Resolved Variables Preview</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-blue-800">URL: </span>
                <code className="text-blue-700">{getPreviewRequest().url}</code>
              </div>
              {Object.keys(getPreviewRequest().headers).length > 0 && (
                <div>
                  <span className="font-medium text-blue-800">Headers: </span>
                  <pre className="text-blue-700 mt-1">{JSON.stringify(getPreviewRequest().headers, null, 2)}</pre>
                </div>
              )}
              {getPreviewRequest().body && (
                <div>
                  <span className="font-medium text-blue-800">Body: </span>
                  <pre className="text-blue-700 mt-1">{getPreviewRequest().body}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="btn-secondary text-sm flex items-center justify-center py-3 sm:py-2 touch-manipulation"
          >
            <Save className="w-4 h-4 mr-1" />
            Save
          </button>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="btn-secondary text-sm flex items-center justify-center py-3 sm:py-2 touch-manipulation"
          >
            <Key className="w-4 h-4 mr-1" />
            Auth
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('headers')}
              className={`py-3 sm:py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap touch-manipulation ${
                activeTab === 'headers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Headers ({Object.keys(request.headers).length})</span>
              <span className="sm:hidden">Headers</span>
            </button>
            
            {canShowBody && (
              <button
                onClick={() => setActiveTab('body')}
                className={`py-3 sm:py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap touch-manipulation ${
                  activeTab === 'body'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {isGraphQLRequest ? 'GraphQL' : 'Body'}
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('scripts')}
              className={`py-3 sm:py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap touch-manipulation ${
                activeTab === 'scripts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Scripts
              {(request.preRequestScript || request.postRequestScript) && (
                <span className="ml-1 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-3">
          {activeTab === 'headers' && (
            <HeadersEditor
              headers={request.headers}
              onHeaderChange={handleHeaderChange}
              onAddHeader={addHeader}
              onRemoveHeader={removeHeader}
            />
          )}
          
          {activeTab === 'body' && canShowBody && (
            isGraphQLRequest ? (
              <GraphQLQueryBuilder
                query={(() => {
                  try {
                    const body = JSON.parse(request.body || '{}');
                    return body.query || '';
                  } catch (e) {
                    return request.body || '';
                  }
                })()}
                variables={(() => {
                  try {
                    const body = JSON.parse(request.body || '{}');
                    return JSON.stringify(body.variables || {}, null, 2);
                  } catch (e) {
                    return '{}';
                  }
                })()}
                onQueryChange={handleGraphQLQueryChange}
                onVariablesChange={handleGraphQLVariablesChange}
                onExecuteIntrospection={executeIntrospectionQuery}
              />
            ) : (
              <BodyEditor
                body={request.body}
                onBodyChange={handleBodyChange}
              />
            )
          )}
          
          {activeTab === 'scripts' && (
            <TestScriptEditor
              preRequestScript={request.preRequestScript || ''}
              postRequestScript={request.postRequestScript || ''}
              onScriptChange={handleScriptChange}
              testResults={request.lastTestResults}
              preRequestLogs={request.lastPreRequestLogs}
            />
          )}
        </div>
      </div>

      {/* Save Request Modal */}
      {showSaveModal && (
        <SaveRequestModal
          requestName={saveRequestName}
          setRequestName={setSaveRequestName}
          collections={collections}
          selectedCollection={selectedCollection}
          setSelectedCollection={setSelectedCollection}
          onSave={handleSaveRequest}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          auth={request.auth}
          onAuthChange={(auth) => onRequestChange({ ...request, auth })}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

const HeadersEditor = ({ headers, onHeaderChange, onAddHeader, onRemoveHeader }) => {
  const headerEntries = Object.entries(headers);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">Request Headers</h3>
        <button
          onClick={onAddHeader}
          className="text-sm text-primary hover:text-orange-600 flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Header
        </button>
      </div>
      
      {headerEntries.length === 0 ? (
        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
          <p className="text-sm">No headers added</p>
          <button
            onClick={onAddHeader}
            className="text-primary hover:text-orange-600 text-sm mt-1"
          >
            Add your first header
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {headerEntries.map(([key, value], index) => (
            <div key={key} className="flex space-x-2">
              <input
                type="text"
                placeholder="Header name"
                value={key.startsWith('header_') ? '' : key}
                onChange={(e) => onHeaderChange(e.target.value, value, key)}
                className="input-field flex-1"
              />
              <input
                type="text"
                placeholder="Header value"
                value={value}
                onChange={(e) => onHeaderChange(key, e.target.value, key)}
                className="input-field flex-1"
              />
              <button
                onClick={() => onRemoveHeader(key)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BodyEditor = ({ body, onBodyChange }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Request Body</h3>
      <textarea
        value={body}
        onChange={onBodyChange}
        placeholder="Enter request body (JSON, XML, plain text, etc.)"
        className="input-field h-40 font-mono text-sm resize-y"
      />
      <div className="text-xs text-gray-500">
        Tip: For JSON data, make sure to set Content-Type header to application/json
      </div>
    </div>
  );
};

const SaveRequestModal = ({
  requestName,
  setRequestName,
  collections,
  selectedCollection,
  setSelectedCollection,
  onSave,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Save Request</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Name
            </label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="My API Request"
              className="input-field text-base sm:text-sm"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collection
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="input-field text-base sm:text-sm"
            >
              <option value="">Select a collection</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-0 sm:space-x-3 mt-6">
          <button 
            onClick={onClose} 
            className="btn-secondary py-3 sm:py-2 text-base sm:text-sm touch-manipulation order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!requestName || !selectedCollection}
            className="btn-primary disabled:opacity-50 py-3 sm:py-2 text-base sm:text-sm touch-manipulation order-1 sm:order-2"
          >
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthModal = ({ auth, onAuthChange, onClose }) => {
  const [authType, setAuthType] = useState(auth?.type || 'none');
  const [authData, setAuthData] = useState(auth || {});
  const [showPassword, setShowPassword] = useState(false);
  const [showOAuthManager, setShowOAuthManager] = useState(false);

  const handleSave = () => {
    if (authType === 'none') {
      onAuthChange(null);
    } else {
      onAuthChange({ ...authData, type: authType });
    }
    onClose();
  };

  const handleOAuthSelect = (provider, tokens) => {
    setAuthType('oauth2');
    setAuthData({
      type: 'oauth2',
      providerId: provider.id,
      providerName: provider.name,
      accessToken: tokens.access_token,
      tokenType: tokens.token_type || 'Bearer'
    });
    setShowOAuthManager(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Authentication</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value)}
              className="input-field"
            >
              <option value="none">No Authentication</option>
              <option value="bearer">Bearer Token</option>
              <option value="apikey">API Key</option>
              <option value="basic">Basic Auth</option>
              <option value="oauth2">OAuth 2.0</option>
            </select>
          </div>
          
          {authType === 'bearer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token
              </label>
              <input
                type="text"
                value={authData.token || ''}
                onChange={(e) => setAuthData({ ...authData, token: e.target.value })}
                placeholder="Your bearer token"
                className="input-field"
              />
            </div>
          )}
          
          {authType === 'apikey' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key
                </label>
                <input
                  type="text"
                  value={authData.key || ''}
                  onChange={(e) => setAuthData({ ...authData, key: e.target.value })}
                  placeholder="API key header name (e.g., X-API-Key)"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={authData.value || ''}
                  onChange={(e) => setAuthData({ ...authData, value: e.target.value })}
                  placeholder="API key value"
                  className="input-field"
                />
              </div>
            </>
          )}
          
          {authType === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={authData.username || ''}
                  onChange={(e) => setAuthData({ ...authData, username: e.target.value })}
                  placeholder="Username"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authData.password || ''}
                    onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                    placeholder="Password"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
          
          {authType === 'oauth2' && (
            <div className="space-y-3">
              {authData.providerName ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        OAuth 2.0 - {authData.providerName}
                      </p>
                      <p className="text-xs text-green-600">
                        Access token configured
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOAuthManager(true)}
                      className="text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">
                    Configure OAuth 2.0 authentication
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowOAuthManager(true)}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Setup OAuth Provider
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save
          </button>
        </div>

        {/* OAuth Manager Modal */}
        {showOAuthManager && (
          <OAuthManager
            isOpen={showOAuthManager}
            onClose={() => setShowOAuthManager(false)}
            onOAuthSelect={handleOAuthSelect}
          />
        )}
      </div>
    </div>
  );
};

export default RequestBuilder;