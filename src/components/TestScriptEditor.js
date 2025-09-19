import React, { useState } from 'react';
import { Play, Book, Copy, RotateCcw } from 'lucide-react';

const TestScriptEditor = ({ 
  preRequestScript = '', 
  postRequestScript = '', 
  onScriptChange,
  testResults = null,
  preRequestLogs = []
}) => {
  const [activeTab, setActiveTab] = useState('pre-request');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleScriptChange = (scriptType, value) => {
    onScriptChange(scriptType, value);
  };

  const insertTemplate = (template) => {
    const currentScript = activeTab === 'pre-request' ? preRequestScript : postRequestScript;
    const newScript = currentScript + (currentScript ? '\n\n' : '') + template;
    handleScriptChange(activeTab === 'pre-request' ? 'preRequestScript' : 'postRequestScript', newScript);
    setShowTemplates(false);
  };

  const clearScript = () => {
    handleScriptChange(activeTab === 'pre-request' ? 'preRequestScript' : 'postRequestScript', '');
  };

  const getTemplates = () => {
    const { testingFramework } = require('../services/testingFramework');
    return activeTab === 'pre-request' 
      ? testingFramework.getPreRequestTemplates()
      : testingFramework.getTestTemplates();
  };

  const renderTestResults = () => {
    if (!testResults) return null;

    const { tests = [], logs = [] } = testResults;
    const summary = tests.length > 0 ? {
      total: tests.length,
      passed: tests.filter(t => t.passed).length,
      failed: tests.filter(t => !t.passed).length,
      passRate: (tests.filter(t => t.passed).length / tests.length) * 100
    } : null;

    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Test Results</h4>
        
        {summary && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Total: {summary.total}</span>
              <span className="text-green-600">Passed: {summary.passed}</span>
              <span className="text-red-600">Failed: {summary.failed}</span>
              <span className="font-medium">
                Pass Rate: {summary.passRate.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {tests.length > 0 && (
          <div className="space-y-2 mb-4">
            {tests.map((test, index) => (
              <div 
                key={index}
                className={`p-2 rounded border-l-4 ${
                  test.passed 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    test.passed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {test.passed ? '✓' : '✗'} {test.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {test.duration}ms
                  </span>
                </div>
                {test.error && (
                  <div className="mt-1 text-sm text-red-600 font-mono">
                    {test.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {logs.length > 0 && (
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Console Output</h5>
            <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm max-h-32 overflow-y-auto">
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

  const renderPreRequestLogs = () => {
    if (!preRequestLogs || preRequestLogs.length === 0) return null;

    return (
      <div className="mt-4 border-t pt-4">
        <h4 className="font-semibold text-gray-800 mb-3">Pre-request Script Output</h4>
        <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm max-h-32 overflow-y-auto">
          {preRequestLogs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-500">[{log.level}]</span> {log.message}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pre-request')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'pre-request'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Pre-request Script
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'tests'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Tests
          {testResults?.tests?.length > 0 && (
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              testResults.tests.every(t => t.passed)
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {testResults.tests.filter(t => t.passed).length}/{testResults.tests.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {activeTab === 'pre-request' ? 'Pre-request Script' : 'Post-request Script (Tests)'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              <Book size={14} />
              Templates
            </button>
            <button
              onClick={clearScript}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              title="Clear Script"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {showTemplates && (
          <div className="mb-4 p-3 bg-gray-50 rounded border">
            <h4 className="font-medium mb-2">Script Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {Object.entries(getTemplates()).map(([name, template]) => (
                <button
                  key={name}
                  onClick={() => insertTemplate(template)}
                  className="text-left p-2 bg-white hover:bg-blue-50 rounded border text-sm"
                >
                  <div className="font-medium text-blue-600">{name}</div>
                  <div className="text-gray-600 text-xs mt-1 truncate">
                    {template.split('\n')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <textarea
            value={activeTab === 'pre-request' ? preRequestScript : postRequestScript}
            onChange={(e) => handleScriptChange(
              activeTab === 'pre-request' ? 'preRequestScript' : 'postRequestScript',
              e.target.value
            )}
            placeholder={
              activeTab === 'pre-request'
                ? `// Pre-request script - executed before sending the request
// You can set variables, modify request data, etc.

// Example:
pm.environment.set("timestamp", Date.now());
pm.request.headers["X-Request-ID"] = uuid();`
                : `// Test script - executed after receiving the response
// Write tests to validate the response

// Example:
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response time is acceptable", function () {
    pm.expect(pm.response.responseTime).to.be.below(1000);
});`
            }
            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="text-xs text-gray-500 mb-2">
          Available objects: <code>pm</code>, <code>console</code>, <code>JSON</code>, <code>Date</code>, <code>Math</code>
          <br />
          Utility functions: <code>uuid()</code>, <code>randomInt()</code>, <code>randomString()</code>, <code>btoa()</code>, <code>atob()</code>
        </div>

        {activeTab === 'pre-request' && renderPreRequestLogs()}
        {activeTab === 'tests' && renderTestResults()}
      </div>
    </div>
  );
};

export default TestScriptEditor;