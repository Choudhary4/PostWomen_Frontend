import React, { useState, useEffect } from 'react';
import RequestBuilder from './components/RequestBuilder';
import ResponseViewer from './components/ResponseViewer';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import EnvironmentManager from './components/EnvironmentManager';
import ImportExportModal from './components/ImportExportModal';
import RequestRunner from './components/RequestRunner';
import MockServer from './components/MockServer';
import WebSocketTesting from './components/WebSocketTesting';
import ThemeManager from './components/ThemeManager';
import TeamCollaboration from './components/TeamCollaboration';
import AdvancedResponse from './components/AdvancedResponse';
import WorkspaceManagement from './components/WorkspaceManagement';
import Documentation from './components/Documentation';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import UserProfile from './components/auth/UserProfile';
import AdminPanel from './components/admin/AdminPanel';
import LoadingSpinner from './components/auth/LoadingSpinner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { apiService } from './services/apiService';
import { storageService } from './services/storageService';
import { environmentService } from './services/environmentService';
import { collectionRunnerService } from './services/collectionRunnerService';

function AppContent() {
  const { isLoading } = useAuth();
  const [currentRequest, setCurrentRequest] = useState({
    url: '',
    method: 'GET',
    headers: {},
    body: '',
    auth: null,
    preRequestScript: '',
    postRequestScript: '',
    lastTestResults: null,
    lastPreRequestLogs: [],
    graphqlSchema: null
  });
  
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [showEnvironmentManager, setShowEnvironmentManager] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [currentView, setCurrentView] = useState('builder'); // 'builder', 'runner', 'mock', 'websocket', 'themes', 'team', 'response', 'workspace', 'docs', 'login', 'register', 'profile', 'admin'
  const [activeRun, setActiveRun] = useState(null);
  const [runResults, setRunResults] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state

  useEffect(() => {
    // Load collections from localStorage on app start
    const savedCollections = storageService.getCollections();
    setCollections(savedCollections);
    
    // Load and apply active theme
    loadActiveTheme();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const loadActiveTheme = async () => {
    try {
      const currentUserId = 'default';
      console.log('Loading active theme for user:', currentUserId);
      
      const response = await fetch(`/api/themes/users/${currentUserId}/active`);
      if (response.ok) {
        const activeTheme = await response.json();
        console.log('Active theme loaded:', activeTheme);
        
        if (activeTheme && activeTheme.id) {
          await applyTheme(activeTheme.id);
        } else {
          console.log('No active theme found, applying default light theme');
          await applyTheme('light');
        }
      } else {
        console.log('Failed to load active theme, applying default light theme');
        // Apply default light theme if API call fails
        await applyTheme('light');
      }
    } catch (error) {
      console.error('Error loading active theme:', error);
      // Apply default light theme as fallback
      await applyTheme('light');
    }
  };

  const applyTheme = async (themeId) => {
    try {
      console.log('Applying theme:', themeId);
      
      const response = await fetch(`/api/themes/${themeId}/css`);
      if (response.ok) {
        const css = await response.text();
        console.log('Theme CSS loaded:', css.substring(0, 200) + '...');
        
        // Remove existing theme style
        const existingStyle = document.getElementById('dynamic-theme');
        if (existingStyle) {
          existingStyle.remove();
        }

        // Add new theme style
        const style = document.createElement('style');
        style.id = 'dynamic-theme';
        style.textContent = css;
        document.head.appendChild(style);
        
        // Force a re-render by adding/removing a class to body
        document.body.classList.add('theme-updating');
        setTimeout(() => {
          document.body.classList.remove('theme-updating');
        }, 100);
        
        console.log('Theme applied successfully');
      } else {
        console.error('Failed to load theme CSS');
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!currentRequest.url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Resolve environment variables before sending
      const dynamicVars = environmentService.getDynamicVariables();
      const resolvedRequest = {
        ...currentRequest,
        url: environmentService.resolveVariables(currentRequest.url, dynamicVars),
        headers: Object.entries(currentRequest.headers).reduce((acc, [key, value]) => {
          const resolvedKey = environmentService.resolveVariables(key, dynamicVars);
          const resolvedValue = environmentService.resolveVariables(value, dynamicVars);
          acc[resolvedKey] = resolvedValue;
          return acc;
        }, {}),
        body: environmentService.resolveVariables(currentRequest.body || '', dynamicVars)
      };

      // Resolve auth variables
      if (resolvedRequest.auth) {
        Object.keys(resolvedRequest.auth).forEach(key => {
          if (typeof resolvedRequest.auth[key] === 'string') {
            resolvedRequest.auth[key] = environmentService.resolveVariables(resolvedRequest.auth[key], dynamicVars);
          }
        });
      }

      const result = await apiService.sendRequest(resolvedRequest);
      setResponse(result);
      
      // Update current request with test results for display
      if (result.testResults || result.preRequestLogs) {
        setCurrentRequest(prev => ({
          ...prev,
          lastTestResults: result.testResults,
          lastPreRequestLogs: result.preRequestLogs
        }));
      }
      
      // Save request to history with original (unresolved) request
      storageService.saveToHistory(currentRequest, result);
    } catch (error) {
      setResponse({
        error: true,
        message: error.message,
        status: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRequest = (name, collectionId) => {
    const request = { ...currentRequest, name, id: Date.now().toString() };
    storageService.saveRequest(request, collectionId);
    
    // Refresh collections
    const updatedCollections = storageService.getCollections();
    setCollections(updatedCollections);
  };

  const handleLoadRequest = (request) => {
    setCurrentRequest(request);
    setResponse(null);
  };

  const handleCreateCollection = (name) => {
    const collection = {
      id: Date.now().toString(),
      name,
      requests: [],
      createdAt: new Date().toISOString()
    };
    
    storageService.createCollection(collection);
    const updatedCollections = storageService.getCollections();
    setCollections(updatedCollections);
  };

  const handleImportComplete = () => {
    // Refresh collections after import
    const updatedCollections = storageService.getCollections();
    setCollections(updatedCollections);
  };

  // Collection Runner Handlers
  const handleRunCollection = async (runConfig) => {
    try {
      setActiveRun(collectionRunnerService.getActiveRun());
      
      // Set up callback for run updates
      const runCallback = (type, data) => {
        if (type === 'run_started') {
          setActiveRun(data);
        } else if (type === 'run_completed') {
          setRunResults(data);
          setActiveRun(null);
        } else if (type === 'run_stopped') {
          setRunResults(data);
          setActiveRun(null);
        } else if (type === 'run_error') {
          console.error('Run error:', data);
          setActiveRun(null);
        } else if (type === 'request_completed') {
          // Update progress
          setActiveRun(prev => prev ? { ...prev, ...collectionRunnerService.getActiveRun() } : null);
        }
      };

      collectionRunnerService.addRunCallback(runCallback);
      
      const results = await collectionRunnerService.runCollection(runConfig);
      setRunResults(results);
      
      // Clean up callback
      collectionRunnerService.removeRunCallback(runCallback);
    } catch (error) {
      console.error('Error running collection:', error);
      alert('Error running collection: ' + error.message);
    }
  };

  const handleStopRun = () => {
    collectionRunnerService.stopRun();
    setActiveRun(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header 
        onOpenEnvironments={() => setShowEnvironmentManager(true)}
        onOpenImportExport={() => setShowImportExport(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static fixed inset-y-0 left-0 z-30 
          transition-transform duration-300 ease-in-out
        `}>
          <Sidebar 
            collections={collections}
            activeCollection={activeCollection}
            onCreateCollection={handleCreateCollection}
            onSelectRequest={handleLoadRequest}
            onAddRequest={() => {
              const updatedCollections = storageService.getCollections();
              setCollections(updatedCollections);
            }}
            onCloseMobile={() => setIsSidebarOpen(false)}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
            <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6">
              {currentView === 'builder' ? (
                <>
                  <RequestBuilder
                    request={currentRequest}
                    onRequestChange={setCurrentRequest}
                    onSendRequest={handleSendRequest}
                    onSaveRequest={handleSaveRequest}
                    collections={collections}
                    loading={loading}
                  />
                  
                  {(response || loading) && (
                    <ResponseViewer
                      response={response}
                      loading={loading}
                    />
                  )}
                </>
              ) : currentView === 'runner' ? (
                <RequestRunner
                  collections={collections}
                  onRunCollection={handleRunCollection}
                  onStopRun={handleStopRun}
                  activeRun={activeRun}
                  runResults={runResults}
                />
              ) : currentView === 'mock' ? (
                <MockServer />
              ) : currentView === 'websocket' ? (
                <WebSocketTesting />
              ) : currentView === 'themes' ? (
                <ThemeManager />
              ) : currentView === 'team' ? (
                <TeamCollaboration />
              ) : currentView === 'response' ? (
                <AdvancedResponse />
              ) : currentView === 'workspace' ? (
                <WorkspaceManagement />
              ) : currentView === 'docs' ? (
                <Documentation />
              ) : currentView === 'login' ? (
                <LoginForm onSwitchToRegister={() => setCurrentView('register')} />
              ) : currentView === 'register' ? (
                <RegisterForm onSwitchToLogin={() => setCurrentView('login')} />
              ) : currentView === 'profile' ? (
                <UserProfile />
              ) : currentView === 'admin' ? (
                <AdminPanel />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Environment Manager Modal */}
      <EnvironmentManager
        isOpen={showEnvironmentManager}
        onClose={() => setShowEnvironmentManager(false)}
      />

      {/* Import/Export Modal */}
      <ImportExportModal
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        collections={collections}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;