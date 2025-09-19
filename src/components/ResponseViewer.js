import React, { useState, useEffect } from 'react';
import { Clock, Database, CheckCircle, XCircle, AlertCircle, Copy, Download } from 'lucide-react';

const ResponseViewer = ({ response, loading }) => {
  const [activeTab, setActiveTab] = useState('body');
  const [formattedBody, setFormattedBody] = useState('');
  const [bodyType, setBodyType] = useState('json');

  useEffect(() => {
    if (response && response.data) {
      formatResponseBody(response.data);
    }
  }, [response]);

  const formatResponseBody = (data) => {
    try {
      if (typeof data === 'object') {
        setFormattedBody(JSON.stringify(data, null, 2));
        setBodyType('json');
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          setFormattedBody(JSON.stringify(parsed, null, 2));
          setBodyType('json');
        } catch {
          setFormattedBody(data);
          setBodyType('text');
        }
      } else {
        setFormattedBody(String(data));
        setBodyType('text');
      }
    } catch (error) {
      setFormattedBody(String(data));
      setBodyType('text');
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600 bg-green-50 border-green-200';
    if (status >= 300 && status < 400) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (status >= 400 && status < 500) return 'text-red-600 bg-red-50 border-red-200';
    if (status >= 500) return 'text-purple-600 bg-purple-50 border-purple-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = (status) => {
    if (status >= 200 && status < 300) return <CheckCircle className="w-4 h-4" />;
    if (status >= 300 && status < 400) return <AlertCircle className="w-4 h-4" />;
    if (status >= 400) return <XCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const downloadResponse = () => {
    const blob = new Blob([formattedBody], { 
      type: bodyType === 'json' ? 'application/json' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response.${bodyType === 'json' ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-gray-600">Sending request...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  if (response.error) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <XCircle className="w-5 h-5" />
          <h3 className="font-semibold">Request Failed</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">{response.message}</p>
          {response.code && (
            <p className="text-red-600 text-sm mt-1">Error Code: {response.code}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Response Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Response</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => copyToClipboard(formattedBody)}
              className="btn-secondary text-sm flex items-center"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </button>
            <button
              onClick={downloadResponse}
              className="btn-secondary text-sm flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Download
            </button>
          </div>
        </div>

        {/* Status and Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`flex items-center space-x-2 p-3 rounded-lg border ${getStatusColor(response.status)}`}>
            {getStatusIcon(response.status)}
            <div>
              <div className="font-semibold">Status</div>
              <div className="text-sm">
                {response.status} {response.statusText}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-semibold text-blue-900">Time</div>
              <div className="text-sm text-blue-700">
                {response.duration ? `${response.duration}ms` : 'N/A'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 rounded-lg bg-purple-50 border border-purple-200">
            <Database className="w-4 h-4 text-purple-600" />
            <div>
              <div className="font-semibold text-purple-900">Size</div>
              <div className="text-sm text-purple-700">
                {response.size ? formatBytes(response.size) : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 px-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('body')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'body'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Response Body
          </button>
          
          <button
            onClick={() => setActiveTab('headers')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'headers'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Headers ({response.headers ? Object.keys(response.headers).length : 0})
          </button>

          {response.testResults && (
            <button
              onClick={() => setActiveTab('tests')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tests'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tests 
              {response.testResults.tests && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  response.testResults.tests.every(t => t.passed)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {response.testResults.tests.filter(t => t.passed).length}/{response.testResults.tests.length}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'body' && (
          <ResponseBody body={formattedBody} type={bodyType} />
        )}
        
        {activeTab === 'headers' && (
          <ResponseHeaders headers={response.headers} />
        )}

        {activeTab === 'tests' && response.testResults && (
          <TestResults testResults={response.testResults} />
        )}
      </div>
    </div>
  );
};

const ResponseBody = ({ body, type }) => {
  if (!body) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No response body</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-700">Response Body</h4>
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          type === 'json' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {type.toUpperCase()}
        </span>
      </div>
      
      <div className="relative">
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm overflow-auto max-h-96 font-mono">
          <code className={type === 'json' ? 'language-json' : ''}>{body}</code>
        </pre>
      </div>
    </div>
  );
};

const ResponseHeaders = ({ headers }) => {
  if (!headers || Object.keys(headers).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No response headers</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700">Response Headers</h4>
      
      <div className="space-y-2">
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} className="flex border-b border-gray-100 pb-2">
            <div className="w-1/3 font-medium text-gray-700 break-all">
              {key}:
            </div>
            <div className="w-2/3 text-gray-600 break-all font-mono text-sm">
              {Array.isArray(value) ? value.join(', ') : value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const TestResults = ({ testResults }) => {
  if (!testResults || !testResults.tests || testResults.tests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No tests were executed</p>
      </div>
    );
  }

  const { tests, logs = [] } = testResults;
  const summary = {
    total: tests.length,
    passed: tests.filter(t => t.passed).length,
    failed: tests.filter(t => !t.passed).length,
    passRate: (tests.filter(t => t.passed).length / tests.length) * 100
  };

  return (
    <div className="space-y-6">
      {/* Test Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3">Test Summary</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.passRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Pass Rate</div>
          </div>
        </div>
      </div>

      {/* Individual Test Results */}
      <div>
        <h4 className="font-medium text-gray-800 mb-3">Test Results</h4>
        <div className="space-y-2">
          {tests.map((test, index) => (
            <div 
              key={index}
              className={`p-3 rounded border-l-4 ${
                test.passed 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  test.passed ? 'text-green-800' : 'text-red-800'
                }`}>
                  {test.passed ? <CheckCircle className="w-4 h-4 inline mr-2" /> : <XCircle className="w-4 h-4 inline mr-2" />}
                  {test.name}
                </span>
                <span className="text-xs text-gray-500">
                  {test.duration}ms
                </span>
              </div>
              {test.error && (
                <div className="mt-2 text-sm text-red-600 font-mono">
                  {test.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Console Logs */}
      {logs.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-800 mb-3">Console Output</h4>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{log.level}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponseViewer;