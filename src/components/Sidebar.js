import React, { useState } from 'react';
import { FolderPlus, Folder, FileText, Clock, Plus, Code, TestTube, X } from 'lucide-react';
import { storageService } from '../services/storageService';

const Sidebar = ({ collections, onCreateCollection, onSelectRequest, onAddRequest, onCloseMobile }) => {
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [activeTab, setActiveTab] = useState('collections');
  const [history, setHistory] = useState(storageService.getHistory());
  const [showAddRequestModal, setShowAddRequestModal] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);

  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (newCollectionName.trim()) {
      onCreateCollection(newCollectionName.trim());
      setNewCollectionName('');
      setShowNewCollectionForm(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      setHistory(storageService.getHistory());
    }
  };

  const handleAddRequestToCollection = (collectionId) => {
    setSelectedCollectionId(collectionId);
    setShowAddRequestModal(true);
  };

  const handleCreateRequest = (requestData) => {
    const newRequest = {
      id: Date.now().toString(),
      name: requestData.name,
      method: requestData.method,
      url: requestData.url,
      headers: {},
      body: '',
      auth: null,
      preRequestScript: '',
      postRequestScript: '',
      lastTestResults: null,
      lastPreRequestLogs: [],
      graphqlSchema: null,
      createdAt: new Date().toISOString()
    };

    storageService.saveRequest(newRequest, selectedCollectionId);
    onAddRequest(); // Refresh collections
    
    // Load the new request into the RequestBuilder
    onSelectRequest(newRequest);
    
    setShowAddRequestModal(false);
    setSelectedCollectionId(null);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full overflow-x-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        <button
          onClick={onCloseMobile}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('collections')}
          className={`flex-1 px-3 sm:px-4 py-3 sm:py-3 text-sm font-medium touch-manipulation ${
            activeTab === 'collections'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Folder className="w-4 h-4 inline mr-2" />
          <span className="hidden sm:inline">Collections</span>
          <span className="sm:hidden">Items</span>
        </button>
        <button
          onClick={() => handleTabChange('history')}
          className={`flex-1 px-3 sm:px-4 py-3 sm:py-3 text-sm font-medium touch-manipulation ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          <span className="hidden sm:inline">History</span>
          <span className="sm:hidden">Past</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'collections' && (
          <div className="p-3 sm:p-4">
            {/* New Collection Button */}
            <button
              onClick={() => setShowNewCollectionForm(true)}
              className="w-full flex items-center justify-center px-3 py-3 sm:py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors mb-4 touch-manipulation"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Collection
            </button>

            {/* New Collection Form */}
            {showNewCollectionForm && (
              <form onSubmit={handleCreateCollection} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  className="input-field mb-2"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary text-sm">
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCollectionForm(false);
                      setNewCollectionName('');
                    }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Collections List */}
            <div className="space-y-2">
              {collections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No collections yet</p>
                  <p className="text-xs">Create your first collection</p>
                </div>
              ) : (
                collections.map((collection) => (
                  <CollectionItem
                    key={collection.id}
                    collection={collection}
                    onSelectRequest={onSelectRequest}
                    onAddRequest={handleAddRequestToCollection}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-4">
            <div className="space-y-2">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No history yet</p>
                  <p className="text-xs">Send your first request</p>
                </div>
              ) : (
                history.map((item) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onSelectRequest={onSelectRequest}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Request Modal */}
      {showAddRequestModal && (
        <AddRequestModal
          collectionId={selectedCollectionId}
          collections={collections}
          onCreateRequest={handleCreateRequest}
          onClose={() => {
            setShowAddRequestModal(false);
            setSelectedCollectionId(null);
          }}
        />
      )}
    </div>
  );
};

const CollectionItem = ({ collection, onSelectRequest, onAddRequest }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddRequest = (e) => {
    e.stopPropagation(); // Prevent collection collapse
    onAddRequest(collection.id);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
      >
        <div className="flex items-center">
          <Folder className="w-4 h-4 mr-2 text-gray-600" />
          <span className="font-medium text-gray-900">{collection.name}</span>
        </div>
        <span className="text-xs text-gray-500">
          {collection.requests.length} requests
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Add Request Button */}
          <button
            onClick={handleAddRequest}
            className="w-full flex items-center p-3 text-left hover:bg-gray-100 border-b border-gray-200 text-primary"
          >
            <Plus className="w-3 h-3 mr-2" />
            <span className="text-sm font-medium">Add Request</span>
          </button>

          {/* Existing Requests */}
          {collection.requests.map((request) => (
            <button
              key={request.id}
              onClick={() => onSelectRequest(request)}
              className="w-full flex items-center p-3 text-left hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
            >
              <FileText className="w-3 h-3 mr-2 text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    request.method === 'GET' ? 'bg-green-100 text-green-800' :
                    request.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.method}
                  </span>
                  <span className="text-sm text-gray-900 truncate">{request.name}</span>
                  
                  {/* Script Indicators */}
                  <div className="flex items-center space-x-1">
                    {request.preRequestScript && (
                      <Code size={12} className="text-blue-500" title="Has pre-request script" />
                    )}
                    {request.postRequestScript && (
                      <TestTube size={12} className="text-green-500" title="Has test script" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">{request.url}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const HistoryItem = ({ item, onSelectRequest }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <button
      onClick={() => onSelectRequest(item.request)}
      className="w-full p-3 text-left hover:bg-gray-50 border border-gray-200 rounded-lg"
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          item.request.method === 'GET' ? 'bg-green-100 text-green-800' :
          item.request.method === 'POST' ? 'bg-blue-100 text-blue-800' :
          item.request.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {item.request.method}
        </span>
        <span className={`text-sm font-medium ${getStatusColor(item.response.status)}`}>
          {item.response.status}
        </span>
      </div>
      <p className="text-sm text-gray-900 truncate mb-1">{item.request.url}</p>
      <p className="text-xs text-gray-500">{formatTime(item.timestamp)}</p>
    </button>
  );
};

const AddRequestModal = ({ collectionId, collections, onCreateRequest, onClose }) => {
  const [requestName, setRequestName] = useState('');
  const [requestMethod, setRequestMethod] = useState('GET');
  const [requestUrl, setRequestUrl] = useState('');

  const collection = collections.find(c => c.id === collectionId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (requestName.trim() && requestUrl.trim()) {
      onCreateRequest({
        name: requestName.trim(),
        method: requestMethod,
        url: requestUrl.trim()
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-lg shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Add Request to "{collection?.name}"
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Request Name *
            </label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              placeholder="e.g., Get User Profile, Create Post"
              className="input-field text-base sm:text-sm"
              autoFocus
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              HTTP Method
            </label>
            <select
              value={requestMethod}
              onChange={(e) => setRequestMethod(e.target.value)}
              className="input-field text-base sm:text-sm"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
              <option value="HEAD">HEAD</option>
              <option value="OPTIONS">OPTIONS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL *
            </label>
            <input
              type="text"
              value={requestUrl}
              onChange={(e) => setRequestUrl(e.target.value)}
              placeholder="https://api.example.com/users"
              className="input-field text-base sm:text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Include the full URL with protocol (http:// or https://)
            </p>
          </div>
        </form>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button 
            onClick={onClose} 
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!requestName.trim() || !requestUrl.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;