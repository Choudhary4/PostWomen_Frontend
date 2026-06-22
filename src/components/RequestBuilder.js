import React, { useState } from 'react';
import { getCollections, saveRequestToCollection } from '../services/storageService';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLORS = {
  GET: 'var(--method-get)', POST: 'var(--method-post)', PUT: 'var(--method-put)',
  DELETE: 'var(--method-delete)', PATCH: 'var(--method-patch)',
  HEAD: 'var(--method-head)', OPTIONS: 'var(--method-options)',
};

export default function RequestBuilder({ request, onChange, onSend, loading }) {
  const [tab, setTab] = useState('params'); // params | headers | body | auth
  const [showSaveModal, setShowSaveModal] = useState(false);

  const set = (key, val) => onChange((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="card">
      {/* ── URL Bar ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className="url-bar">
          {/* Method Selector */}
          <select
            id="method-select"
            className="method-select select"
            value={request.method}
            onChange={(e) => set('method', e.target.value)}
            style={{ color: METHOD_COLORS[request.method] || 'var(--text-primary)' }}
          >
            {METHODS.map((m) => (
              <option key={m} value={m} style={{ color: METHOD_COLORS[m] || 'inherit' }}>
                {m}
              </option>
            ))}
          </select>

          {/* URL Input */}
          <input
            id="url-input"
            type="text"
            className="url-input"
            placeholder="https://api.example.com/endpoint"
            value={request.url}
            onChange={(e) => set('url', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
          />

          {/* Send Button */}
          <button
            id="btn-send"
            className={`btn-send ${loading ? 'loading' : ''}`}
            onClick={onSend}
            disabled={loading || !request.url.trim()}
          >
            {loading ? <span className="spinner" /> : 'Send'}
          </button>
        </div>
      </div>

      {/* ── Tabs Bar ── */}
      <div className="tab-bar">
        {['params', 'headers', 'body', 'auth'].map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'headers' && Object.keys(request.headers || {}).length > 0 && (
              <span style={{ marginLeft: 4, background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 10, padding: '0 5px', fontSize: 10 }}>
                {Object.keys(request.headers).length}
              </span>
            )}
          </button>
        ))}

        <button
          id="btn-save-request"
          className="tab"
          style={{ marginLeft: 'auto', color: 'var(--accent)' }}
          onClick={() => setShowSaveModal(true)}
        >
          + Save
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: '14px 16px' }}>
        {tab === 'params'  && <ParamsTab  request={request} set={set} />}
        {tab === 'headers' && <HeadersTab request={request} set={set} />}
        {tab === 'body'    && <BodyTab    request={request} set={set} />}
        {tab === 'auth'    && <AuthTab    request={request} set={set} />}
      </div>

      {/* ── Save Modal ── */}
      {showSaveModal && (
        <SaveModal
          request={request}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

// ─── Params Tab ────────────────────────────────────────────────────────────
// Shows URL query params parsed from the URL + lets user add/edit them
function ParamsTab({ request, set }) {
  // Parse current params from URL
  const getParams = () => {
    try {
      const url = new URL(request.url.includes('://') ? request.url : 'http://placeholder' + request.url);
      const params = [];
      url.searchParams.forEach((v, k) => params.push({ key: k, value: v }));
      return params;
    } catch { return []; }
  };

  const params = getParams();

  if (params.length === 0) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Add query parameters directly in the URL (e.g. <code className="mono">?key=value&amp;foo=bar</code>), or they'll appear here automatically.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <span className="label">Key</span>
        <span className="label">Value</span>
      </div>
      {params.map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
          <input className="input" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} value={p.key} readOnly />
          <input className="input" style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }} value={p.value} readOnly />
        </div>
      ))}
    </div>
  );
}

