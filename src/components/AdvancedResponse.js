import React, { useState, useEffect } from 'react';
import { BarChart, GitCompare, Database, Shield, Clock, TrendingUp, Filter, Search, Download, Upload, RefreshCw, Zap, AlertTriangle, CheckCircle, XCircle, Eye, Copy, Save, Plus } from 'lucide-react';

const AdvancedResponse = () => {
  const [activeTab, setActiveTab] = useState('cache');
  const [cachedResponses, setCachedResponses] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [schemas, setSchemas] = useState([]);
  const [validations, setValidations] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [responseHistory, setResponseHistory] = useState([]);
  const [alertRules, setAlertRules] = useState([]);
  const [selectedResponses, setSelectedResponses] = useState([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [schemaForm, setSchemaForm] = useState({
    name: '',
    description: '',
    schema: '',
    tags: []
  });
  const [validationForm, setValidationForm] = useState({
    responseId: '',
    schemaId: ''
  });

  useEffect(() => {
    loadCachedResponses();
    loadComparisons();
    loadSchemas();
    loadValidations();
    loadPerformanceStats();
    loadAlertRules();
  }, []);

  const loadCachedResponses = async () => {
    try {
      const response = await fetch('/api/advanced-response/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: environmentFilter !== 'all' ? environmentFilter : undefined,
          method: methodFilter !== 'all' ? methodFilter : undefined,
          status: statusFilter !== 'all' ? parseInt(statusFilter) : undefined
        })
      });
      if (response.ok) {
        const cached = await response.json();
        setCachedResponses(cached);
      }
    } catch (error) {
      console.error('Error loading cached responses:', error);
    }
  };

  const loadComparisons = async () => {
    try {
      const response = await fetch('/api/advanced-response/comparisons');
      if (response.ok) {
        const comps = await response.json();
        setComparisons(comps);
      }
    } catch (error) {
      console.error('Error loading comparisons:', error);
    }
  };

  const loadSchemas = async () => {
    try {
      const response = await fetch('/api/advanced-response/schemas');
      if (response.ok) {
        const schemasData = await response.json();
        setSchemas(schemasData);
      }
    } catch (error) {
      console.error('Error loading schemas:', error);
    }
  };

  const loadValidations = async () => {
    try {
      const response = await fetch('/api/advanced-response/validations');
      if (response.ok) {
        const vals = await response.json();
        setValidations(vals);
      }
    } catch (error) {
      console.error('Error loading validations:', error);
    }
  };

  const loadPerformanceStats = async () => {
    try {
      const response = await fetch('/api/advanced-response/performance/stats/24h');
      if (response.ok) {
        const stats = await response.json();
        setPerformanceStats(stats);
      }
    } catch (error) {
      console.error('Error loading performance stats:', error);
    }
  };

  const loadAlertRules = async () => {
    try {
      const response = await fetch('/api/advanced-response/alerts');
      if (response.ok) {
        const rules = await response.json();
        setAlertRules(rules);
      }
    } catch (error) {
      console.error('Error loading alert rules:', error);
    }
  };

  const handleCompareResponses = async () => {
    if (selectedResponses.length !== 2) {
      alert('Please select exactly 2 responses to compare');
      return;
    }

    try {
      const response = await fetch('/api/advanced-response/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response1Id: selectedResponses[0],
          response2Id: selectedResponses[1]
        })
      });

      if (response.ok) {
        await loadComparisons();
        setSelectedResponses([]);
        setActiveTab('comparisons');
      } else {
        const error = await response.json();
        alert('Error comparing responses: ' + error.error);
      }
    } catch (error) {
      console.error('Error comparing responses:', error);
      alert('Error comparing responses');
    }
  };

  const handleCreateSchema = async () => {
    try {
      const response = await fetch('/api/advanced-response/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...schemaForm,
          schema: JSON.parse(schemaForm.schema)
        })
      });

      if (response.ok) {
        await loadSchemas();
        setShowSchemaModal(false);
        setSchemaForm({ name: '', description: '', schema: '', tags: [] });
      } else {
        const error = await response.json();
        alert('Error creating schema: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating schema:', error);
      alert('Error creating schema. Please check JSON format.');
    }
  };

  const handleValidateResponse = async () => {
    try {
      const response = await fetch('/api/advanced-response/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validationForm)
      });

      if (response.ok) {
        await loadValidations();
        setShowValidationModal(false);
        setValidationForm({ responseId: '', schemaId: '' });
        setActiveTab('validations');
      } else {
        const error = await response.json();
        alert('Error validating response: ' + error.error);
      }
    } catch (error) {
      console.error('Error validating response:', error);
      alert('Error validating response');
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear the cache?')) return;

    try {
      const response = await fetch('/api/advanced-response/cache/clear', {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCachedResponses();
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const filteredResponses = cachedResponses.filter(response => {
    const matchesSearch = response.request.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || response.response.status.toString() === statusFilter;
    const matchesMethod = methodFilter === 'all' || response.request.method === methodFilter;
    const matchesEnvironment = environmentFilter === 'all' || response.metadata.environment === environmentFilter;
    
    return matchesSearch && matchesStatus && matchesMethod && matchesEnvironment;
  });

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderCacheTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Response Cache</h3>
        <div className="flex gap-2">
          <button
            onClick={handleCompareResponses}
            disabled={selectedResponses.length !== 2}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"
          >
            <GitCompare className="w-4 h-4" />
            Compare Selected
          </button>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Clear Cache
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search URLs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="200">200 OK</option>
            <option value="201">201 Created</option>
            <option value="400">400 Bad Request</option>
            <option value="401">401 Unauthorized</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <select
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All Environments</option>
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          <button
            onClick={loadCachedResponses}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Response List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">
              {filteredResponses.length} Cached Responses
            </span>
            <span className="text-sm text-gray-500">
              {selectedResponses.length} selected
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {filteredResponses.map(response => (
            <div key={response.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedResponses.includes(response.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedResponses([...selectedResponses, response.id]);
                    } else {
                      setSelectedResponses(selectedResponses.filter(id => id !== response.id));
                    }
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      response.request.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                      response.request.method === 'POST' ? 'bg-green-100 text-green-800' :
                      response.request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                      response.request.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {response.request.method}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(response.response.status)}`}>
                      {response.response.status}
                    </span>
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                      {response.metadata.environment}
                    </span>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">
                    {response.request.url}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>⏱️ {formatDuration(response.performance.total)}</span>
                    <span>📦 {formatBytes(response.performance.size.response)}</span>
                    <span>🕒 {new Date(response.metadata.cachedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setValidationForm({ ...validationForm, responseId: response.id })}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Validate Response"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600" title="View Details">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComparisonsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Response Comparisons</h3>
        <button
          onClick={() => setShowComparisonModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <GitCompare className="w-4 h-4" />
          New Comparison
        </button>
      </div>

      <div className="space-y-4">
        {comparisons.map(comparison => (
          <div key={comparison.id} className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">
                Comparison #{comparison.id.slice(-8)}
              </h4>
              <span className="text-sm text-gray-500">
                {new Date(comparison.metadata.comparedAt).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparison.responses.map((response, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-medium text-gray-700">Response {index + 1}</span>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(response.response.status)}`}>
                      {response.response.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {response.request.method} {response.request.url}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDuration(response.performance.total)} • {formatBytes(response.performance.size.response)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Status Comparison</h5>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    comparison.comparison.status.equal ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {comparison.comparison.status.equal ? 'Same' : 'Different'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {comparison.comparison.status.value1} vs {comparison.comparison.status.value2}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Headers Comparison</h5>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    !comparison.comparison.headers.hasChanges ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {!comparison.comparison.headers.hasChanges ? 'Same' : 'Differences Found'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {comparison.comparison.headers.summary.changed} changed, {comparison.comparison.headers.summary.same} same
                  </span>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h5 className="font-medium text-gray-700 mb-2">Performance Comparison</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Response Time:</span>
                    <div className="flex items-center gap-2">
                      <span>{formatDuration(comparison.comparison.performance.total.value1)}</span>
                      <span>→</span>
                      <span>{formatDuration(comparison.comparison.performance.total.value2)}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        comparison.comparison.performance.total.improved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {comparison.comparison.performance.total.percentChange > 0 ? '+' : ''}{comparison.comparison.performance.total.percentChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSchemasTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Response Schemas</h3>
        <button
          onClick={() => setShowSchemaModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Schema
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schemas.map(schema => (
          <div key={schema.id} className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{schema.name}</h4>
              {schema.isDefault && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{schema.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {schema.tags?.map(tag => (
                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setValidationForm({ ...validationForm, schemaId: schema.id })}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Use for Validation
              </button>
              <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Schema Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Response Schema</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schema Name</label>
                <input
                  type="text"
                  value={schemaForm.name}
                  onChange={(e) => setSchemaForm({ ...schemaForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="My API Schema"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={schemaForm.description}
                  onChange={(e) => setSchemaForm({ ...schemaForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Describe your schema..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JSON Schema</label>
                <textarea
                  value={schemaForm.schema}
                  onChange={(e) => setSchemaForm({ ...schemaForm, schema: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 font-mono text-sm"
                  rows={10}
                  placeholder={JSON.stringify({
                    type: "object",
                    properties: {
                      success: { type: "boolean" },
                      data: { type: "object" },
                      message: { type: "string" }
                    },
                    required: ["success"]
                  }, null, 2)}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateSchema}
                disabled={!schemaForm.name || !schemaForm.schema}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Create Schema
              </button>
              <button
                onClick={() => setShowSchemaModal(false)}
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

  const renderValidationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Response Validations</h3>
        <button
          onClick={() => setShowValidationModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Validate Response
        </button>
      </div>

      <div className="space-y-4">
        {validations.map(validation => (
          <div key={validation.id} className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-full ${
                  validation.result.valid ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {validation.result.valid ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </span>
                <div>
                  <h4 className="font-semibold text-gray-800">
                    Validation #{validation.id.slice(-8)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Response {validation.responseId.slice(-8)} against schema {validation.schemaId}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(validation.metadata.validatedAt).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Validation Result</h5>
                <div className={`p-3 rounded-lg ${
                  validation.result.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${
                      validation.result.valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {validation.result.valid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  
                  {validation.result.errors.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-red-700">Errors:</span>
                      {validation.result.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600">• {error}</div>
                      ))}
                    </div>
                  )}
                  
                  {validation.result.warnings.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <span className="text-sm font-medium text-yellow-700">Warnings:</span>
                      {validation.result.warnings.map((warning, index) => (
                        <div key={index} className="text-sm text-yellow-600">• {warning}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Validate Response</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                <select
                  value={validationForm.responseId}
                  onChange={(e) => setValidationForm({ ...validationForm, responseId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select a response</option>
                  {cachedResponses.map(response => (
                    <option key={response.id} value={response.id}>
                      {response.request.method} {response.request.url.slice(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schema</label>
                <select
                  value={validationForm.schemaId}
                  onChange={(e) => setValidationForm({ ...validationForm, schemaId: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select a schema</option>
                  {schemas.map(schema => (
                    <option key={schema.id} value={schema.id}>
                      {schema.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleValidateResponse}
                disabled={!validationForm.responseId || !validationForm.schemaId}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Validate
              </button>
              <button
                onClick={() => setShowValidationModal(false)}
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

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Performance Metrics</h3>
      
      {performanceStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {performanceStats.requestCount}
                </div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(performanceStats.averageResponseTime)}
                </div>
                <div className="text-sm text-gray-600">Avg Response Time</div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(performanceStats.p95ResponseTime)}
                </div>
                <div className="text-sm text-gray-600">95th Percentile</div>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatBytes(performanceStats.totalDataTransferred)}
                </div>
                <div className="text-sm text-gray-600">Data Transferred</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-8 text-center">
          <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No performance data available</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">⚡ Advanced Response</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-50">
              📤 Export
            </button>
            <button className="px-3 py-1 text-green-600 border border-green-600 rounded text-sm hover:bg-green-50">
              📥 Import
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 px-6 py-2">
        <div className="flex gap-1">
          {[
            { id: 'cache', label: `Cache (${cachedResponses.length})`, icon: Database },
            { id: 'comparisons', label: `Comparisons (${comparisons.length})`, icon: GitCompare },
            { id: 'schemas', label: `Schemas (${schemas.length})`, icon: Shield },
            { id: 'validations', label: `Validations (${validations.length})`, icon: CheckCircle },
            { id: 'performance', label: 'Performance', icon: BarChart }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'cache' && renderCacheTab()}
        {activeTab === 'comparisons' && renderComparisonsTab()}
        {activeTab === 'schemas' && renderSchemasTab()}
        {activeTab === 'validations' && renderValidationsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </div>
    </div>
  );
};

export default AdvancedResponse;