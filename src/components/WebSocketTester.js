import React, { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

export default function WebSocketTester() {
  const [url, setUrl] = useState('wss://echo.websocket.org');
  const [connectionId, setConnectionId] = useState(null);
  const [status, setStatus] = useState('disconnected'); // connecting, connected, disconnected, error
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Poll for messages when connected
  useEffect(() => {
    let interval;
    if (connectionId && status === 'connected') {
      interval = setInterval(fetchStatusAndMessages, 1000);
    }
    return () => clearInterval(interval);
  }, [connectionId, status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchStatusAndMessages = async () => {
    if (!connectionId) return;
    try {
      // Get Status
      const statusRes = await fetch(`${API_BASE}/ws/${connectionId}`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setStatus(data.status);
      }

      // Get Messages
      const msgRes = await fetch(`${API_BASE}/ws/${connectionId}/messages`);
      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to poll WS', err);
    }
  };

  const handleConnect = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ws/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      
      setConnectionId(data.id);
      setStatus('connecting');
      setMessages([]);
      
      // Wait a moment then fetch status
      setTimeout(fetchStatusAndMessages, 500);
    } catch (err) {
      alert(err.message);
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connectionId) return;
    try {
      await fetch(`${API_BASE}/ws/${connectionId}`, { method: 'DELETE' });
      setStatus('disconnected');
      setConnectionId(null);
    } catch (err) {
      console.error('Failed to disconnect', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !connectionId || status !== 'connected') return;
    
    try {
      await fetch(`${API_BASE}/ws/${connectionId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput })
      });
      setMessageInput('');
      fetchStatusAndMessages(); // Immediately fetch to show the sent message
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="card">
      <div className="card-header justify-between">
        <span className="card-title">WebSocket Tester</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          Status: 
          <span style={{ 
            color: status === 'connected' ? 'var(--green)' : 
                   status === 'connecting' ? 'var(--yellow)' : 
                   status === 'error' ? 'var(--red)' : 'var(--text-muted)',
            fontWeight: 600
          }}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* ── Connection Bar ── */}
        <div className="url-bar">
          <input
            className="url-input mono"
            placeholder="wss://..."
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={status !== 'disconnected'}
          />
          {status === 'disconnected' ? (
            <button className={`btn-send ${loading ? 'loading' : ''}`} onClick={handleConnect} disabled={!url || loading}>
              Connect
            </button>
          ) : (
            <button className="btn-send" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} onClick={handleDisconnect}>
              Disconnect
            </button>
          )}
        </div>

        {/* ── Messages Area ── */}
        <div 
          style={{ 
            height: 300, 
            background: 'var(--bg-app)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-sm)', 
            padding: 12,
            overflowY: 'auto'
          }}
        >
          {messages.length === 0 ? (
            <div className="empty-state" style={{ height: '100%', padding: 0 }}>
              <p>{status === 'connected' ? 'No messages yet. Send one below.' : 'Connect to a WebSocket server to see messages.'}</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`ws-message ${m.direction}`}>
                <div className="ws-message-meta">
                  {m.direction.toUpperCase()} • {new Date(m.timestamp).toLocaleTimeString()}
                </div>
                {m.data}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Send Message ── */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
          <input 
            className="input mono" 
            placeholder="Type a message..." 
            value={messageInput}
            onChange={e => setMessageInput(e.target.value)}
            disabled={status !== 'connected'}
          />
          <button type="submit" className="btn btn-primary" disabled={status !== 'connected' || !messageInput.trim()}>
            Send
          </button>
        </form>

      </div>
    </div>
  );
}