// ─── Headers Tab ───────────────────────────────────────────────────────────
function HeadersTab({ request, set }) {
  const headers = Object.entries(request.headers || {});

  const update = (index, field, val) => {
    const entries = [...headers];
    entries[index] = field === 'key'
      ? [val, entries[index][1]]
      : [entries[index][0], val];

    // Rebuild headers object, skip empty keys
    const obj = {};
    entries.forEach(([k, v]) => { if (k) obj[k] = v; });
    set('headers', obj);
  };

  const addRow = () => {
    const obj = { ...request.headers, '': '' };
    set('headers', obj);
  };

  const removeRow = (key) => {
    const obj = { ...request.headers };
    delete obj[key];
    set('headers', obj);
  };

  return (
    <div>
      <div className="kv-row" style={{ marginBottom: 8 }}>
        <span className="label">Key</span>
        <span className="label">Value</span>
        <span />
      </div>

      {headers.map(([key, value], i) => (
        <div key={i} className="kv-row">
          <input
            className="input"
            style={{ fontSize: 12 }}
            placeholder="Content-Type"
            value={key}
            onChange={(e) => update(i, 'key', e.target.value)}
          />
          <input
            className="input"
            style={{ fontSize: 12 }}
            placeholder="application/json"
            value={value}
            onChange={(e) => update(i, 'value', e.target.value)}
          />
          <button className="btn-icon" onClick={() => removeRow(key)} title="Remove">✕</button>
        </div>
      ))}

      <button id="btn-add-header" className="btn btn-ghost" style={{ fontSize: 12, marginTop: 4 }} onClick={addRow}>
        + Add Header
      </button>
    </div>
  );
}

// ─── Body Tab ──────────────────────────────────────────────────────────────
function BodyTab({ request, set }) {
  const noBody = ['GET', 'HEAD', 'OPTIONS'].includes(request.method);

  if (noBody) {
    return (
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {request.method} requests don't have a body.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="label" style={{ margin: 0 }}>Request Body (JSON)</span>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 11 }}
          onClick={() => {
            try {
              const formatted = JSON.stringify(JSON.parse(request.body || '{}'), null, 2);
              set('body', formatted);
            } catch { /* Not valid JSON — leave as is */ }
          }}
        >
          Format JSON
        </button>
      </div>
      <textarea
        id="body-input"
        className="textarea"
        placeholder={'{\n  "key": "value"\n}'}
        value={request.body || ''}
        onChange={(e) => set('body', e.target.value)}
        style={{ minHeight: 160 }}
      />
    </div>
  );
}

// ─── Auth Tab ──────────────────────────────────────────────────────────────
function AuthTab({ request, set }) {
  const auth = request.auth || { type: 'none' };
  const setAuth = (updates) => set('auth', { ...auth, ...updates });

  return (
    <div>
      <div className="form-group">
        <label className="label">Auth Type</label>
        <select
          id="auth-type-select"
          className="select"
          value={auth.type || 'none'}
          onChange={(e) => set('auth', { type: e.target.value })}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
        </select>
      </div>

      {auth.type === 'bearer' && (
        <div className="form-group">
          <label className="label">Token</label>
          <input
            id="auth-token"
            className="input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
            placeholder="eyJhbGci..."
            value={auth.token || ''}
            onChange={(e) => setAuth({ token: e.target.value })}
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="label">Username</label>
            <input className="input" placeholder="username" value={auth.username || ''} onChange={(e) => setAuth({ username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="••••••••" value={auth.password || ''} onChange={(e) => setAuth({ password: e.target.value })} />
          </div>
        </div>
      )}

      {auth.type === 'apikey' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="form-group">
            <label className="label">Header Name</label>
            <input className="input" placeholder="X-API-Key" value={auth.key || ''} onChange={(e) => setAuth({ key: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Value</label>
            <input className="input" placeholder="your-api-key" value={auth.value || ''} onChange={(e) => setAuth({ value: e.target.value })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Save Modal ────────────────────────────────────────────────────────────
function SaveModal({ request, onClose }) {
  const [name, setName]           = useState(request.name || '');
  const [collectionId, setCollId] = useState('');
  const [newColName, setNewColName] = useState('');
  const [collections, setCols]    = useState(getCollections);

  const handleSave = () => {
    if (!collectionId) return;
    saveRequestToCollection(collectionId, { ...request, name: name || request.url });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Save Request</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="label">Request Name</label>
            <input id="save-request-name" className="input" placeholder={request.url} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Collection</label>
            <select id="save-collection-select" className="select w-full" value={collectionId} onChange={(e) => setCollId(e.target.value)}>
              <option value="">— Select a collection —</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!collectionId} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}