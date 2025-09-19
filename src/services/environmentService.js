class EnvironmentService {
  constructor() {
    this.ENVIRONMENTS_KEY = 'postman_mvp_environments';
    this.ACTIVE_ENV_KEY = 'postman_mvp_active_environment';
  }

  // Environment management
  getEnvironments() {
    try {
      const environments = localStorage.getItem(this.ENVIRONMENTS_KEY);
      return environments ? JSON.parse(environments) : this.getDefaultEnvironments();
    } catch (error) {
      console.error('Error loading environments:', error);
      return this.getDefaultEnvironments();
    }
  }

  getDefaultEnvironments() {
    return [
      {
        id: 'development',
        name: 'Development',
        variables: [
          { key: 'baseUrl', value: 'http://localhost:3000', enabled: true },
          { key: 'apiKey', value: 'dev-api-key-123', enabled: true }
        ],
        isDefault: true
      },
      {
        id: 'staging',
        name: 'Staging',
        variables: [
          { key: 'baseUrl', value: 'https://staging-api.example.com', enabled: true },
          { key: 'apiKey', value: 'staging-api-key', enabled: true }
        ],
        isDefault: false
      },
      {
        id: 'production',
        name: 'Production',
        variables: [
          { key: 'baseUrl', value: 'https://api.example.com', enabled: true },
          { key: 'apiKey', value: 'prod-api-key', enabled: true }
        ],
        isDefault: false
      }
    ];
  }

  saveEnvironments(environments) {
    try {
      localStorage.setItem(this.ENVIRONMENTS_KEY, JSON.stringify(environments));
    } catch (error) {
      console.error('Error saving environments:', error);
    }
  }

  getActiveEnvironment() {
    try {
      const activeId = localStorage.getItem(this.ACTIVE_ENV_KEY);
      const environments = this.getEnvironments();
      return environments.find(env => env.id === activeId) || environments[0];
    } catch (error) {
      console.error('Error getting active environment:', error);
      return this.getEnvironments()[0];
    }
  }

  setActiveEnvironment(environmentId) {
    try {
      localStorage.setItem(this.ACTIVE_ENV_KEY, environmentId);
    } catch (error) {
      console.error('Error setting active environment:', error);
    }
  }

  createEnvironment(name) {
    const environments = this.getEnvironments();
    const newEnvironment = {
      id: Date.now().toString(),
      name,
      variables: [],
      isDefault: false
    };
    environments.push(newEnvironment);
    this.saveEnvironments(environments);
    return newEnvironment;
  }

  updateEnvironment(environmentId, updates) {
    const environments = this.getEnvironments();
    const index = environments.findIndex(env => env.id === environmentId);
    if (index !== -1) {
      environments[index] = { ...environments[index], ...updates };
      this.saveEnvironments(environments);
    }
  }

  deleteEnvironment(environmentId) {
    const environments = this.getEnvironments();
    const filtered = environments.filter(env => env.id !== environmentId);
    this.saveEnvironments(filtered);
  }

  // Variable substitution
  resolveVariables(text, additionalVars = {}) {
    if (!text || typeof text !== 'string') return text;

    const activeEnv = this.getActiveEnvironment();
    const envVars = {};
    
    // Build environment variables map
    if (activeEnv && activeEnv.variables) {
      activeEnv.variables.forEach(variable => {
        if (variable.enabled) {
          envVars[variable.key] = variable.value;
        }
      });
    }

    // Merge with additional variables (like dynamic ones)
    const allVars = { ...envVars, ...additionalVars };

    // Replace variables in format {{variableName}}
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      if (allVars.hasOwnProperty(trimmedName)) {
        return allVars[trimmedName];
      }
      
      // If variable not found, return original placeholder
      return match;
    });
  }

  // Get all variables from active environment
  getActiveVariables() {
    const activeEnv = this.getActiveEnvironment();
    if (!activeEnv || !activeEnv.variables) return {};

    const variables = {};
    activeEnv.variables.forEach(variable => {
      if (variable.enabled) {
        variables[variable.key] = variable.value;
      }
    });
    return variables;
  }

  // Add dynamic variables
  getDynamicVariables() {
    return {
      timestamp: Date.now().toString(),
      datetime: new Date().toISOString(),
      randomInt: Math.floor(Math.random() * 1000).toString(),
      randomUUID: this.generateUUID(),
      randomString: this.generateRandomString(8)
    };
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Validate variable syntax
  validateVariables(text) {
    if (!text || typeof text !== 'string') return { isValid: true, errors: [] };

    const errors = [];
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const activeVars = this.getActiveVariables();
    const dynamicVars = this.getDynamicVariables();
    const allVars = { ...activeVars, ...dynamicVars };

    let match;
    while ((match = variableRegex.exec(text)) !== null) {
      const variableName = match[1].trim();
      if (!allVars.hasOwnProperty(variableName)) {
        errors.push(`Variable '${variableName}' is not defined`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const environmentService = new EnvironmentService();