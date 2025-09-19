import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Zap, Settings, Download, TrendingUp } from 'lucide-react';

const RequestRunner = ({ 
  collections, 
  onRunCollection, 
  onRunRequest,
  activeRun = null,
  onStopRun,
  runResults = null 
}) => {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [runMode, setRunMode] = useState('sequential'); // sequential, parallel
  const [runSettings, setRunSettings] = useState({
    iterations: 1,
    delay: 0, // delay between requests in ms
    timeout: 30000, // request timeout in ms
    stopOnError: false,
    environment: '',
    dataFile: null
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);
  const fileInputRef = useRef(null);

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollection(collectionId);
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      setSelectedRequests(collection.requests.map(r => r.id));
    }
  };

  const handleRequestToggle = (requestId) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = () => {
    const collection = collections.find(c => c.id === selectedCollection);
    if (collection) {
      setSelectedRequests(collection.requests.map(r => r.id));
    }
  };

  const handleSelectNone = () => {
    setSelectedRequests([]);
  };

  const handleDataFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Parse CSV or JSON data
          const content = e.target.result;
          let data = [];
          
          if (file.name.endsWith('.csv')) {
            // Simple CSV parsing
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            data = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split(',').map(v => v.trim());
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
          } else if (file.name.endsWith('.json')) {
            data = JSON.parse(content);
          }
          
          setRunSettings(prev => ({ ...prev, dataFile: { name: file.name, data } }));
        } catch (error) {
          alert('Error parsing data file: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const startRun = () => {
    if (!selectedCollection || selectedRequests.length === 0) {
      alert('Please select a collection and at least one request');
      return;
    }

    const collection = collections.find(c => c.id === selectedCollection);
    const requests = collection.requests.filter(r => selectedRequests.includes(r.id));

    const runConfig = {
      collectionId: selectedCollection,
      requests,
      mode: runMode,
      settings: runSettings,
      performanceMode,
      timestamp: Date.now()
    };

    onRunCollection(runConfig);
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const calculateStats = (results) => {
    if (!results || !results.requests) return null;

    const total = results.requests.length;
    const passed = results.requests.filter(r => r.success).length;
    const failed = total - passed;
    const avgResponseTime = results.requests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / total;
    const totalTime = results.endTime - results.startTime;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      avgResponseTime: Math.round(avgResponseTime),
      totalTime,
      requestsPerSecond: total > 0 ? (total / (totalTime / 1000)).toFixed(2) : 0
    };
  };

  const exportResults = () => {
    if (!runResults) return;

    const data = {
      summary: calculateStats(runResults),
      results: runResults,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postman-run-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedCollectionData = collections.find(c => c.id === selectedCollection);
  const stats = runResults ? calculateStats(runResults) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Collection Runner</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPerformanceMode(!performanceMode)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${
              performanceMode 
                ? 'bg-orange-100 text-orange-800 border border-orange-300' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Zap size={16} />
            Performance Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">Run Configuration</h3>

            {/* Collection Selection */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => handleCollectionSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select a collection...</option>
                  {collections.map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name} ({collection.requests.length} requests)
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Selection */}
              {selectedCollectionData && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Requests ({selectedRequests.length}/{selectedCollectionData.requests.length})
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSelectAll}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        All
                      </button>
                      <button
                        onClick={handleSelectNone}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        None
                      </button>
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 space-y-1">
                    {selectedCollectionData.requests.map(request => (
                      <label key={request.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request.id)}
                          onChange={() => handleRequestToggle(request.id)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {request.name || `${request.method} ${request.url}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Execution Mode
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setRunMode('sequential')}
                    className={`flex-1 px-3 py-2 text-sm rounded ${
                      runMode === 'sequential'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Sequential
                  </button>
                  <button
                    onClick={() => setRunMode('parallel')}
                    className={`flex-1 px-3 py-2 text-sm rounded ${
                      runMode === 'parallel'
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Parallel
                  </button>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  <Settings size={16} />
                  Advanced Settings
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded border">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Iterations
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={runSettings.iterations}
                        onChange={(e) => setRunSettings(prev => ({ 
                          ...prev, iterations: parseInt(e.target.value) || 1 
                        }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delay Between Requests (ms)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={runSettings.delay}
                        onChange={(e) => setRunSettings(prev => ({ 
                          ...prev, delay: parseInt(e.target.value) || 0 
                        }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Request Timeout (ms)
                      </label>
                      <input
                        type="number"
                        min="1000"
                        value={runSettings.timeout}
                        onChange={(e) => setRunSettings(prev => ({ 
                          ...prev, timeout: parseInt(e.target.value) || 30000 
                        }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={runSettings.stopOnError}
                          onChange={(e) => setRunSettings(prev => ({ 
                            ...prev, stopOnError: e.target.checked 
                          }))}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Stop on first error</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data File (CSV/JSON)
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={handleDataFileUpload}
                        className="w-full text-sm"
                      />
                      {runSettings.dataFile && (
                        <p className="text-xs text-green-600 mt-1">
                          Loaded: {runSettings.dataFile.name} ({runSettings.dataFile.data.length} rows)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Run Button */}
            <div className="mt-6 space-y-2">
              {!activeRun ? (
                <button
                  onClick={startRun}
                  disabled={!selectedCollection || selectedRequests.length === 0}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Play size={16} className="mr-2" />
                  Start Run
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={onStopRun}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                  >
                    <Square size={16} className="mr-2" />
                    Stop Run
                  </button>
                  <div className="text-sm text-gray-600 text-center">
                    Running {activeRun.current}/{activeRun.total} requests...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-4">
          {stats && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Run Results</h3>
                <button
                  onClick={exportResults}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <Download size={14} />
                  Export
                </button>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Requests</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{stats.passRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Pass Rate</div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 p-3 bg-orange-50 rounded">
                  <Clock size={20} className="text-orange-600" />
                  <div>
                    <div className="font-medium text-gray-900">{formatDuration(stats.totalTime)}</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded">
                  <TrendingUp size={20} className="text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">{stats.avgResponseTime}ms</div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-indigo-50 rounded">
                  <Zap size={20} className="text-indigo-600" />
                  <div>
                    <div className="font-medium text-gray-900">{stats.requestsPerSecond}</div>
                    <div className="text-sm text-gray-600">Requests/Second</div>
                  </div>
                </div>
              </div>

              {/* Request Results */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h4 className="font-medium text-gray-800">Request Details</h4>
                {runResults.requests.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      result.success 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.success ? '✓' : '✗'} {result.name}
                        </span>
                        <div className="text-sm text-gray-600 mt-1">
                          {result.method} {result.url}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {result.status || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.responseTime}ms
                        </div>
                      </div>
                    </div>
                    {result.error && (
                      <div className="mt-2 text-sm text-red-600 font-mono">
                        {result.error}
                      </div>
                    )}
                    {result.tests && result.tests.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">
                          Tests: {result.tests.filter(t => t.passed).length}/{result.tests.length} passed
                        </div>
                        {result.tests.filter(t => !t.passed).map((test, idx) => (
                          <div key={idx} className="text-xs text-red-600">
                            ✗ {test.name}: {test.error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!runResults && !activeRun && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Play size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Run</h3>
              <p className="text-gray-600">
                Select a collection and configure your run settings to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestRunner;