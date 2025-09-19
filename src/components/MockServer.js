import React, { useState, useEffect } from 'react';

const MockServer = () => {
  const [mockConfigs, setMockConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('configs');
  const [requestLogs, setRequestLogs] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [testUrl, setTestUrl] = useState('');
  const [testMethod, setTestMethod] = useState('GET');
  const [testBody, setTestBody] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'connected', 'disconnected'
  const [configForm, setConfigForm] = useState({
    name: '',
    baseUrl: '',
    enabled: true
  });
  const [routeForm, setRouteForm] = useState({
    method: 'GET',
    path: '',
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: '',
      delay: 0
    }
  });

  useEffect(() => {
    loadData();
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const loadData = async () => {
    try {
      console.log('Loading mock server data...');
      
      const [configsRes, logsRes, statsRes] = await Promise.all([
        fetch('/api/mock-configs'),
        fetch('/api/mock-logs'),
        fetch('/api/mock-stats')
      ]);

      console.log('API responses:', {
        configs: configsRes.status,
        logs: logsRes.status,
        stats: statsRes.status
      });

      if (configsRes.ok) {
        const configs = await configsRes.json();
        console.log('Loaded configs:', configs);
        setMockConfigs(configs);
      } else {
        console.error('Failed to load configs:', configsRes.status);
      }
      
      if (logsRes.ok) {
        const logs = await logsRes.json();
        setRequestLogs(logs);
      } else {
        console.error('Failed to load logs:', logsRes.status);
      }
      
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setStatistics(stats);
      } else {
        console.error('Failed to load stats:', statsRes.status);
      }
    } catch (error) {
      console.error('Network error loading mock server data:', error);
      // Show user-friendly error message
      if (mockConfigs.length === 0) {
        alert('Cannot connect to backend server. Please make sure the backend is running on port 9000.');
      }
    }
  };

  const handleCreateConfig = async (configData) => {
    try {
      console.log('Creating config with data:', configData || configForm);
      
      const response = await fetch('/api/mock-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData || configForm)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const newConfig = await response.json();
        console.log('Created config:', newConfig);
        await loadData();
        setShowConfigForm(false);
        setSelectedConfig(newConfig.id);
        setConfigForm({ name: '', baseUrl: '', enabled: true });
        alert('Mock configuration created successfully!');
      } else {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          alert('Error creating configuration: ' + (errorJson.error || errorText));
        } catch (e) {
          alert('Error creating configuration: ' + errorText);
        }
      }
    } catch (error) {
      console.error('Network error creating config:', error);
      alert('Network error: Cannot connect to backend server. Make sure the backend is running on port 9000.');
    }
  };

  const handleAddRoute = async () => {
    if (!selectedConfig) {
      alert('Please select a configuration first');
      return;
    }

    try {
      const routeData = {
        ...routeForm,
        response: {
          ...routeForm.response,
          body: routeForm.response.body ? JSON.parse(routeForm.response.body) : {}
        }
      };

      const response = await fetch(`/api/mock-configs/${selectedConfig}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData)
      });

      if (response.ok) {
        await loadData();
        setShowRouteForm(false);
        setRouteForm({
          method: 'GET',
          path: '',
          response: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: '',
            delay: 0
          }
        });
      } else {
        const error = await response.json();
        alert('Error adding route: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding route:', error);
      alert('Error adding route. Please check the response body JSON format.');
    }
  };

  const handleTestMock = async () => {
    try {
      const testHeaders = { 'Content-Type': 'application/json' };
      const testBodyData = testBody ? JSON.parse(testBody) : null;
      
      const response = await fetch('/api/mock-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: testMethod,
          url: testUrl,
          body: testBodyData,
          headers: testHeaders
        })
      });

      const result = await response.json();
      setTestResult(result);
      await loadData(); // Refresh logs
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    }
  };

  const renderConfigs = () => {
    const selectedConfigData = mockConfigs.find(c => c.id === selectedConfig);

    return (
      <div className="flex gap-6 h-full">
        <div className="w-96 bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gray-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Mock Configurations</h3>
              <button 
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={() => {
                  setEditingConfig(null);
                  setShowConfigForm(true);
                }}
              >
                + New Mock
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {mockConfigs.map(config => (
              <div 
                key={config.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedConfig === config.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedConfig(config.id)}
              >
                <div className="font-medium text-gray-800">{config.name}</div>
                <div className="text-sm text-gray-600 font-mono">{config.baseUrl}</div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{config.routes.length} routes</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    config.enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow border">
          {selectedConfigData ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">{selectedConfigData.name}</h2>
                    <div className="text-sm text-gray-600 font-mono">{selectedConfigData.baseUrl}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-50">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-green-600 border border-green-600 rounded text-sm hover:bg-green-50"
                      onClick={() => {
                        setEditingRoute(null);
                        setShowRouteForm(true);
                      }}
                    >
                      + Add Route
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-2">
                  {selectedConfigData.routes.map(route => (
                    <div key={route.id} className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            route.method === 'GET' ? 'bg-green-100 text-green-800' :
                            route.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                            route.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                            route.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {route.method}
                          </span>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">{route.path}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            route.response.status < 300 ? 'bg-green-100 text-green-800' :
                            route.response.status < 400 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {route.response.status}
                          </span>
                          {route.response.delay > 0 && (
                            <span className="text-xs text-gray-500">{route.response.delay}ms</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select a mock configuration</h3>
                <p>Choose a mock configuration from the sidebar to view and edit its routes.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTester = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-4">🧪 Test Mock Server</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select 
                value={testMethod} 
                onChange={(e) => setTestMethod(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="http://localhost:9000/mock/api/users"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          
          {['POST', 'PUT', 'PATCH'].includes(testMethod) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Body (JSON)</label>
              <textarea
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder='{"name": "John Doe", "email": "john@example.com"}'
                rows={4}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
              />
            </div>
          )}
          
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleTestMock}
          >
            Send Test Request
          </button>
        </div>
      </div>

      {testResult && (
        <div className="mt-6 bg-white rounded-lg shadow border p-6">
          <h4 className="text-lg font-semibold mb-4">Test Result</h4>
          <div className={`p-3 rounded mb-4 ${
            testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {testResult.success ? '✅ Mock Response Generated' : '❌ No Mock Match Found'}
          </div>
          
          {testResult.response && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    testResult.response.status < 300 ? 'bg-green-100 text-green-800' :
                    testResult.response.status < 400 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {testResult.response.status}
                  </span>
                  <span className="text-sm text-gray-600">{testResult.response.statusText}</span>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Response Body:</h5>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(testResult.response.body, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          {testResult.error && (
            <div className="text-red-600">
              <h5 className="font-medium mb-2">Error</h5>
              <p>{testResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b bg-gray-50 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">📋 Request Logs</h3>
            <button 
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              onClick={async () => {
                try {
                  await fetch('/api/mock-logs', { method: 'DELETE' });
                  await loadData();
                } catch (error) {
                  console.error('Error clearing logs:', error);
                }
              }}
            >
              Clear Logs
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            {requestLogs.map(log => (
              <div key={log.id} className={`p-3 border rounded ${
                log.matched ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      log.method === 'GET' ? 'bg-green-100 text-green-800' :
                      log.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                      log.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      log.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.method}
                    </span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{log.url}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      log.matched 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.matched ? '✅ Matched' : '❌ No Match'}
                    </span>
                  </div>
                </div>
                
                {log.body && (
                  <div className="mt-2">
                    <strong className="text-sm">Body:</strong>
                    <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-x-auto">
                      {JSON.stringify(log.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            
            {requestLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No request logs yet. Test some mock endpoints to see logs here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatistics = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-6">📊 Mock Server Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalConfigs || 0}</div>
            <div className="text-sm text-gray-600">Total Configurations</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{statistics.enabledConfigs || 0}</div>
            <div className="text-sm text-gray-600">Enabled Configurations</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{statistics.totalRoutes || 0}</div>
            <div className="text-sm text-gray-600">Total Routes</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{statistics.totalRequests || 0}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{statistics.matchedRequests || 0}</div>
            <div className="text-sm text-gray-600">Matched Requests</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{statistics.recentRequests || 0}</div>
            <div className="text-sm text-gray-600">Recent Requests (1h)</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">🎭 Mock Server</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'disconnected' ? 'bg-red-500' :
                'bg-yellow-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Backend Connected' :
                 connectionStatus === 'disconnected' ? 'Backend Disconnected' :
                 'Checking Connection...'}
              </span>
              {connectionStatus === 'disconnected' && (
                <button
                  onClick={checkBackendConnection}
                  className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-green-600 border border-green-600 rounded text-sm hover:bg-green-50">
              📤 Export
            </button>
            <button className="px-3 py-1 text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-50">
              📥 Import
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 px-6 py-2">
        <div className="flex gap-1">
          {[
            { id: 'configs', label: 'Configurations' },
            { id: 'tester', label: 'Tester' },
            { id: 'logs', label: `Logs ${requestLogs.length > 0 ? `(${requestLogs.length})` : ''}` },
            { id: 'stats', label: 'Statistics' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {connectionStatus === 'disconnected' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Backend Server Not Connected</h3>
                <p className="text-red-700 text-sm mt-1">
                  The mock server requires the backend to be running. Please start the backend server:
                </p>
                <ol className="text-red-700 text-sm mt-2 list-decimal list-inside">
                  <li>Open a new terminal</li>
                  <li>Navigate to: <code className="bg-red-100 px-1 rounded">C:\Users\DELL\Desktop\postman-mvp\backend</code></li>
                  <li>Run: <code className="bg-red-100 px-1 rounded">node server.js</code></li>
                  <li>Or double-click: <code className="bg-red-100 px-1 rounded">start-backend.bat</code></li>
                </ol>
                <button
                  onClick={checkBackendConnection}
                  className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Check Connection Again
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'configs' && renderConfigs()}
        {activeTab === 'tester' && renderTester()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'stats' && renderStatistics()}
      </div>

      {/* Create Config Modal */}
      {showConfigForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Mock Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
                <input
                  type="text"
                  value={configForm.name}
                  onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="My API Mock"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={configForm.baseUrl}
                  onChange={(e) => setConfigForm({ ...configForm, baseUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="/api/v1"
                />
              </div>
              
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={configForm.enabled}
                    onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
                  />
                  <span className="text-sm">Enable this configuration</span>
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateConfig}
                disabled={!configForm.name}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Create Configuration
              </button>
              <button
                onClick={() => setShowConfigForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Route Modal */}
      {showRouteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Route</h3>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select
                    value={routeForm.method}
                    onChange={(e) => setRouteForm({ ...routeForm, method: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                  <input
                    type="text"
                    value={routeForm.path}
                    onChange={(e) => setRouteForm({ ...routeForm, path: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="/users/:id"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status Code</label>
                  <input
                    type="number"
                    value={routeForm.response.status}
                    onChange={(e) => setRouteForm({
                      ...routeForm,
                      response: { ...routeForm.response, status: parseInt(e.target.value) }
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delay (ms)</label>
                  <input
                    type="number"
                    value={routeForm.response.delay}
                    onChange={(e) => setRouteForm({
                      ...routeForm,
                      response: { ...routeForm.response, delay: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response Body (JSON)</label>
                <textarea
                  value={routeForm.response.body}
                  onChange={(e) => setRouteForm({
                    ...routeForm,
                    response: { ...routeForm.response, body: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                  rows={8}
                  placeholder={JSON.stringify({
                    id: "{{params.id}}",
                    name: "{{faker.name.fullName}}",
                    email: "{{faker.internet.email}}",
                    createdAt: "{{date.now}}"
                  }, null, 2)}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded text-sm">
                <strong>Template Variables:</strong>
                <ul className="mt-1 space-y-1">
                  <li><code>{'{{params.id}}'}</code> - URL parameters</li>
                  <li><code>{'{{body.field}}'}</code> - Request body fields</li>
                  <li><code>{'{{faker.name.fullName}}'}</code> - Fake data</li>
                  <li><code>{'{{date.now}}'}</code> - Current timestamp</li>
                  <li><code>{'{{random.int}}'}</code> - Random integer</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddRoute}
                disabled={!routeForm.path}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Add Route
              </button>
              <button
                onClick={() => setShowRouteForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockServer;