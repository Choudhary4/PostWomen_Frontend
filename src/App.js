import React, { useState, useEffect } from 'react';
import Header        from './components/Header';
import Sidebar       from './components/Sidebar';
import RequestBuilder from './components/RequestBuilder';
import ResponseViewer from './components/ResponseViewer';
import MockServer     from './components/MockServer';
import WebSocketTester from './components/WebSocketTester';
import CollectionRunner from './components/CollectionRunner';
import LoginPage      from './components/auth/LoginPage';
import RegisterPage   from './components/auth/RegisterPage';
import ProfilePage    from './components/auth/ProfilePage';
import { sendRequest }  from './services/apiService';
import { addToHistory, resolveVariables } from './services/storageService';
import { isAuthenticated } from './services/authService';
import './index.css';

// The view that's currently active in the main panel
const VIEWS = ['builder', 'mock', 'websocket', 'runner', 'login', 'register', 'profile'];

export default function App() {
  const [view,          setView]    = useState('builder');
  const [request,       setRequest] = useState(initialRequest());
  const [response,      setResponse]= useState(null);
  const [loading,       setLoading] = useState(false);
  const [authed,        setAuthed]  = useState(isAuthenticated());

  // Called when user clicks Send
  const handleSend = async () => {
    if (!request.url.trim()) return;
    setLoading(true);
    setResponse(null);

    // Resolve {{variable}} placeholders using the active environment
    const resolved = {
      ...request,
      url:     resolveVariables(request.url),
      headers: resolveObjectValues(request.headers),
      body:    resolveVariables(request.body),
    };

    try {
      const result = await sendRequest(resolved);
      setResponse(result);
      addToHistory(request, result); // Save to history (original, not resolved)
    } catch (err) {
      setResponse({ error: true, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Load a saved request from the sidebar
  const handleLoadRequest = (req) => {
    setRequest({ ...initialRequest(), ...req });
    setResponse(null);
    setView('builder');
  };

  const handleAuthChange = () => {
    setAuthed(isAuthenticated());
    setView('builder');
  };

  return (
    <div className="app-shell">
      <Header
        view={view}
        onViewChange={setView}
        authed={authed}
        onLogout={() => { setAuthed(false); setView('builder'); }}
      />

      <div className="main-content">
        {/* Sidebar: always visible except on auth pages */}
        {!['login', 'register'].includes(view) && (
          <Sidebar onLoadRequest={handleLoadRequest} />
        )}

        {/* Main Panel */}
        <div className="page-content">
          {view === 'builder' && (
            <>
              <RequestBuilder
                request={request}
                onChange={setRequest}
                onSend={handleSend}
                loading={loading}
              />
              {(response || loading) && (
                <ResponseViewer response={response} loading={loading} />
              )}
            </>
          )}
          {view === 'mock'      && <MockServer />}
          {view === 'websocket' && <WebSocketTester />}
          {view === 'runner'    && <CollectionRunner />}
          {view === 'login'     && <LoginPage    onSuccess={handleAuthChange} onSwitch={() => setView('register')} />}
          {view === 'register'  && <RegisterPage onSuccess={handleAuthChange} onSwitch={() => setView('login')} />}
          {view === 'profile'   && <ProfilePage  onLogout={() => { setAuthed(false); setView('builder'); }} />}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────
function initialRequest() {
  return { url: '', method: 'GET', headers: {}, body: '', auth: null };
}

function resolveObjectValues(obj) {
  if (!obj) return {};
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [resolveVariables(k), resolveVariables(v)])
  );
}