import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

const ThemeManager = () => {
  const [themes, setThemes] = useState([]);
  const [activeTheme, setActiveTheme] = useState(null);
  const [userPreferences, setUserPreferences] = useState({});
  const [activeTab, setActiveTab] = useState('themes');
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [themeForm, setThemeForm] = useState({
    name: '',
    type: 'light',
    description: '',
    colors: {
      primary: '#007bff',
      background: '#ffffff',
      textPrimary: '#212529',
      border: '#dee2e6'
    }
  });
  const [currentUserId] = useState('default');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [themesRes, activeThemeRes, prefsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/themes`),
        fetch(`${API_BASE_URL}/themes/users/${currentUserId}/active`),
        fetch(`${API_BASE_URL}/themes/users/${currentUserId}/preferences`)
      ]);

      if (themesRes.ok) setThemes(await themesRes.json());
      if (activeThemeRes.ok) setActiveTheme(await activeThemeRes.json());
      if (prefsRes.ok) setUserPreferences(await prefsRes.json());
    } catch (error) {
      console.error('Error loading theme data:', error);
    }
  };

  const handleSetActiveTheme = async (themeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/themes/users/${currentUserId}/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeId })
      });

      if (response.ok) {
        await loadData();
        // Apply theme immediately
        await applyTheme(themeId);
      }
    } catch (error) {
      console.error('Error setting active theme:', error);
    }
  };

  const applyTheme = async (themeId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/themes/${themeId}/css`);
      if (response.ok) {
        const css = await response.text();
        
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
      }
    } catch (error) {
      console.error('Error applying theme:', error);
    }
  };

  const handleCreateTheme = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/themes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeForm)
      });

      if (response.ok) {
        await loadData();
        setShowThemeForm(false);
        setThemeForm({
          name: '',
          type: 'light',
          description: '',
          colors: {
            primary: '#007bff',
            background: '#ffffff',
            textPrimary: '#212529',
            border: '#dee2e6'
          }
        });
      } else {
        const error = await response.json();
        alert('Error creating theme: ' + (error.details ? error.details.join(', ') : error.error));
      }
    } catch (error) {
      console.error('Error creating theme:', error);
      alert('Error creating theme');
    }
  };

  const handleCloneTheme = async (themeId, newName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/themes/${themeId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error cloning theme:', error);
    }
  };

  const handleDeleteTheme = async (themeId) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/themes/${themeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
      } else {
        const error = await response.json();
        alert('Error deleting theme: ' + error.error);
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  };

  const handleUpdatePreferences = async (updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/themes/users/${currentUserId}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const renderThemes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Available Themes</h3>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setShowThemeForm(true)}
        >
          + Create Custom Theme
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map(theme => (
          <div key={theme.id} className="bg-white border rounded-lg overflow-hidden shadow">
            <div 
              className="h-32 flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: theme.colors?.primary || '#007bff' }}
            >
              <div className="text-center">
                <div className="text-lg">{theme.name}</div>
                <div className="text-sm opacity-75">{theme.type} theme</div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    theme.type === 'light' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-800 text-white'
                  }`}>
                    {theme.type}
                  </span>
                  {theme.isDefault && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Default
                    </span>
                  )}
                  {activeTheme?.id === theme.id && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Active
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{theme.description}</p>
              
              <div className="flex gap-2 mb-4">
                <div 
                  className="w-6 h-6 rounded border-2 border-white shadow"
                  style={{ backgroundColor: theme.colors?.primary || '#007bff' }}
                  title="Primary"
                />
                <div 
                  className="w-6 h-6 rounded border-2 border-white shadow"
                  style={{ backgroundColor: theme.colors?.background || '#ffffff' }}
                  title="Background"
                />
                <div 
                  className="w-6 h-6 rounded border-2 border-white shadow"
                  style={{ backgroundColor: theme.colors?.textPrimary || '#000000' }}
                  title="Text"
                />
                <div 
                  className="w-6 h-6 rounded border-2 border-white shadow"
                  style={{ backgroundColor: theme.colors?.border || '#dee2e6' }}
                  title="Border"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleSetActiveTheme(theme.id)}
                  disabled={activeTheme?.id === theme.id}
                  className={`flex-1 py-2 text-sm rounded ${
                    activeTheme?.id === theme.id
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {activeTheme?.id === theme.id ? 'Active' : 'Apply'}
                </button>
                
                <button
                  onClick={() => {
                    const name = prompt('Enter name for cloned theme:', `${theme.name} Copy`);
                    if (name) handleCloneTheme(theme.id, name);
                  }}
                  className="px-3 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  title="Clone theme"
                >
                  📋
                </button>
                
                {!theme.isDefault && (
                  <button
                    onClick={() => handleDeleteTheme(theme.id)}
                    className="px-3 py-2 text-red-600 border border-red-300 rounded hover:bg-red-50"
                    title="Delete theme"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-6">Theme Preferences</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Active Theme
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: activeTheme?.colors?.primary || '#007bff' }}
                />
                <div>
                  <div className="font-medium">{activeTheme?.name || 'No theme selected'}</div>
                  <div className="text-sm text-gray-600">{activeTheme?.description}</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={userPreferences.autoTheme || false}
                onChange={(e) => handleUpdatePreferences({ autoTheme: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-700">
                Auto theme switching based on system preference
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Automatically switch between light and dark themes based on your system settings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme Schedule
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Light theme time</label>
                <input
                  type="time"
                  value={userPreferences.themeSchedule?.light || '08:00'}
                  onChange={(e) => handleUpdatePreferences({
                    themeSchedule: {
                      ...userPreferences.themeSchedule,
                      light: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Dark theme time</label>
                <input
                  type="time"
                  value={userPreferences.themeSchedule?.dark || '20:00'}
                  onChange={(e) => handleUpdatePreferences({
                    themeSchedule: {
                      ...userPreferences.themeSchedule,
                      dark: e.target.value
                    }
                  })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Automatically switch themes at specific times of day
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Settings
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={userPreferences.customSettings?.reducedAnimations || false}
                  onChange={(e) => handleUpdatePreferences({
                    customSettings: {
                      ...userPreferences.customSettings,
                      reducedAnimations: e.target.checked
                    }
                  })}
                />
                <span className="text-sm text-gray-700">Reduce animations</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={userPreferences.customSettings?.highContrast || false}
                  onChange={(e) => handleUpdatePreferences({
                    customSettings: {
                      ...userPreferences.customSettings,
                      highContrast: e.target.checked
                    }
                  })}
                />
                <span className="text-sm text-gray-700">High contrast mode</span>
              </label>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">Font size</label>
                <select
                  value={userPreferences.customSettings?.fontSize || 'medium'}
                  onChange={(e) => handleUpdatePreferences({
                    customSettings: {
                      ...userPreferences.customSettings,
                      fontSize: e.target.value
                    }
                  })}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderThemeEditor = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold mb-6">Theme Editor</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme Name</label>
              <input
                type="text"
                value={themeForm.name}
                onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                placeholder="My Custom Theme"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme Type</label>
              <select
                value={themeForm.type}
                onChange={(e) => setThemeForm({ ...themeForm, type: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={themeForm.description}
                onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })}
                placeholder="A beautiful custom theme..."
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-800">Colors</h4>
              
              {Object.entries(themeForm.colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-24 text-sm text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </label>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setThemeForm({
                      ...themeForm,
                      colors: { ...themeForm.colors, [key]: e.target.value }
                    })}
                    className="w-12 h-8 border border-gray-300 rounded"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setThemeForm({
                      ...themeForm,
                      colors: { ...themeForm.colors, [key]: e.target.value }
                    })}
                    className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Preview</h4>
            <div 
              className="border rounded-lg p-4 space-y-3"
              style={{ 
                backgroundColor: themeForm.colors.background,
                color: themeForm.colors.textPrimary,
                borderColor: themeForm.colors.border
              }}
            >
              <div className="text-lg font-semibold">Sample Interface</div>
              <button
                style={{ backgroundColor: themeForm.colors.primary }}
                className="px-4 py-2 text-white rounded text-sm"
              >
                Primary Button
              </button>
              <div 
                className="p-3 rounded border"
                style={{ borderColor: themeForm.colors.border }}
              >
                <div className="font-medium mb-2">Card Component</div>
                <p className="text-sm opacity-75">
                  This is how your theme will look in the interface.
                </p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreateTheme}
                disabled={!themeForm.name}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Create Theme
              </button>
              <button
                onClick={() => setShowThemeForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🎨 Theme Manager</h1>
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
            { id: 'themes', label: `Themes (${themes.length})` },
            { id: 'preferences', label: 'Preferences' },
            { id: 'editor', label: 'Theme Editor' }
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
        {activeTab === 'themes' && renderThemes()}
        {activeTab === 'preferences' && renderPreferences()}
        {activeTab === 'editor' && renderThemeEditor()}
      </div>
    </div>
  );
};

export default ThemeManager;