import React, { useState } from 'react';
import { Upload, Download, FileText, Code, Copy, Check, X, AlertCircle } from 'lucide-react';
import { importExportService } from '../services/importExportService';
import { storageService } from '../services/storageService';

const ImportExportModal = ({ isOpen, onClose, collections, onImportComplete }) => {
  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState('native');
  const [importFile, setImportFile] = useState(null);
  const [curlCommand, setCurlCommand] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      setError('');
      let exportData, filename;

      if (exportFormat === 'native') {
        exportData = importExportService.exportCollections(collections);
        filename = `postman-mvp-export-${new Date().toISOString().split('T')[0]}.json`;
      } else if (exportFormat === 'postman') {
        exportData = importExportService.exportAsPostmanCollection(collections);
        filename = `postman-collection-${new Date().toISOString().split('T')[0]}.json`;
      }

      importExportService.downloadFile(exportData, filename);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    }
  };

  const handleImport = async () => {
    try {
      setError('');
      setLoading(true);

      if (!importFile) {
        setError('Please select a file to import');
        return;
      }

      const importedData = await importExportService.importFromFile(importFile);
      
      // Save imported collections
      if (importedData.collections && importedData.collections.length > 0) {
        importedData.collections.forEach(collection => {
          storageService.createCollection(collection);
        });
      }

      // Save imported environments
      if (importedData.environments && importedData.environments.length > 0) {
        // Handle environment import if needed
      }

      onImportComplete();
      onClose();
    } catch (err) {
      setError(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCurlImport = () => {
    try {
      setError('');
      if (!curlCommand.trim()) {
        setError('Please enter a cURL command');
        return;
      }

      const request = importExportService.importFromCurl(curlCommand);
      
      // Create a new collection for the imported request
      const collection = {
        id: Date.now().toString(),
        name: 'Imported from cURL',
        requests: [request],
        createdAt: new Date().toISOString()
      };

      storageService.createCollection(collection);
      onImportComplete();
      onClose();
    } catch (err) {
      setError(`cURL import failed: ${err.message}`);
    }
  };

  const handleGenerateCode = () => {
    try {
      setError('');
      if (!selectedRequest) {
        setError('Please select a request to generate code for');
        return;
      }

      const code = importExportService.generateCode(selectedRequest, codeLanguage);
      setGeneratedCode(code);
    } catch (err) {
      setError(`Code generation failed: ${err.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getAllRequests = () => {
    const requests = [];
    collections.forEach(collection => {
      collection.requests.forEach(request => {
        requests.push({ ...request, collectionName: collection.name });
      });
    });
    return requests;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Import / Export</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {['export', 'import', 'curl', 'code'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'export' && <Download className="w-4 h-4 inline mr-2" />}
              {tab === 'import' && <Upload className="w-4 h-4 inline mr-2" />}
              {tab === 'curl' && <FileText className="w-4 h-4 inline mr-2" />}
              {tab === 'code' && <Code className="w-4 h-4 inline mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'export' && (
            <ExportTab
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              onExport={handleExport}
              collections={collections}
            />
          )}

          {activeTab === 'import' && (
            <ImportTab
              importFile={importFile}
              setImportFile={setImportFile}
              onImport={handleImport}
              loading={loading}
            />
          )}

          {activeTab === 'curl' && (
            <CurlTab
              curlCommand={curlCommand}
              setCurlCommand={setCurlCommand}
              onImport={handleCurlImport}
            />
          )}

          {activeTab === 'code' && (
            <CodeTab
              codeLanguage={codeLanguage}
              setCodeLanguage={setCodeLanguage}
              selectedRequest={selectedRequest}
              setSelectedRequest={setSelectedRequest}
              generatedCode={generatedCode}
              onGenerate={handleGenerateCode}
              onCopy={copyToClipboard}
              copied={copied}
              requests={getAllRequests()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ExportTab = ({ exportFormat, setExportFormat, onExport, collections }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Export Collections</h3>
        <p className="text-gray-600 mb-4">
          Export your collections and environments to share with others or backup your data.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="input-field"
          >
            <option value="native">PostWomen Format</option>
            <option value="postman">Postman Collection v2.1</option>
          </select>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Collections: {collections.length}</div>
            <div>
              Total Requests: {collections.reduce((sum, col) => sum + (col.requests?.length || 0), 0)}
            </div>
            <div>Format: {exportFormat === 'native' ? 'PostWomen' : 'Postman Collection'}</div>
          </div>
        </div>

        <button
          onClick={onExport}
          disabled={collections.length === 0}
          className="btn-primary disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Collections
        </button>
      </div>
    </div>
  );
};

const ImportTab = ({ importFile, setImportFile, onImport, loading }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import Collections</h3>
        <p className="text-gray-600 mb-4">
          Import collections from PostWomen exports or Postman collection files.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setImportFile(e.target.files[0])}
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: PostWomen exports, Postman Collection v2.x
          </p>
        </div>

        {importFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Selected File</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Name: {importFile.name}</div>
              <div>Size: {(importFile.size / 1024).toFixed(2)} KB</div>
              <div>Type: {importFile.type || 'application/json'}</div>
            </div>
          </div>
        )}

        <button
          onClick={onImport}
          disabled={!importFile || loading}
          className="btn-primary disabled:opacity-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          {loading ? 'Importing...' : 'Import Collections'}
        </button>
      </div>
    </div>
  );
};

const CurlTab = ({ curlCommand, setCurlCommand, onImport }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Import from cURL</h3>
        <p className="text-gray-600 mb-4">
          Paste a cURL command to automatically create a request with the same parameters.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            cURL Command
          </label>
          <textarea
            value={curlCommand}
            onChange={(e) => setCurlCommand(e.target.value)}
            placeholder={`curl -X POST https://api.example.com/users \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer token' \\
  -d '{"name": "John Doe"}'`}
            className="input-field h-32 font-mono text-sm"
          />
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Supported Features</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• HTTP methods (-X)</li>
            <li>• Headers (-H)</li>
            <li>• Request body (-d)</li>
            <li>• Basic authentication (-u)</li>
          </ul>
        </div>

        <button
          onClick={onImport}
          disabled={!curlCommand.trim()}
          className="btn-primary disabled:opacity-50"
        >
          <FileText className="w-4 h-4 mr-2" />
          Import from cURL
        </button>
      </div>
    </div>
  );
};

const CodeTab = ({ 
  codeLanguage, 
  setCodeLanguage, 
  selectedRequest, 
  setSelectedRequest, 
  generatedCode, 
  onGenerate, 
  onCopy, 
  copied, 
  requests 
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Code</h3>
        <p className="text-gray-600 mb-4">
          Generate code snippets in various programming languages for your API requests.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Programming Language
          </label>
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="input-field"
          >
            <option value="javascript">JavaScript (Fetch)</option>
            <option value="python">Python (Requests)</option>
            <option value="curl">cURL</option>
            <option value="php">PHP (cURL)</option>
            <option value="java">Java (HttpURLConnection)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Request
          </label>
          <select
            value={selectedRequest?.id || ''}
            onChange={(e) => {
              const request = requests.find(r => r.id === e.target.value);
              setSelectedRequest(request);
            }}
            className="input-field"
          >
            <option value="">Choose a request...</option>
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                [{request.collectionName}] {request.name} - {request.method}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={!selectedRequest}
        className="btn-primary disabled:opacity-50"
      >
        <Code className="w-4 h-4 mr-2" />
        Generate Code
      </button>

      {generatedCode && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Generated Code</h4>
            <button
              onClick={() => onCopy(generatedCode)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
            <code>{generatedCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default ImportExportModal;