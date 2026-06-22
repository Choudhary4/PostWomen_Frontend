import React, { useState } from 'react';
import {
  getCollections, createCollection, deleteCollection,
  saveRequestToCollection, deleteRequestFromCollection
} from '../services/storageService';

const METHOD_COLORS = {
  GET: 'var(--method-get)', POST: 'var(--method-post)', PUT: 'var(--method-put)',
  DELETE: 'var(--method-delete)', PATCH: 'var(--method-patch)',
  HEAD: 'var(--method-head)', OPTIONS: 'var(--method-options)',
};

export default function Sidebar({ onLoadRequest }) {
  const [collections, setCollections] = useState(getCollections);
  const [expanded, setExpanded]       = useState({});
  const [showNew, setShowNew]         = useState(false);
  const [newName, setNewName]         = useState('');

  const refresh = () => setCollections(getCollections());

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createCollection(newName.trim());
    setNewName('');
    setShowNew(false);
    refresh();
  };

  const handleDeleteCollection = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this collection and all its requests?')) {
      deleteCollection(id);
      refresh();
    }
  };

  const handleDeleteRequest = (e, colId, reqId) => {
    e.stopPropagation();
    deleteRequestFromCollection(colId, reqId);
    refresh();
  };

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Collections
        </span>
        <button
          id="btn-new-collection"
          className="btn-icon"
          onClick={() => setShowNew((v) => !v)}
          title="New Collection"
          style={{ marginLeft: 'auto' }}
        >
          +
        </button>
      </div>

      {/* New Collection Form */}
      {showNew && (
        <form onSubmit={handleCreate} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <input
            id="new-collection-name"
            className="input"
            style={{ fontSize: 12, marginBottom: 6 }}
            placeholder="Collection name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: 11, padding: '5px 10px', flex: 1 }}>
              Create
            </button>
            <button type="button" className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setShowNew(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Collection List */}
      <div className="sidebar-body">
        {collections.length === 0 && (
          <div className="empty-state" style={{ padding: '40px 16px' }}>
            <div className="empty-state-icon">📁</div>
            <p>No collections yet.<br />Save a request to get started.</p>
          </div>
        )}

        {collections.map((col) => (
          <div key={col.id} className="collection-group">
            {/* Collection Header */}
            <div className="collection-header" onClick={() => toggleExpand(col.id)}>
              <span style={{ fontSize: 10, transition: 'transform 0.15s' }}>
                {expanded[col.id] ? '▼' : '▶'}
              </span>
              <span className="collection-name">{col.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{col.requests.length}</span>
              <button
                className="btn-icon"
                style={{ width: 20, height: 20, fontSize: 10, color: 'var(--text-muted)' }}
                onClick={(e) => handleDeleteCollection(e, col.id)}
                title="Delete collection"
              >
                ✕
              </button>
            </div>

            {/* Requests inside this collection */}
            {expanded[col.id] && (
              <div>
                {col.requests.length === 0 && (
                  <div style={{ padding: '6px 24px', fontSize: 11, color: 'var(--text-muted)' }}>
                    No requests saved
                  </div>
                )}
                {col.requests.map((req) => (
                  <div
                    key={req.id}
                    className="request-item"
                    onClick={() => onLoadRequest(req)}
                    title={req.url}
                  >
                    <span
                      className="method-badge"
                      style={{ color: METHOD_COLORS[req.method] || 'var(--text-secondary)', background: 'transparent', padding: 0, fontSize: 10 }}
                    >
                      {req.method}
                    </span>
                    <span className="request-item-name">{req.name || req.url}</span>
                    <button
                      className="btn-icon"
                      style={{ width: 18, height: 18, fontSize: 10, opacity: 0, color: 'var(--text-muted)' }}
                      onClick={(e) => handleDeleteRequest(e, col.id, req.id)}
                      title="Delete request"
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}