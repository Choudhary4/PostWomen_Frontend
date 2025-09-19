import React, { useState, useEffect } from 'react';
import { FolderOpen, Users, Settings, Activity, LayoutTemplate, BarChart, Shield, Download, Upload, Search, Filter, Plus, Edit, Trash2, Copy, Share, Star, Eye, Clock, Database, TrendingUp, Archive, RefreshCw } from 'lucide-react';

const WorkspaceManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [backups, setBackups] = useState([]);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [workspaceForm, setWorkspaceForm] = useState({
    name: '',
    description: '',
    type: 'project',
    settings: {
      visibility: 'private',
      collaboration: true,
      autoBackup: true,
      notifications: true
    }
  });
  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'member',
    permissions: []
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'api',
    tags: []
  });

  useEffect(() => {
    loadWorkspaces();
    loadCurrentWorkspace();
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers();
      loadActivity();
      loadTemplates();
      loadBackups();
    }
  }, [currentWorkspace]);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspace/list');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const loadCurrentWorkspace = async () => {
    try {
      const response = await fetch('/api/workspace/current');
      if (response.ok) {
        const data = await response.json();
        setCurrentWorkspace(data);
      }
    } catch (error) {
      console.error('Error loading current workspace:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentWorkspace.id}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentWorkspace.id}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActivity(data);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentWorkspace.id}/templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/workspace/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentWorkspace.id}/backups`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const response = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceForm)
      });

      if (response.ok) {
        await loadWorkspaces();
        setShowWorkspaceModal(false);
        setWorkspaceForm({
          name: '',
          description: '',
          type: 'project',
          settings: {
            visibility: 'private',
            collaboration: true,
            autoBackup: true,
            notifications: true
          }
        });
      } else {
        const error = await response.json();
        alert('Error creating workspace: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert('Error creating workspace');
    }
  };

  const handleSwitchWorkspace = async (workspaceId) => {
    try {
      const response = await fetch('/api/workspace/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId })
      });

      if (response.ok) {
        await loadCurrentWorkspace();
      } else {
        const error = await response.json();
        alert('Error switching workspace: ' + error.error);
      }
    } catch (error) {
      console.error('Error switching workspace:', error);
      alert('Error switching workspace');
    }
  };

  const handleAddMember = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentWorkspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberForm)
      });

      if (response.ok) {
        await loadMembers();
        setShowMemberModal(false);
        setMemberForm({ email: '', role: 'member', permissions: [] });
      } else {
        const error = await response.json();
        alert('Error adding member: ' + error.error);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Error adding member');
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentWorkspace.id}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      if (response.ok) {
        await loadTemplates();
        setShowTemplateModal(false);
        setTemplateForm({ name: '', description: '', category: 'api', tags: [] });
      } else {
        const error = await response.json();
        alert('Error creating template: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await fetch(`/api/workspace/${currentWorkspace.id}/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ includeData: true })
      });

      if (response.ok) {
        await loadBackups();
      } else {
        const error = await response.json();
        alert('Error creating backup: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    }
  };

  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesSearch = workspace.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || workspace.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatDuration = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workspace Overview</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWorkspaceModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Workspace
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Current Workspace Info */}
      {currentWorkspace && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xl font-semibold text-gray-800">{currentWorkspace.name}</h4>
              <p className="text-gray-600">{currentWorkspace.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm rounded-full ${
                currentWorkspace.type === 'team' ? 'bg-blue-100 text-blue-800' :
                currentWorkspace.type === 'personal' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {currentWorkspace.type}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full ${
                currentWorkspace.settings.visibility === 'public' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {currentWorkspace.settings.visibility}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{currentWorkspace.memberCount || 0}</div>
              <div className="text-sm text-blue-600">Members</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{currentWorkspace.requestCount || 0}</div>
              <div className="text-sm text-green-600">Requests</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{currentWorkspace.collectionCount || 0}</div>
              <div className="text-sm text-purple-600">Collections</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{currentWorkspace.environmentCount || 0}</div>
              <div className="text-sm text-orange-600">Environments</div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard */}
      {analytics && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="text-lg font-semibold mb-4">Analytics Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">API Usage</span>
              </div>
              <div className="text-2xl font-bold">{analytics.totalRequests || 0}</div>
              <div className="text-sm text-gray-600">Total requests this month</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Performance</span>
              </div>
              <div className="text-2xl font-bold">{analytics.averageResponseTime || 0}ms</div>
              <div className="text-sm text-gray-600">Average response time</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-700">Collaboration</span>
              </div>
              <div className="text-2xl font-bold">{analytics.activeUsers || 0}</div>
              <div className="text-sm text-gray-600">Active users today</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderWorkspacesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Workspaces</h3>
        <button
          onClick={() => setShowWorkspaceModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Workspace
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="all">All Types</option>
            <option value="personal">Personal</option>
            <option value="team">Team</option>
            <option value="project">Project</option>
          </select>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkspaces.map(workspace => (
          <div key={workspace.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">{workspace.name}</h4>
              </div>
              {workspace.id === currentWorkspace?.id && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                  Current
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{workspace.description}</p>
            
            <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {workspace.memberCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                {workspace.requestCount || 0}
              </span>
              <span className={`px-2 py-1 text-xs rounded ${
                workspace.type === 'team' ? 'bg-blue-100 text-blue-800' :
                workspace.type === 'personal' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {workspace.type}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleSwitchWorkspace(workspace.id)}
                disabled={workspace.id === currentWorkspace?.id}
                className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {workspace.id === currentWorkspace?.id ? 'Active' : 'Switch'}
              </button>
              <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                <Share className="w-4 h-4" />
              </button>
              <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Workspace</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceForm.name}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="My Awesome Workspace"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={workspaceForm.description}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Describe your workspace..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={workspaceForm.type}
                  onChange={(e) => setWorkspaceForm({ ...workspaceForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="personal">Personal</option>
                  <option value="team">Team</option>
                  <option value="project">Project</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Settings</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={workspaceForm.settings.collaboration}
                      onChange={(e) => setWorkspaceForm({
                        ...workspaceForm,
                        settings: { ...workspaceForm.settings, collaboration: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Enable collaboration</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={workspaceForm.settings.autoBackup}
                      onChange={(e) => setWorkspaceForm({
                        ...workspaceForm,
                        settings: { ...workspaceForm.settings, autoBackup: e.target.checked }
                      })}
                    />
                    <span className="text-sm">Auto backup</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateWorkspace}
                disabled={!workspaceForm.name}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Create Workspace
              </button>
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workspace Members</h3>
        <button
          onClick={() => setShowMemberModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Member List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredMembers.map(member => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{member.name || member.email}</div>
                  <div className="text-sm text-gray-500">{member.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  member.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                  member.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                  member.role === 'member' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {member.role}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  member.status === 'active' ? 'bg-green-500' :
                  member.status === 'pending' ? 'bg-yellow-500' :
                  'bg-gray-300'
                }`} title={member.status} />
                <button className="p-2 text-gray-400 hover:text-gray-600">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddMember}
                disabled={!memberForm.email}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Send Invitation
              </button>
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Workspace Activity</h3>
      
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Recent Activity</h4>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {activity.map(item => (
            <div key={item.id} className="px-6 py-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  item.type === 'request' ? 'bg-blue-100 text-blue-600' :
                  item.type === 'member' ? 'bg-green-100 text-green-600' :
                  item.type === 'collection' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {item.type === 'request' && <Database className="w-4 h-4" />}
                  {item.type === 'member' && <Users className="w-4 h-4" />}
                  {item.type === 'collection' && <FolderOpen className="w-4 h-4" />}
                  {item.type === 'setting' && <Settings className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{item.user}</span>
                    <span className="text-sm text-gray-500">{item.action}</span>
                  </div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{formatDuration(item.timestamp)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workspace Templates</h3>
        <button
          onClick={() => setShowTemplateModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{template.name}</h4>
              <LayoutTemplate className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {template.tags?.map(tag => (
                <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                Use Template
              </button>
              <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="My API Template"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Describe your template..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="api">API Testing</option>
                  <option value="auth">Authentication</option>
                  <option value="crud">CRUD Operations</option>
                  <option value="integration">Integration</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateTemplate}
                disabled={!templateForm.name}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Create Template
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBackupsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Workspace Backups</h3>
        <button
          onClick={handleCreateBackup}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <Archive className="w-4 h-4" />
          Create Backup
        </button>
      </div>

      <div className="space-y-4">
        {backups.map(backup => (
          <div key={backup.id} className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">
                  Backup #{backup.id.slice(-8)}
                </h4>
                <p className="text-sm text-gray-600">
                  Created on {new Date(backup.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm rounded-full ${
                  backup.status === 'completed' ? 'bg-green-100 text-green-800' :
                  backup.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {backup.status}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={backup.status !== 'completed'}
                    className="px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🏢 Workspace Management</h1>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-blue-600 border border-blue-600 rounded text-sm hover:bg-blue-50">
              📤 Export
            </button>
            <button className="px-3 py-1 text-green-600 border border-green-600 rounded text-sm hover:bg-green-50">
              📥 Import
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 px-6 py-2">
        <div className="flex gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: FolderOpen },
            { id: 'workspaces', label: 'Workspaces (' + workspaces.length + ')', icon: Database },
            { id: 'members', label: 'Members (' + members.length + ')', icon: Users },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'templates', label: 'Templates (' + templates.length + ')', icon: LayoutTemplate },
            { id: 'backups', label: 'Backups (' + backups.length + ')', icon: Archive }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-t text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'workspaces' && renderWorkspacesTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'backups' && renderBackupsTab()}
      </div>
    </div>
  );
};

export default WorkspaceManagement;