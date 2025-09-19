class TestingFramework {
  constructor() {
    this.testResults = [];
    this.variables = new Map();
    this.globals = new Map();
    
    // Built-in assertion library
    this.chai = {
      expect: this.expect.bind(this),
      assert: this.assert.bind(this)
    };
  }

  // Create a sandboxed environment for script execution
  createSandbox(request, response, environment = {}) {
    const sandbox = {
      // Postman-like API
      pm: {
        request: {
          url: request.url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          auth: request.auth
        },
        response: response ? {
          code: response.status,
          status: response.statusText,
          responseTime: response.duration || 0,
          responseSize: response.size || 0,
          headers: response.headers || {},
          json: () => {
            try {
              return typeof response.data === 'string' 
                ? JSON.parse(response.data) 
                : response.data;
            } catch (e) {
              throw new Error('Response is not valid JSON');
            }
          },
          text: () => {
            return typeof response.data === 'string' 
              ? response.data 
              : JSON.stringify(response.data);
          },
          to: {
            have: {
              status: (expectedStatus) => ({
                status: response.status,
                expected: expectedStatus,
                match: response.status === expectedStatus
              }),
              header: (headerName) => ({
                exists: response.headers && response.headers[headerName] !== undefined,
                value: response.headers ? response.headers[headerName] : undefined
              }),
              jsonBody: (expectedKeys) => {
                try {
                  const body = typeof response.data === 'string' 
                    ? JSON.parse(response.data) 
                    : response.data;
                  return this.validateJsonStructure(body, expectedKeys);
                } catch (e) {
                  return { valid: false, error: 'Invalid JSON response' };
                }
              }
            }
          }
        } : null,
        test: this.test.bind(this),
        expect: this.expect.bind(this),
        environment: {
          get: (key) => environment[key] || this.variables.get(key),
          set: (key, value) => {
            this.variables.set(key, value);
            return value;
          },
          unset: (key) => {
            this.variables.delete(key);
          },
          clear: () => {
            this.variables.clear();
          }
        },
        globals: {
          get: (key) => this.globals.get(key),
          set: (key, value) => {
            this.globals.set(key, value);
            return value;
          },
          unset: (key) => {
            this.globals.delete(key);
          },
          clear: () => {
            this.globals.clear();
          }
        },
        variables: {
          get: (key) => this.variables.get(key) || this.globals.get(key) || environment[key],
          set: (key, value) => {
            this.variables.set(key, value);
            return value;
          }
        },
        sendRequest: this.sendRequest.bind(this)
      },
      
      // Console for debugging
      console: {
        log: (...args) => {
          console.log('[Test Script]', ...args);
          this.addTestLog('log', args.join(' '));
        },
        error: (...args) => {
          console.error('[Test Script]', ...args);
          this.addTestLog('error', args.join(' '));
        },
        warn: (...args) => {
          console.warn('[Test Script]', ...args);
          this.addTestLog('warn', args.join(' '));
        }
      },

      // Utility functions
      JSON,
      Date,
      Math,
      parseInt,
      parseFloat,
      String,
      Number,
      Boolean,
      Array,
      Object,
      RegExp,
      
      // Custom utility functions
      btoa: (str) => Buffer.from(str).toString('base64'),
      atob: (str) => Buffer.from(str, 'base64').toString(),
      uuid: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      },
      randomInt: (min = 0, max = 1000) => Math.floor(Math.random() * (max - min + 1)) + min,
      randomString: (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      }
    };

    return sandbox;
  }

  // Execute pre-request script
  async executePreRequestScript(script, request, environment = {}) {
    if (!script || !script.trim()) return { success: true, request, logs: [] };

    try {
      this.testResults = [];
      const sandbox = this.createSandbox(request, null, environment);
      
      // Execute script in sandbox
      const result = this.executeInSandbox(script, sandbox);
      
      // Extract modified request data
      const modifiedRequest = {
        ...request,
        url: sandbox.pm.request.url,
        method: sandbox.pm.request.method,
        headers: sandbox.pm.request.headers,
        body: sandbox.pm.request.body,
        auth: sandbox.pm.request.auth
      };

      return {
        success: true,
        request: modifiedRequest,
        variables: Object.fromEntries(this.variables),
        globals: Object.fromEntries(this.globals),
        logs: this.getLogs()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        request,
        logs: this.getLogs()
      };
    }
  }

  // Execute post-request script (tests)
  async executePostRequestScript(script, request, response, environment = {}) {
    if (!script || !script.trim()) return { success: true, tests: [], logs: [] };

    try {
      this.testResults = [];
      const sandbox = this.createSandbox(request, response, environment);
      
      // Execute script in sandbox
      this.executeInSandbox(script, sandbox);

      return {
        success: true,
        tests: this.testResults,
        variables: Object.fromEntries(this.variables),
        globals: Object.fromEntries(this.globals),
        logs: this.getLogs()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tests: this.testResults,
        logs: this.getLogs()
      };
    }
  }

  // Execute script in sandbox environment
  executeInSandbox(script, sandbox) {
    // Create a function with the sandbox as context
    const scriptFunction = new Function(
      ...Object.keys(sandbox),
      `
      "use strict";
      ${script}
      `
    );

    // Execute with sandbox values as parameters
    return scriptFunction(...Object.values(sandbox));
  }

  // Test assertion method
  test(name, testFunction) {
    try {
      const startTime = Date.now();
      const result = testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        name,
        passed: true,
        duration,
        error: null,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      this.testResults.push({
        name,
        passed: false,
        duration: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  // Expectation framework
  expect(actual) {
    return {
      to: {
        equal: (expected) => {
          if (actual !== expected) {
            throw new Error(`Expected ${actual} to equal ${expected}`);
          }
          return true;
        },
        not: {
          equal: (expected) => {
            if (actual === expected) {
              throw new Error(`Expected ${actual} to not equal ${expected}`);
            }
            return true;
          }
        },
        be: {
          above: (expected) => {
            if (actual <= expected) {
              throw new Error(`Expected ${actual} to be above ${expected}`);
            }
            return true;
          },
          below: (expected) => {
            if (actual >= expected) {
              throw new Error(`Expected ${actual} to be below ${expected}`);
            }
            return true;
          },
          true: () => {
            if (actual !== true) {
              throw new Error(`Expected ${actual} to be true`);
            }
            return true;
          },
          false: () => {
            if (actual !== false) {
              throw new Error(`Expected ${actual} to be false`);
            }
            return true;
          }
        },
        include: (expected) => {
          if (Array.isArray(actual)) {
            if (!actual.includes(expected)) {
              throw new Error(`Expected array to include ${expected}`);
            }
          } else if (typeof actual === 'string') {
            if (actual.indexOf(expected) === -1) {
              throw new Error(`Expected string to include ${expected}`);
            }
          } else if (typeof actual === 'object') {
            if (!actual.hasOwnProperty(expected)) {
              throw new Error(`Expected object to include property ${expected}`);
            }
          }
          return true;
        },
        have: {
          property: (property, value) => {
            if (!actual.hasOwnProperty(property)) {
              throw new Error(`Expected object to have property ${property}`);
            }
            if (value !== undefined && actual[property] !== value) {
              throw new Error(`Expected property ${property} to equal ${value}, got ${actual[property]}`);
            }
            return true;
          },
          length: (expected) => {
            if (!actual.length && actual.length !== 0) {
              throw new Error(`Expected object to have length property`);
            }
            if (actual.length !== expected) {
              throw new Error(`Expected length to be ${expected}, got ${actual.length}`);
            }
            return true;
          },
          status: (expected) => {
            if (actual.status !== expected) {
              throw new Error(`Expected status to be ${expected}, got ${actual.status}`);
            }
            return true;
          }
        }
      },
      and: {
        to: this.expect(actual).to
      }
    };
  }

  // Assert methods
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
    return true;
  }

  // Validate JSON structure
  validateJsonStructure(actual, expected) {
    try {
      if (Array.isArray(expected)) {
        expected.forEach(key => {
          if (!actual.hasOwnProperty(key)) {
            throw new Error(`Missing required property: ${key}`);
          }
        });
      } else if (typeof expected === 'object') {
        Object.keys(expected).forEach(key => {
          if (!actual.hasOwnProperty(key)) {
            throw new Error(`Missing required property: ${key}`);
          }
          // Recursive validation for nested objects
          if (typeof expected[key] === 'object' && typeof actual[key] === 'object') {
            this.validateJsonStructure(actual[key], expected[key]);
          }
        });
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Send additional requests from scripts
  async sendRequest(requestConfig) {
    // This would integrate with the main API service
    // For now, return a mock response
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      data: {},
      duration: 100
    };
  }

  // Logging functionality
  addTestLog(level, message) {
    if (!this.logs) this.logs = [];
    this.logs.push({
      level,
      message,
      timestamp: new Date().toISOString()
    });
  }

  getLogs() {
    return this.logs || [];
  }

  // Clear test state
  clearState() {
    this.testResults = [];
    this.logs = [];
    this.variables.clear();
  }

  // Get test summary
  getTestSummary(tests) {
    const total = tests.length;
    const passed = tests.filter(test => test.passed).length;
    const failed = total - passed;
    const totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      totalDuration
    };
  }

  // Common test templates
  getTestTemplates() {
    return {
      'Status Code': `pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});`,
      'Response Time': `pm.test("Response time is less than 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});`,
      'JSON Body': `pm.test("Response is JSON", function () {
    pm.response.to.be.json;
});`,
      'Header Exists': `pm.test("Content-Type header exists", function () {
    pm.response.to.have.header("Content-Type");
});`,
      'JSON Schema': `pm.test("Response has required fields", function () {
    const responseJson = pm.response.json();
    pm.expect(responseJson).to.have.property('id');
    pm.expect(responseJson).to.have.property('name');
});`,
      'Set Variable': `// Set environment variable from response
const responseJson = pm.response.json();
pm.environment.set("userId", responseJson.id);`,
      'Authenticate': `// Extract token from response
const responseJson = pm.response.json();
pm.environment.set("authToken", responseJson.access_token);`
    };
  }

  // Pre-request script templates
  getPreRequestTemplates() {
    return {
      'Set Timestamp': `pm.environment.set("timestamp", Date.now());`,
      'Generate UUID': `pm.environment.set("requestId", uuid());`,
      'Set Random Data': `pm.environment.set("randomEmail", "user" + randomInt() + "@example.com");
pm.environment.set("randomName", "User " + randomString(5));`,
      'Base64 Encode': `const credentials = pm.environment.get("username") + ":" + pm.environment.get("password");
pm.environment.set("basicAuth", btoa(credentials));`,
      'Conditional Logic': `if (pm.environment.get("environment") === "production") {
    pm.request.url = "https://api.production.com/endpoint";
} else {
    pm.request.url = "https://api.staging.com/endpoint";
}`
    };
  }
}

export const testingFramework = new TestingFramework();