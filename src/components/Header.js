import React, { useState } from 'react';
import { Send, Globe, Settings, Upload, Play, Code, Server, Wifi, Palette, Users, BarChart, FolderOpen, Book, User, LogOut, UserCog, Shield, ChevronDown, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ onOpenEnvironments, onOpenImportExport, currentView, onViewChange, isSidebarOpen, onToggleSidebar }) => {
  const { user, isAuthenticated, logout, isAdmin, isModerator } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileClick = () => {
    onViewChange('profile');
    setUserDropdownOpen(false);
  };

  const handleAdminClick = () => {
    onViewChange('admin');
    setUserDropdownOpen(false);
  };

  const handleLoginClick = () => {
    onViewChange('login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 lg:space-x-6">
          {/* Mobile Hamburger Menu */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-primary rounded-lg flex items-center justify-center">
              <Send className="w-3 h-3 lg:w-5 lg:h-5 text-white" />
            </div>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900 hidden sm:block">PostWomen</h1>
            <h1 className="text-lg font-bold text-gray-900 sm:hidden">Women</h1>
          </div>
          
          {/* View Switcher - Hidden on mobile */}
          <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewChange('builder')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'builder'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Builder</span>
            </button>
            <button
              onClick={() => onViewChange('runner')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'runner'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>Runner</span>
            </button>
            <button
              onClick={() => onViewChange('mock')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'mock'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Mock</span>
            </button>
            <button
              onClick={() => onViewChange('websocket')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'websocket'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>WebSocket</span>
            </button>
            <button
              onClick={() => onViewChange('themes')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'themes'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Themes</span>
            </button>
            <button
              onClick={() => onViewChange('team')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'team'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team</span>
            </button>
            <button
              onClick={() => onViewChange('response')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'response'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart className="w-4 h-4" />
              <span>Response</span>
            </button>
            <button
              onClick={() => onViewChange('workspace')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'workspace'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => onViewChange('docs')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'docs'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Book className="w-4 h-4" />
              <span>Docs</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Environment Button - Hidden on small screens */}
          <button
            onClick={onOpenEnvironments}
            className="hidden sm:flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Manage Environments"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium hidden lg:inline">Environments</span>
          </button>

          {/* Import/Export Button - Hidden on small screens */}
          <button
            onClick={onOpenImportExport}
            className="hidden sm:flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Import/Export"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium hidden lg:inline">Import/Export</span>
          </button>
          
          {/* Authentication Section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">{user?.name || user?.username}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {userDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-gray-900">{user?.name || user?.username}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                      <div className="text-xs text-primary font-medium mt-1 capitalize">{user?.role}</div>
                    </div>
                    
                    <button
                      onClick={handleProfileClick}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <UserCog className="w-4 h-4" />
                      <span>Profile & Settings</span>
                    </button>
                    
                    {(isAdmin || isModerator) && (
                      <button
                        onClick={handleAdminClick}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Admin Panel</span>
                      </button>
                    )}
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={handleLoginClick}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium">Sign In</span>
            </button>
          )}
          
         
        </div>
      </div>
    </header>
  );
};

export default Header;