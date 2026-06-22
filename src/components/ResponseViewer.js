import React, { useState } from 'react';

export default function ResponseViewer({ response, loading }) {
  const [tab, setTab] = useState('body'); // body | headers

  if (loading) {
    return (
      <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div className="spinner" style={{ width: 24, height: 24, borderWidth: 3 }}></div>
        </div>
        <p>Sending request...</p>
      </div>
    );
  }

  if (!response) return null;

  if (response.error) {
    return (
      <div className="card">
        <div className="card-header" style={{ color: 'var(--red)' }}>
          <span className="card-title">Error</span>
        </div>
        <div className="card-body">
          <div className="error-banner" style={{ margin: 0 }}>
            {response.message || 'Failed to fetch'}
          </div>
        </div>
      </div>
    );
  }

  // Format Status Badge
  const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'redirect';
    if (status >= 400 && status < 500) return 'client-error';
    return 'server-error';
  };

  // Format JSON Body
  const getFormattedBody = () => {
    if (!response.data) return '';
    try {
      const jsonStr = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
      // Syntax highlighting approach using CSS classes
      return jsonStr
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
            } else {
              cls = 'json-string';
            }
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return '<span class="' + cls + '">' + match + '</span>';
        });
    } catch {
      return String(response.data);
    }
  };

  return (
    <div className="card mt-4" style={{ marginTop: '16px' }}>
      {/* ── Header: Meta info ── */}
      <div className="card-header justify-between" style={{ padding: '10px 16px' }}>
        <div className="response-meta">
          <div className={`status-badge ${getStatusClass(response.status)}`}>
            <div className={`dot ${getStatusClass(response.status).replace('client-error', 'yellow').replace('server-error', 'red')}`} />
            {response.status} {response.statusText}
          </div>
          <div className="meta-item">
            Time: <strong>{response.duration} ms</strong>
          </div>
          <div className="meta-item">
            Size: <strong>{(response.size / 1024).toFixed(2)} KB</strong>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tab-bar">
        <button className={`tab ${tab === 'body' ? 'active' : ''}`} onClick={() => setTab('body')}>
          Body
        </button>
        <button className={`tab ${tab === 'headers' ? 'active' : ''}`} onClick={() => setTab('headers')}>
          Headers <span style={{ marginLeft: 4, background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 10, padding: '0 5px', fontSize: 10 }}>{Object.keys(response.headers || {}).length}</span>
        </button>
      </div>

      {/* ── Body Tab ── */}
      {tab === 'body' && (
        <div className="card-body" style={{ padding: 0 }}>
          {response.data ? (
            <pre
              className="code-block"
              style={{ margin: 0, borderRadius: 0, border: 'none', background: 'transparent' }}
              dangerouslySetInnerHTML={{ __html: getFormattedBody() }}
            />
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No response body</p>
            </div>
          )}
        </div>
      )}

      {/* ── Headers Tab ── */}
      {tab === 'headers' && (
        <div className="card-body">
          {Object.keys(response.headers || {}).length > 0 ? (
            <div style={{ display: 'grid', gap: '8px' }}>
              <div className="kv-row" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '4px' }}>
                <span className="label">Key</span>
                <span className="label">Value</span>
              </div>
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="kv-row" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{key}</div>
                  <div style={{ wordBreak: 'break-all' }}>{value}</div>
                </div>
              ))}
            </div>
          ) : (
             <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No headers received</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}