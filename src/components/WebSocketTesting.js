import React, { useState, useEffect } from 'react';

const WebSocketTesting = () => {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [activeTab, setActiveTab] = useState('connections');
  const [messageHistory, setMessageHistory] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [connectionForm, setConnectionForm] = useState({
    url: '',
    protocols: [],
    headers: {}
  });

  useEffect(() => {
    loadData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadData();
        if (selectedConnection) {
          loadMessageHistory(selectedConnection);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedConnection]);

  const loadData = async () => {
    try {
      const [connectionsRes, statsRes] = await Promise.all([
        fetch('/api/websocket/connections'),
        fetch('/api/websocket/stats')
      ]);

      if (connectionsRes.ok) setConnections(await connectionsRes.json());
      if (statsRes.ok) setStatistics(await statsRes.json());
    } catch (error) {
      console.error('Error loading WebSocket data:', error);
    }
  };

  const loadMessageHistory = async (connectionId) => {
    try {
      const response = await fetch(`/api/websocket/connections/${connectionId}/messages`);
      if (response.ok) {
        const messages = await response.json();
        setMessageHistory(messages);
      }
    } catch (error) {
      console.error('Error loading message history:', error);
    }
  };

  const handleCreateConnection = async () => {
    try {
      const response = await fetch('/api/websocket/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionForm)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadData();
          setSelectedConnection(result.connectionId);
          setShowConnectionForm(false);
          setConnectionForm({ url: '', protocols: [], headers: {} });
        } else {
          alert('Connection failed: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Error creating connection');
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConnection || !newMessage) return;

    try {
      const response = await fetch(`/api/websocket/connections/${selectedConnection}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage,
          messageType
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewMessage('');
        await loadMessageHistory(selectedConnection);
      } else {
        alert('Failed to send message: ' + result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const handleCloseConnection = async (connectionId) => {
    try {
      const response = await fetch(`/api/websocket/connections/${connectionId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 1000, reason: 'User closed connection' })
      });

      if (response.ok) {
        await loadData();
        if (selectedConnection === connectionId) {
          setSelectedConnection(null);
          setMessageHistory([]);
        }
      }
    } catch (error) {
      console.error('Error closing connection:', error);
    }
  };

  const handleDeleteConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) return;

    try {
      const response = await fetch(`/api/websocket/connections/${connectionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
        if (selectedConnection === connectionId) {
          setSelectedConnection(null);
          setMessageHistory([]);
        }
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'connecting': return 'text-yellow-600 bg-yellow-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMessageTypeColor = (type) => {
    switch (type) {
      case 'message': return 'text-blue-600 bg-blue-100';
      case 'system': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'ping': return 'text-purple-600 bg-purple-100';
      case 'pong': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDirectionIcon = (direction) => {
    switch (direction) {
      case 'sent': return '📤';
      case 'received': return '📥';
      case 'system': return '⚙️';
      default: return '📨';
    }
  };

  const renderConnections = () => {
    const selectedConnectionData = connections.find(c => c.id === selectedConnection);

    return (
      <div className="flex gap-6 h-full">
        <div className="w-96 bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gray-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">WebSocket Connections</h3>
              <button 
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                onClick={() => setShowConnectionForm(true)}
              >
                + New Connection
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {connections.map(conn => (
              <div 
                key={conn.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedConnection === conn.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedConnection(conn.id);
                  loadMessageHistory(conn.id);
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-medium text-gray-800 truncate flex-1">
                    {new URL(conn.url).hostname}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(conn.status)}`}>
                    {conn.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 font-mono mb-2 truncate">{conn.url}</div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{conn.messageCount} messages</span>
                  <div className="flex gap-2">
                    {conn.status === 'connected' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseConnection(conn.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Close connection"
                      >
                        🔌
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConnection(conn.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete connection"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow border">
          {selectedConnectionData ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {new URL(selectedConnectionData.url).hostname}
                    </h2>
                    <div className="text-sm text-gray-600 font-mono">{selectedConnectionData.url}</div>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className={`px-2 py-1 rounded ${getStatusColor(selectedConnectionData.status)}`}>
                        {selectedConnectionData.status}
                      </span>
                      <span className="text-gray-600">
                        {selectedConnectionData.stats?.messagesReceived || 0} received, {selectedConnectionData.stats?.messagesSent || 0} sent
                      </span>
                      {selectedConnectionData.stats?.averageLatency > 0 && (
                        <span className="text-gray-600">
                          ~{Math.round(selectedConnectionData.stats.averageLatency)}ms latency
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                      />
                      Auto-refresh
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-2 mb-4">
                  {messageHistory.map(message => (
                    <div key={message.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span>{getDirectionIcon(message.direction)}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getMessageTypeColor(message.type)}`}>
                            {message.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                          {message.size && (
                            <span className="text-xs text-gray-500">
                              {message.size} bytes
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`text-sm font-mono p-2 rounded ${
                        message.type === 'error' ? 'bg-red-50 text-red-800' :
                        message.direction === 'sent' ? 'bg-blue-50 text-blue-800' :
                        'bg-gray-50 text-gray-800'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  ))}
                  
                  {messageHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No messages yet. Send a message to start the conversation.</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedConnectionData.status === 'connected' && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2 mb-2">
                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="text">Text</option>
                      <option value="binary">Binary</option>
                      <option value="ping">Ping</option>
                    </select>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Enter message..."
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage}
                      className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select a WebSocket connection</h3>
                <p>Choose a connection from the sidebar to view messages and interact with it.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStatistics = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-6">📊 WebSocket Statistics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalConnections || 0}</div>
            <div className="text-sm text-gray-600">Total Connections</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{statistics.activeConnections || 0}</div>
            <div className="text-sm text-gray-600">Active Connections</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{statistics.totalMessages || 0}</div>
            <div className="text-sm text-gray-600">Total Messages</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {statistics.totalBytes ? `${(statistics.totalBytes / 1024).toFixed(1)}KB` : '0KB'}
            </div>
            <div className="text-sm text-gray-600">Total Data</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{statistics.totalErrors || 0}</div>
            <div className="text-sm text-gray-600">Total Errors</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🔌 WebSocket Testing</h1>
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
            { id: 'connections', label: `Connections (${connections.length})` },
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
        {activeTab === 'connections' && renderConnections()}
        {activeTab === 'stats' && renderStatistics()}
      </div>

      {showConnectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Create WebSocket Connection</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WebSocket URL</label>
                <input
                  type="text"
                  value={connectionForm.url}
                  onChange={(e) => setConnectionForm({ ...connectionForm, url: e.target.value })}
                  placeholder="wss://echo.websocket.org"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Protocols (comma-separated)</label>
                <input
                  type="text"
                  onChange={(e) => setConnectionForm({ 
                    ...connectionForm, 
                    protocols: e.target.value.split(',').map(p => p.trim()).filter(p => p)
                  })}
                  placeholder="chat, echo"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowConnectionForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConnection}
                disabled={!connectionForm.url}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketTesting;