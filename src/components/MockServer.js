import React, { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

export default function MockServer() {
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [form, setForm] = useState(initialForm());

  useEffect(() => {
    fetchMocks();
  }, []);

  const fetchMocks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mocks`);
      const data = await res.json();
      setMocks(data);
    } catch (err) {
      console.error('Failed to load mocks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let bodyObj = {};
      try {
        bodyObj = JSON.parse(form.responseBody);
      } catch {
        alert('Response body must be valid JSON');
        return;
      }

      const payload = {
        name: form.name,
        method: form.method,
        path: form.path,
        status: parseInt(form.status),
        responseBody: bodyObj,
        delay: parseInt(form.delay) || 0
      };

      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `${API_BASE}/mocks/${form.id}` : `${API_BASE}/mocks`;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setShowForm(false);
      setForm(initialForm());
      fetchMocks();
    } catch (err) {
      console.error('Save mock failed', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mock endpoint?')) return;
    try {
      await fetch(`${API_BASE}/mocks/${id}`, { method: 'DELETE' });
      fetchMocks();
    } catch (err) {
      console.error('Delete mock failed', err);
    }
  };

  const handleEdit = (mock) => {
    setForm({
      id: mock.id,
      name: mock.name,
      method: mock.method,
      path: mock.path,
      status: mock.status,
      delay: mock.delay,
      responseBody: JSON.stringify(mock.responseBody, null, 2)
    });
    setShowForm(true);
  };

  return (
    <div className="card">
      <div className="card-header justify-between">
        <div>
          <span className="card-title">Mock Server</span>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Create dynamic endpoints that return custom JSON responses. Base URL: <strong>{API_BASE.replace('/api', '/mock')}</strong>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(initialForm()); setShowForm(true); }}>
          + New Mock
        </button>
      </div>

      <div className="card-body">
        {loading && <p>Loading mocks...</p>}

        {!loading && mocks.length === 0 && !showForm && (
          <div className="empty-state">
            <div className="empty-state-icon">🎭</div>
            <p>No mock endpoints created yet.</p>
          </div>
        )}

        {/* ── Mocks List ── */}
        {!showForm && mocks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mocks.map(mock => (
              <div key={mock.id} className="card" style={{ padding: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className={`method-badge ${mock.method}`}>{mock.method}</span>
                      <code className="mono" style={{ fontSize: 14 }}>{mock.path}</code>
                      <span className={`status-badge ${mock.status < 400 ? 'success' : 'error'}`}>{mock.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      <strong>{mock.name}</strong> • {mock.hitCount} hits • {mock.delay}ms delay
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost text-sm" onClick={() => handleEdit(mock)}>Edit</button>
                    <button className="btn btn-danger text-sm" onClick={() => handleDelete(mock.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Create/Edit Form ── */}
        {showForm && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div className="form-group">
                <label className="label">Name</label>
                <input required className="input" placeholder="e.g. Get User Profile" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Path (starts with /)</label>
                <input required className="input mono" placeholder="/api/users/1" value={form.path} onChange={e => setForm({...form, path: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Method</label>
                <select className="select w-full" value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Status Code</label>
                <input type="number" required className="input" placeholder="200" value={form.status} onChange={e => setForm({...form, status: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Delay (ms)</label>
                <input type="number" className="input" placeholder="0" value={form.delay} onChange={e => setForm({...form, delay: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Response Body (JSON)</label>
              <textarea 
                required 
                className="textarea mono" 
                style={{ height: 200 }} 
                value={form.responseBody} 
                onChange={e => setForm({...form, responseBody: e.target.value})} 
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{form.id ? 'Save Changes' : 'Create Mock'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function initialForm() {
  return {
    id: null,
    name: '',
    method: 'GET',
    path: '/api/example',
    status: '200',
    delay: '0',
    responseBody: '{\n  "message": "Hello World"\n}'
  };
}