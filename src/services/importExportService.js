class ImportExportService {
  // Export data
  exportCollections(collections) {
    const exportData = {
      info: {
        name: 'PostWomen Export',
        description: 'Exported collections from PostWomen',
        version: '1.0.0',
        exportedAt: new Date().toISOString()
      },
      collections: collections.map(collection => ({
        ...collection,
        requests: collection.requests || []
      })),
      environments: this.getEnvironments()
    };

    return JSON.stringify(exportData, null, 2);
  }

  exportAsPostmanCollection(collections) {
    const postmanFormat = {
      info: {
        _postman_id: this.generateId(),
        name: 'PostWomen Collections',
        description: 'Exported from PostWomen',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: []
    };

    collections.forEach(collection => {
      const folder = {
        name: collection.name,
        item: collection.requests.map(request => this.convertToPostmanRequest(request))
      };
      postmanFormat.item.push(folder);
    });

    return JSON.stringify(postmanFormat, null, 2);
  }

  convertToPostmanRequest(request) {
    const postmanRequest = {
      name: request.name || 'Untitled Request',
      request: {
        method: request.method || 'GET',
        header: Object.entries(request.headers || {}).map(([key, value]) => ({
          key,
          value,
          type: 'text'
        })),
        url: {
          raw: request.url,
          protocol: new URL(request.url).protocol.slice(0, -1),
          host: new URL(request.url).hostname.split('.'),
          path: new URL(request.url).pathname.split('/').filter(Boolean)
        }
      }
    };

    // Add body if present
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      postmanRequest.request.body = {
        mode: 'raw',
        raw: request.body,
        options: {
          raw: {
            language: 'json'
          }
        }
      };
    }

    // Add auth if present
    if (request.auth && request.auth.type !== 'none') {
      switch (request.auth.type) {
        case 'bearer':
          postmanRequest.request.auth = {
            type: 'bearer',
            bearer: [{ key: 'token', value: request.auth.token, type: 'string' }]
          };
          break;
        case 'basic':
          postmanRequest.request.auth = {
            type: 'basic',
            basic: [
              { key: 'username', value: request.auth.username, type: 'string' },
              { key: 'password', value: request.auth.password, type: 'string' }
            ]
          };
          break;
        case 'apikey':
          postmanRequest.request.header.push({
            key: request.auth.key,
            value: request.auth.value,
            type: 'text'
          });
          break;
      }
    }

    return postmanRequest;
  }

  // Import data
  async importFromFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Detect format
      if (data.info && data.info.schema && data.info.schema.includes('postman')) {
        return this.importPostmanCollection(data);
      } else if (data.collections || data.info) {
        return this.importNativeFormat(data);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  importPostmanCollection(data) {
    const collections = [];
    
    if (data.item) {
      data.item.forEach(item => {
        if (item.item) {
          // This is a folder
          const collection = {
            id: this.generateId(),
            name: item.name,
            requests: item.item.map(requestItem => this.convertFromPostmanRequest(requestItem)),
            createdAt: new Date().toISOString(),
            imported: true
          };
          collections.push(collection);
        } else {
          // This is a standalone request
          const collection = {
            id: this.generateId(),
            name: 'Imported Requests',
            requests: [this.convertFromPostmanRequest(item)],
            createdAt: new Date().toISOString(),
            imported: true
          };
          collections.push(collection);
        }
      });
    }

    return { collections, environments: [] };
  }

  convertFromPostmanRequest(postmanRequest) {
    const request = {
      id: this.generateId(),
      name: postmanRequest.name || 'Imported Request',
      method: postmanRequest.request?.method || 'GET',
      url: this.extractUrl(postmanRequest.request?.url),
      headers: {},
      body: '',
      auth: null
    };

    // Convert headers
    if (postmanRequest.request?.header) {
      postmanRequest.request.header.forEach(header => {
        if (header.key && header.value && !header.disabled) {
          request.headers[header.key] = header.value;
        }
      });
    }

    // Convert body
    if (postmanRequest.request?.body) {
      if (postmanRequest.request.body.mode === 'raw') {
        request.body = postmanRequest.request.body.raw;
      } else if (postmanRequest.request.body.mode === 'formdata') {
        // Convert form data to JSON for simplicity
        const formData = {};
        postmanRequest.request.body.formdata?.forEach(item => {
          if (item.key && item.value) {
            formData[item.key] = item.value;
          }
        });
        request.body = JSON.stringify(formData);
      }
    }

    // Convert auth
    if (postmanRequest.request?.auth) {
      const auth = postmanRequest.request.auth;
      switch (auth.type) {
        case 'bearer':
          request.auth = {
            type: 'bearer',
            token: auth.bearer?.find(item => item.key === 'token')?.value || ''
          };
          break;
        case 'basic':
          request.auth = {
            type: 'basic',
            username: auth.basic?.find(item => item.key === 'username')?.value || '',
            password: auth.basic?.find(item => item.key === 'password')?.value || ''
          };
          break;
      }
    }

    return request;
  }

  importNativeFormat(data) {
    return {
      collections: data.collections || [],
      environments: data.environments || []
    };
  }

  extractUrl(urlObj) {
    if (typeof urlObj === 'string') {
      return urlObj;
    }
    
    if (urlObj && urlObj.raw) {
      return urlObj.raw;
    }
    
    if (urlObj && urlObj.protocol && urlObj.host && urlObj.path) {
      const protocol = urlObj.protocol || 'https';
      const host = Array.isArray(urlObj.host) ? urlObj.host.join('.') : urlObj.host;
      const path = Array.isArray(urlObj.path) ? '/' + urlObj.path.join('/') : urlObj.path;
      return `${protocol}://${host}${path}`;
    }
    
    return '';
  }

  // cURL import
  importFromCurl(curlCommand) {
    try {
      const request = {
        id: this.generateId(),
        name: 'Imported from cURL',
        method: 'GET',
        url: '',
        headers: {},
        body: '',
        auth: null
      };

      // Parse cURL command
      const parts = this.parseCurlCommand(curlCommand);
      
      request.url = parts.url;
      request.method = parts.method;
      request.headers = parts.headers;
      request.body = parts.body;
      request.auth = parts.auth;

      return request;
    } catch (error) {
      throw new Error(`cURL import failed: ${error.message}`);
    }
  }

  parseCurlCommand(curl) {
    const result = {
      method: 'GET',
      url: '',
      headers: {},
      body: '',
      auth: null
    };

    // Remove 'curl' and clean up the command
    let command = curl.replace(/^curl\s+/, '').trim();
    
    // Extract URL (look for http/https)
    const urlMatch = command.match(/(['"]?)(https?:\/\/[^\s'"]+)\1/);
    if (urlMatch) {
      result.url = urlMatch[2];
      command = command.replace(urlMatch[0], '').trim();
    }

    // Extract method
    const methodMatch = command.match(/-X\s+(['"]?)(\w+)\1/i);
    if (methodMatch) {
      result.method = methodMatch[2].toUpperCase();
      command = command.replace(methodMatch[0], '').trim();
    }

    // Extract headers
    const headerMatches = command.matchAll(/-H\s+(['"]?)([^'"]+)\1/g);
    for (const match of headerMatches) {
      const header = match[2];
      const colonIndex = header.indexOf(':');
      if (colonIndex > 0) {
        const key = header.substring(0, colonIndex).trim();
        const value = header.substring(colonIndex + 1).trim();
        result.headers[key] = value;
      }
    }

    // Extract body data
    const dataMatch = command.match(/-d\s+(['"]?)([^'"]+)\1/);
    if (dataMatch) {
      result.body = dataMatch[2];
    }

    // Extract basic auth
    const userMatch = command.match(/-u\s+(['"]?)([^'"]+)\1/);
    if (userMatch) {
      const [username, password] = userMatch[2].split(':');
      result.auth = {
        type: 'basic',
        username: username || '',
        password: password || ''
      };
    }

    return result;
  }

  // Code generation
  generateCode(request, language) {
    switch (language.toLowerCase()) {
      case 'javascript':
        return this.generateJavaScript(request);
      case 'python':
        return this.generatePython(request);
      case 'curl':
        return this.generateCurl(request);
      case 'php':
        return this.generatePHP(request);
      case 'java':
        return this.generateJava(request);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  generateJavaScript(request) {
    const headers = Object.entries(request.headers)
      .map(([key, value]) => `    '${key}': '${value}'`)
      .join(',\n');

    let code = `// JavaScript - Fetch API
const url = '${request.url}';
const options = {
  method: '${request.method}',`;

    if (headers) {
      code += `\n  headers: {\n${headers}\n  },`;
    }

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      code += `\n  body: ${JSON.stringify(request.body)}`;
    }

    code += `\n};

fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;

    return code;
  }

  generatePython(request) {
    let code = `# Python - Requests library
import requests

url = '${request.url}'`;

    if (Object.keys(request.headers).length > 0) {
      const headers = Object.entries(request.headers)
        .map(([key, value]) => `    '${key}': '${value}'`)
        .join(',\n');
      code += `\nheaders = {\n${headers}\n}`;
    }

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      code += `\ndata = ${JSON.stringify(request.body)}`;
    }

    code += `\n\nresponse = requests.${request.method.toLowerCase()}(url`;
    
    if (Object.keys(request.headers).length > 0) {
      code += ', headers=headers';
    }
    
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      code += ', data=data';
    }

    code += `)\n\nprint(response.status_code)\nprint(response.json())`;

    return code;
  }

  generateCurl(request) {
    let curl = `curl -X ${request.method}`;
    
    Object.entries(request.headers).forEach(([key, value]) => {
      curl += ` \\\n  -H "${key}: ${value}"`;
    });

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      curl += ` \\\n  -d '${request.body}'`;
    }

    curl += ` \\\n  "${request.url}"`;

    return curl;
  }

  generatePHP(request) {
    let code = `<?php
// PHP - cURL
$url = '${request.url}';
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, '${request.method}');`;

    if (Object.keys(request.headers).length > 0) {
      const headers = Object.entries(request.headers)
        .map(([key, value]) => `    '${key}: ${value}'`)
        .join(',\n');
      code += `\n\n$headers = [\n${headers}\n];\ncurl_setopt($ch, CURLOPT_HTTPHEADER, $headers);`;
    }

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      code += `\n\n$data = '${request.body}';\ncurl_setopt($ch, CURLOPT_POSTFIELDS, $data);`;
    }

    code += `\n\n$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`;

    return code;
  }

  generateJava(request) {
    let code = `// Java - HttpURLConnection
import java.io.*;
import java.net.*;

public class ApiRequest {
    public static void main(String[] args) throws Exception {
        URL url = new URL("${request.url}");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("${request.method}");`;

    Object.entries(request.headers).forEach(([key, value]) => {
      code += `\n        conn.setRequestProperty("${key}", "${value}");`;
    });

    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      code += `\n        
        conn.setDoOutput(true);
        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
        writer.write("${request.body}");
        writer.flush();
        writer.close();`;
    }

    code += `
        
        int responseCode = conn.getResponseCode();
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
        String line;
        StringBuffer response = new StringBuffer();
        
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();
        
        System.out.println("Response Code: " + responseCode);
        System.out.println("Response: " + response.toString());
    }
}`;

    return code;
  }

  // Utility methods
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  getEnvironments() {
    try {
      const environments = localStorage.getItem('postman_mvp_environments');
      return environments ? JSON.parse(environments) : [];
    } catch {
      return [];
    }
  }

  downloadFile(content, filename, contentType = 'application/json') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const importExportService = new ImportExportService();