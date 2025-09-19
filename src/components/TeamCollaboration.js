import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Settings, Activity, Crown, Shield, Eye, Calendar, Search, Filter, Mail, Clock, MoreVertical } from 'lucide-react';

const TeamCollaboration = () => {
  const [activeTab, setActiveTab] = useState('teams');
  const [teams, setTeams] = useState([]);
  const [currentUser] = useState({ id: 'admin', name: 'Administrator', email: 'admin@postman-mvp.com' });
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [collaborationActivity, setCollaborationActivity] = useState([]);
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    type: 'team',
    visibility: 'private',
    allowInvites: true
  });
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'member'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadTeams();
    loadInvitations();
    loadCollaborationActivity();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
      loadActiveCollaborators();
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const response = await fetch(`/api/teams/users/${currentUser.id}`);
      if (response.ok) {
        const userTeams = await response.json();
        setTeams(userTeams);
        if (userTeams.length > 0 && !selectedTeam) {
          setSelectedTeam(userTeams[0]);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadTeamMembers = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (response.ok) {
        const members = await response.json();
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await fetch(`/api/teams/invitations/user/${currentUser.email}`);
      if (response.ok) {
        const userInvitations = await response.json();
        setInvitations(userInvitations);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const loadCollaborationActivity = async () => {
    try {
      const response = await fetch(`/api/teams/activity/default`);
      if (response.ok) {
        const activity = await response.json();
        setCollaborationActivity(activity);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const loadActiveCollaborators = async () => {
    try {
      const response = await fetch(`/api/teams/collaboration/collection-1/collaborators`);
      if (response.ok) {
        const collaborators = await response.json();
        setActiveCollaborators(collaborators);
      }
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const handleCreateTeam = async () => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teamForm, ownerId: currentUser.id })
      });

      if (response.ok) {
        await loadTeams();
        setShowCreateTeam(false);
        setTeamForm({
          name: '',
          description: '',
          type: 'team',
          visibility: 'private',
          allowInvites: true
        });
      } else {
        const error = await response.json();
        alert('Error creating team: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Error creating team');
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          invitedBy: currentUser.id
        })
      });

      if (response.ok) {
        await loadTeamMembers(selectedTeam.id);
        setShowInviteMember(false);
        setInviteForm({ email: '', role: 'member' });
        alert('Invitation sent successfully!');
      } else {
        const error = await response.json();
        alert('Error sending invitation: ' + error.error);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Error sending invitation');
    }
  };

  const handleRespondToInvitation = async (invitationId, response) => {
    try {
      const res = await fetch(`/api/teams/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response, userId: currentUser.id })
      });

      if (res.ok) {
        await loadInvitations();
        if (response === 'accepted') {
          await loadTeams();
        }
      } else {
        const error = await res.json();
        alert('Error responding to invitation: ' + error.error);
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedTeam || !window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removedBy: currentUser.id })
      });

      if (response.ok) {
        await loadTeamMembers(selectedTeam.id);
      } else {
        const error = await response.json();
        alert('Error removing member: ' + error.error);
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'member': return <Users className="w-4 h-4 text-green-500" />;
      default: return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatActivityType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const renderTeamsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">My Teams</h3>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          onClick={() => setShowCreateTeam(true)}
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <div 
            key={team.id} 
            className={`bg-white border rounded-lg p-6 cursor-pointer transition-all ${
              selectedTeam?.id === team.id ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTeam(team)}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">{team.name}</h4>
              <span className={`px-2 py-1 text-xs rounded ${
                team.type === 'personal' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {team.type}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{team.description}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{teamMembers.length} members</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{new Date(team.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {selectedTeam?.id === team.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowInviteMember(true);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    Invite Members
                  </button>
                  <button className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Enter team name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Describe your team..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Type</label>
                <select
                  value={teamForm.type}
                  onChange={(e) => setTeamForm({ ...teamForm, type: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="team">Team</option>
                  <option value="organization">Organization</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                  value={teamForm.visibility}
                  onChange={(e) => setTeamForm({ ...teamForm, visibility: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="private">Private</option>
                  <option value="internal">Internal</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateTeam}
                disabled={!teamForm.name}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Create Team
              </button>
              <button
                onClick={() => setShowCreateTeam(false)}
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
        <h3 className="text-lg font-semibold">
          Team Members {selectedTeam && `- ${selectedTeam.name}`}
        </h3>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          onClick={() => setShowInviteMember(true)}
          disabled={!selectedTeam}
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
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
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="all">All Roles</option>
          <option value="owner">Owner</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
        </select>
      </div>

      {/* Members List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">
              {filteredMembers.length} Members
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{activeCollaborators.length} active now</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredMembers.map(member => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {member.name?.charAt(0) || member.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {member.name || member.email}
                    </span>
                    {activeCollaborators.some(c => c.userId === member.id) && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{member.email}</span>
                    <span>•</span>
                    <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getRoleIcon(member.role)}
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {member.role}
                  </span>
                </div>
                
                {member.role !== 'owner' && selectedTeam?.ownerId === currentUser.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="member@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleInviteMember}
                disabled={!inviteForm.email}
                className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                Send Invitation
              </button>
              <button
                onClick={() => setShowInviteMember(false)}
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
      <h3 className="text-lg font-semibold">Team Activity</h3>
      
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Recent Activity</h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {collaborationActivity.map(activity => (
            <div key={activity.id} className="px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">
                      {activity.userId}
                    </span>
                    <span className="text-gray-600">
                      {formatActivityType(activity.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderInvitationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Pending Invitations</h3>
      
      {invitations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No pending invitations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map(invitation => (
            <div key={invitation.id} className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{invitation.team.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{invitation.team.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>Role: <span className="font-medium">{invitation.role}</span></span>
                    <span>Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
                    <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespondToInvitation(invitation.id, 'declined')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">👥 Team Collaboration</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{activeCollaborators.length} active collaborators</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 px-6 py-2">
        <div className="flex gap-1">
          {[
            { id: 'teams', label: `Teams (${teams.length})`, icon: Users },
            { id: 'members', label: `Members (${teamMembers.length})`, icon: UserPlus },
            { id: 'activity', label: 'Activity', icon: Activity },
            { id: 'invitations', label: `Invitations (${invitations.length})`, icon: Mail }
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
        {activeTab === 'teams' && renderTeamsTab()}
        {activeTab === 'members' && renderMembersTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'invitations' && renderInvitationsTab()}
      </div>
    </div>
  );
};

export default TeamCollaboration;