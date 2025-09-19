import axios from 'axios';
import { environmentService } from './environmentService';
import { testingFramework } from './testingFramework';
import { oauthService } from './oauthService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

class ApiService {
  async sendRequest(requestData) {
    try {
      // Resolve environment variables in the request
      let resolvedRequest = environmentService.resolveVariables(requestData);
      
      // Execute pre-request script if present
      let preRequestResult = null;
      if (resolvedRequest.preRequestScript) {
        preRequestResult = await testingFramework.executePreRequestScript(
          resolvedRequest.preRequestScript,
          resolvedRequest,
          environmentService.getActiveEnvironment()?.variables || {}
        );
        
        if (preRequestResult.success) {
          // Update request with any modifications from pre-request script
          resolvedRequest = preRequestResult.request;
          
          // Update environment variables if any were set
          if (preRequestResult.variables) {
            Object.entries(preRequestResult.variables).forEach(([key, value]) => {
              environmentService.setVariable(key, value);
            });
          }
        } else {
          return {
            success: false,
            error: `Pre-request script error: ${preRequestResult.error}`,
            preRequestLogs: preRequestResult.logs,
            testResults: null
          };
        }
      }

      // Apply OAuth authentication if configured
      if (resolvedRequest.auth && resolvedRequest.auth.type === 'oauth2' && resolvedRequest.auth.providerId) {
        try {
          resolvedRequest = oauthService.applyOAuthToRequest(resolvedRequest, resolvedRequest.auth.providerId);
        } catch (oauthError) {
          return {
            success: false,
            error: `OAuth error: ${oauthError.message}`,
            preRequestLogs: preRequestResult?.logs || [],
            testResults: null
          };
        }
      }

      const startTime = Date.now();
      const response = await axios.post(`${API_BASE_URL}/proxy`, resolvedRequest);
      const endTime = Date.now();
      
      // Add response timing
      const responseWithTiming = {
        ...response.data,
        duration: endTime - startTime,
        size: JSON.stringify(response.data).length
      };

      // Execute post-request script (tests) if present
      let testResult = null;
      if (resolvedRequest.postRequestScript) {
        testResult = await testingFramework.executePostRequestScript(
          resolvedRequest.postRequestScript,
          resolvedRequest,
          responseWithTiming,
          environmentService.getActiveEnvironment()?.variables || {}
        );
        
        // Update environment variables if any were set during tests
        if (testResult.success && testResult.variables) {
          Object.entries(testResult.variables).forEach(([key, value]) => {
            environmentService.setVariable(key, value);
          });
        }
      }

      return {
        ...responseWithTiming,
        preRequestLogs: preRequestResult?.logs || [],
        testResults: testResult,
        success: true
      };
    } catch (error) {
      if (error.response) {
        return {
          ...error.response.data,
          preRequestLogs: [],
          testResults: null,
          success: false
        };
      }
      throw new Error(error.message || 'Network error occurred');
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      throw new Error('Backend server is not responding');
    }
  }
}

export const apiService = new ApiService();