import { apiService } from './apiService';
import { environmentService } from './environmentService';

class CollectionRunnerService {
  constructor() {
    this.activeRun = null;
    this.runResults = null;
    this.runCallbacks = [];
  }

  // Add callback for run updates
  addRunCallback(callback) {
    this.runCallbacks.push(callback);
  }

  // Remove callback
  removeRunCallback(callback) {
    this.runCallbacks = this.runCallbacks.filter(cb => cb !== callback);
  }

  // Notify all callbacks of run updates
  notifyCallbacks(type, data) {
    this.runCallbacks.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Error in run callback:', error);
      }
    });
  }

  // Start collection run
  async runCollection(runConfig) {
    if (this.activeRun) {
      throw new Error('A run is already in progress');
    }

    const { collectionId, requests, mode, settings, performanceMode } = runConfig;
    
    this.activeRun = {
      id: `run_${Date.now()}`,
      collectionId,
      current: 0,
      total: requests.length * settings.iterations,
      mode,
      settings,
      performanceMode,
      startTime: Date.now(),
      status: 'running'
    };

    this.runResults = {
      id: this.activeRun.id,
      collectionId,
      startTime: this.activeRun.startTime,
      endTime: null,
      requests: [],
      summary: null,
      settings,
      mode
    };

    this.notifyCallbacks('run_started', this.activeRun);

    try {
      if (mode === 'sequential') {
        await this.runSequential(requests, settings);
      } else {
        await this.runParallel(requests, settings);
      }

      this.runResults.endTime = Date.now();
      this.runResults.summary = this.calculateSummary();
      
      this.notifyCallbacks('run_completed', this.runResults);
    } catch (error) {
      this.runResults.endTime = Date.now();
      this.runResults.error = error.message;
      this.notifyCallbacks('run_error', error);
    } finally {
      this.activeRun = null;
    }

    return this.runResults;
  }

  // Sequential execution
  async runSequential(requests, settings) {
    for (let iteration = 0; iteration < settings.iterations; iteration++) {
      for (let i = 0; i < requests.length; i++) {
        if (!this.activeRun) break; // Stop if run was cancelled

        const request = requests[i];
        const requestResult = await this.executeRequest(request, iteration, settings);
        
        this.runResults.requests.push(requestResult);
        this.activeRun.current++;
        
        this.notifyCallbacks('request_completed', {
          request: requestResult,
          progress: this.activeRun.current / this.activeRun.total
        });

        // Stop on error if configured
        if (!requestResult.success && settings.stopOnError) {
          throw new Error(`Request failed: ${requestResult.error}`);
        }

        // Add delay between requests
        if (settings.delay > 0 && i < requests.length - 1) {
          await this.delay(settings.delay);
        }
      }
    }
  }

  // Parallel execution
  async runParallel(requests, settings) {
    const allPromises = [];
    
    for (let iteration = 0; iteration < settings.iterations; iteration++) {
      const iterationPromises = requests.map(async (request, index) => {
        // Add staggered delay for parallel requests to avoid overwhelming the server
        if (index > 0) {
          await this.delay(Math.min(settings.delay || 100, 100) * index);
        }
        
        if (!this.activeRun) return null; // Stop if run was cancelled

        const requestResult = await this.executeRequest(request, iteration, settings);
        
        this.runResults.requests.push(requestResult);
        this.activeRun.current++;
        
        this.notifyCallbacks('request_completed', {
          request: requestResult,
          progress: this.activeRun.current / this.activeRun.total
        });

        return requestResult;
      });
      
      allPromises.push(...iterationPromises);
    }

    const results = await Promise.allSettled(allPromises);
    
    // Check for errors if stopOnError is enabled
    if (settings.stopOnError) {
      const failedResult = results.find(r => r.status === 'rejected' || !r.value?.success);
      if (failedResult) {
        throw new Error(`Request failed: ${failedResult.reason || failedResult.value?.error}`);
      }
    }
  }

  // Execute a single request
  async executeRequest(request, iteration, settings) {
    const startTime = Date.now();
    
    try {
      // Apply data file variables if available
      let processedRequest = { ...request };
      if (settings.dataFile && settings.dataFile.data.length > 0) {
        const dataRow = settings.dataFile.data[iteration % settings.dataFile.data.length];
        processedRequest = this.applyDataVariables(processedRequest, dataRow);
      }

      // Resolve environment variables
      const resolvedRequest = environmentService.resolveVariables(processedRequest);

      // Set timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), settings.timeout);

      const result = await apiService.sendRequest({
        ...resolvedRequest,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();

      return {
        id: `${request.id}_${iteration}_${Date.now()}`,
        name: request.name || `${request.method} ${request.url}`,
        method: request.method,
        url: resolvedRequest.url,
        success: result.success !== false && result.status >= 200 && result.status < 400,
        status: result.status,
        responseTime: endTime - startTime,
        responseSize: result.size || 0,
        iteration,
        timestamp: startTime,
        error: result.error || null,
        tests: result.testResults?.tests || [],
        testsPassed: result.testResults?.tests?.filter(t => t.passed).length || 0,
        testsTotal: result.testResults?.tests?.length || 0
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        id: `${request.id}_${iteration}_${Date.now()}`,
        name: request.name || `${request.method} ${request.url}`,
        method: request.method,
        url: request.url,
        success: false,
        status: 0,
        responseTime: endTime - startTime,
        responseSize: 0,
        iteration,
        timestamp: startTime,
        error: error.message,
        tests: [],
        testsPassed: 0,
        testsTotal: 0
      };
    }
  }

  // Apply data file variables to request
  applyDataVariables(request, dataRow) {
    const processedRequest = { ...request };
    
    // Replace variables in URL
    processedRequest.url = this.replaceDataVariables(request.url, dataRow);
    
    // Replace variables in headers
    processedRequest.headers = Object.entries(request.headers || {}).reduce((acc, [key, value]) => {
      acc[this.replaceDataVariables(key, dataRow)] = this.replaceDataVariables(value, dataRow);
      return acc;
    }, {});
    
    // Replace variables in body
    if (request.body) {
      processedRequest.body = this.replaceDataVariables(request.body, dataRow);
    }

    return processedRequest;
  }

  // Replace {{variable}} patterns with data file values
  replaceDataVariables(text, dataRow) {
    if (!text || typeof text !== 'string') return text;
    
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();
      return dataRow[trimmedName] !== undefined ? dataRow[trimmedName] : match;
    });
  }

  // Stop current run
  stopRun() {
    if (this.activeRun) {
      this.activeRun.status = 'stopped';
      this.runResults.endTime = Date.now();
      this.runResults.summary = this.calculateSummary();
      this.notifyCallbacks('run_stopped', this.runResults);
      this.activeRun = null;
    }
  }

  // Calculate run summary
  calculateSummary() {
    const requests = this.runResults.requests;
    const total = requests.length;
    const passed = requests.filter(r => r.success).length;
    const failed = total - passed;
    const avgResponseTime = total > 0 ? requests.reduce((sum, r) => sum + r.responseTime, 0) / total : 0;
    const totalTime = this.runResults.endTime - this.runResults.startTime;
    const totalTests = requests.reduce((sum, r) => sum + r.testsTotal, 0);
    const passedTests = requests.reduce((sum, r) => sum + r.testsPassed, 0);

    return {
      requests: {
        total,
        passed,
        failed,
        passRate: total > 0 ? (passed / total) * 100 : 0
      },
      tests: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        passRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
      },
      performance: {
        totalTime,
        avgResponseTime: Math.round(avgResponseTime),
        requestsPerSecond: total > 0 ? (total / (totalTime / 1000)).toFixed(2) : 0,
        minResponseTime: requests.length > 0 ? Math.min(...requests.map(r => r.responseTime)) : 0,
        maxResponseTime: requests.length > 0 ? Math.max(...requests.map(r => r.responseTime)) : 0
      }
    };
  }

  // Get current run status
  getActiveRun() {
    return this.activeRun;
  }

  // Get run results
  getRunResults() {
    return this.runResults;
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Export results to various formats
  exportResults(format = 'json') {
    if (!this.runResults) return null;

    switch (format) {
      case 'json':
        return JSON.stringify(this.runResults, null, 2);
      
      case 'csv':
        const headers = ['Name', 'Method', 'URL', 'Status', 'Success', 'Response Time', 'Tests Passed', 'Tests Total', 'Error'];
        const rows = this.runResults.requests.map(r => [
          r.name,
          r.method,
          r.url,
          r.status,
          r.success,
          r.responseTime,
          r.testsPassed,
          r.testsTotal,
          r.error || ''
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      case 'html':
        return this.generateHTMLReport();
      
      default:
        return JSON.stringify(this.runResults, null, 2);
    }
  }

  // Generate HTML report
  generateHTMLReport() {
    const summary = this.runResults.summary;
    const requests = this.runResults.requests;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Postman Collection Run Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .stats { display: flex; gap: 20px; margin-bottom: 20px; }
        .stat { background: white; padding: 15px; border-radius: 5px; text-align: center; }
        .requests { margin-top: 20px; }
        .request { border: 1px solid #ddd; margin-bottom: 10px; padding: 10px; border-radius: 5px; }
        .success { border-left: 4px solid #4CAF50; }
        .failure { border-left: 4px solid #f44336; }
        .error { color: #f44336; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Collection Run Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <div class="stats">
            <div class="stat">
                <h3>${summary.requests.total}</h3>
                <p>Total Requests</p>
            </div>
            <div class="stat">
                <h3>${summary.requests.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="stat">
                <h3>${summary.requests.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="stat">
                <h3>${summary.requests.passRate.toFixed(1)}%</h3>
                <p>Pass Rate</p>
            </div>
        </div>
    </div>
    
    <div class="requests">
        <h2>Request Results</h2>
        ${requests.map(request => `
            <div class="request ${request.success ? 'success' : 'failure'}">
                <h3>${request.name}</h3>
                <p><strong>${request.method}</strong> ${request.url}</p>
                <p>Status: ${request.status} | Response Time: ${request.responseTime}ms</p>
                ${request.error ? `<p class="error">Error: ${request.error}</p>` : ''}
                ${request.testsTotal > 0 ? `<p>Tests: ${request.testsPassed}/${request.testsTotal} passed</p>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }
}

export const collectionRunnerService = new CollectionRunnerService();