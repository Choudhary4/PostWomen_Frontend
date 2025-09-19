import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit3, Trash2, Eye, EyeOff, Globe, X } from 'lucide-react';
import { environmentService } from '../services/environmentService';

const EnvironmentManager = ({ isOpen, onClose }) => {
  const [environments, setEnvironments] = useState([]);
  const [activeEnvironment, setActiveEnvironment] = useState(null);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [showNewEnvForm, setShowNewEnvForm] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadEnvironments();
    }
  }, [isOpen]);

  const loadEnvironments = () => {
    const envs = environmentService.getEnvironments();
    const activeEnv = environmentService.getActiveEnvironment();
    setEnvironments(envs);
    setActiveEnvironment(activeEnv);
    setSelectedEnv(activeEnv);
  };

  const handleCreateEnvironment = (e) => {
    e.preventDefault();
    if (newEnvName.trim()) {
      const newEnv = environmentService.createEnvironment(newEnvName.trim());
      setNewEnvName('');
      setShowNewEnvForm(false);
      loadEnvironments();
      setSelectedEnv(newEnv);
    }
  };

  const handleDeleteEnvironment = (envId) => {
    if (window.confirm('Are you sure you want to delete this environment?')) {
      environmentService.deleteEnvironment(envId);
      loadEnvironments();
      if (selectedEnv?.id === envId) {
        setSelectedEnv(environments[0]);
      }
    }
  };

  const handleSetActive = (env) => {
    environmentService.setActiveEnvironment(env.id);
    setActiveEnvironment(env);
  };

  const handleUpdateVariable = (variableIndex, field, value) => {
    if (!selectedEnv) return;

    const updatedVariables = [...selectedEnv.variables];
    updatedVariables[variableIndex] = {
      ...updatedVariables[variableIndex],
      [field]: value
    };

    const updatedEnv = { ...selectedEnv, variables: updatedVariables };
    environmentService.updateEnvironment(selectedEnv.id, updatedEnv);
    setSelectedEnv(updatedEnv);
    loadEnvironments();
  };

  const handleAddVariable = () => {
    if (!selectedEnv) return;

    const newVariable = { key: '', value: '', enabled: true };
    const updatedVariables = [...selectedEnv.variables, newVariable];
    const updatedEnv = { ...selectedEnv, variables: updatedVariables };
    
    environmentService.updateEnvironment(selectedEnv.id, updatedEnv);
    setSelectedEnv(updatedEnv);
    loadEnvironments();
  };

  const handleDeleteVariable = (variableIndex) => {
    if (!selectedEnv) return;

    const updatedVariables = selectedEnv.variables.filter((_, index) => index !== variableIndex);
    const updatedEnv = { ...selectedEnv, variables: updatedVariables };
    
    environmentService.updateEnvironment(selectedEnv.id, updatedEnv);
    setSelectedEnv(updatedEnv);
    loadEnvironments();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-gray-900">Environment Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Environment List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => setShowNewEnvForm(true)}
                className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Environment
              </button>

              {showNewEnvForm && (
                <form onSubmit={handleCreateEnvironment} className="mt-3">
                  <input
                    type="text"
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    placeholder="Environment name"
                    className="input-field mb-2"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button type="submit" className="btn-primary text-sm">
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewEnvForm(false);
                        setNewEnvName('');
                      }}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {environments.map((env) => (
                <div
                  key={env.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedEnv?.id === env.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                  }`}
                  onClick={() => setSelectedEnv(env)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900 truncate">{env.name}</h3>
                        {activeEnvironment?.id === env.id && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {env.variables?.length || 0} variables
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {activeEnvironment?.id !== env.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActive(env);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Set as active"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      
                      {!env.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEnvironment(env.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete environment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variable Editor */}
          <div className="flex-1 flex flex-col">
            {selectedEnv ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{selectedEnv.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage variables for this environment
                  </p>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-3">
                    {selectedEnv.variables?.map((variable, index) => (
                      <VariableRow
                        key={index}
                        variable={variable}
                        index={index}
                        onUpdate={handleUpdateVariable}
                        onDelete={handleDeleteVariable}
                      />
                    ))}
                    
                    <button
                      onClick={handleAddVariable}
                      className="w-full flex items-center justify-center px-3 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Variable
                    </button>
                  </div>

                  {/* Dynamic Variables Info */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Built-in Variables</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><code>{`{{timestamp}}`}</code> - Current timestamp</div>
                      <div><code>{`{{datetime}}`}</code> - Current ISO datetime</div>
                      <div><code>{`{{randomInt}}`}</code> - Random integer</div>
                      <div><code>{`{{randomUUID}}`}</code> - Random UUID</div>
                      <div><code>{`{{randomString}}`}</code> - Random string</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an environment to manage variables</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const VariableRow = ({ variable, index, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <button
        onClick={() => onUpdate(index, 'enabled', !variable.enabled)}
        className={`p-1 ${variable.enabled ? 'text-green-600' : 'text-gray-400'}`}
      >
        {variable.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
      
      <input
        type="text"
        value={variable.key}
        onChange={(e) => onUpdate(index, 'key', e.target.value)}
        placeholder="Variable name"
        className="input-field flex-1"
      />
      
      <input
        type="text"
        value={variable.value}
        onChange={(e) => onUpdate(index, 'value', e.target.value)}
        placeholder="Variable value"
        className="input-field flex-1"
      />
      
      <button
        onClick={() => onDelete(index)}
        className="p-1 text-gray-400 hover:text-red-600"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default EnvironmentManager;