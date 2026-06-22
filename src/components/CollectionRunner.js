import React, { useState } from 'react';
import { getCollections } from '../services/storageService';
import { sendRequest } from '../services/apiService';

export default function CollectionRunner() {
  const [collections] = useState(getCollections());
  const [selectedColId, setSelectedColId] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  
  const handleRun = async () => {
    const col = collections.find(c => c.id === selectedColId);
    if (!col || col.requests.length === 0) return;
    
    setRunning(true);
    setResults(null);
    
    const runResults = {
      collectionName: col.name,
      total: col.requests.length,
      passed: 0,
      failed: 0,
      timeMs: 0,
      requests: []
    };
    
    const startTime = Date.now();
    
    for (const req of col.requests) {
      const resultItem = { name: req.name || req.url, method: req.method, status: 0, time: 0, success: false };
      try {
        const startReq = Date.now();
        const res = await sendRequest(req);
        resultItem.time = Date.now() - startReq;
        resultItem.status = res.status;
        resultItem.success = res.status >= 200 && res.status < 400;
        
        if (resultItem.success) runResults.passed++;
        else runResults.failed++;
        
      } catch (err) {
        resultItem.error = err.message;
        runResults.failed++;
      }
      runResults.requests.push(resultItem);
    }
    
    runResults.timeMs = Date.now() - startTime;
    setResults(runResults);
    setRunning(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Collection Runner</span>
      </div>
      
      <div className="card-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <select 
            className="select" 
            style={{ flex: 1 }} 
            value={selectedColId} 
            onChange={e => setSelectedColId(e.target.value)}
            disabled={running}
          >
            <option value="">— Select a Collection to Run —</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.requests.length} requests)</option>
            ))}
          </select>
          <button 
            className={`btn-send ${running ? 'loading' : ''}`} 
            style={{ borderRadius: 'var(--radius-sm)' }}
            onClick={handleRun}
            disabled={!selectedColId || running}
          >
            {running ? 'Running...' : 'Run Collection'}
          </button>
        </div>
        
        {/* ── Results Summary ── */}
        {results && (
          <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: 12 }}>Run Results: {results.collectionName}</h3>
            <div style={{ display: 'flex', gap: 32 }}>
              <div className="runner-stat">
                <div className="runner-stat-value">{results.total}</div>
                <div className="runner-stat-label">Total</div>
              </div>
              <div className="runner-stat">
                <div className="runner-stat-value" style={{ color: 'var(--green)' }}>{results.passed}</div>
                <div className="runner-stat-label">Passed</div>
              </div>
              <div className="runner-stat">
                <div className="runner-stat-value" style={{ color: 'var(--red)' }}>{results.failed}</div>
                <div className="runner-stat-label">Failed</div>
              </div>
              <div className="runner-stat">
                <div className="runner-stat-value">{results.timeMs}ms</div>
                <div className="runner-stat-label">Duration</div>
              </div>
            </div>
          </div>
        )}
        
        {/* ── Results List ── */}
        {results && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
            {results.requests.map((r, i) => (
              <div key={i} className="runner-result-row">
                <div className={`dot ${r.success ? 'green' : 'red'}`} />
                <span className={`method-badge ${r.method}`}>{r.method}</span>
                <span style={{ flex: 1 }} className="truncate">{r.name}</span>
                <span className={`status-badge ${r.success ? 'success' : 'error'}`}>{r.status || 'ERR'}</span>
                <span style={{ width: 60, textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>{r.time}ms</span>
              </div>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}
