/**
 * apiService.js
 *
 * Sends HTTP requests through the PostWomen backend proxy.
 * The proxy is needed to avoid CORS issues when calling external APIs from the browser.
 */

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:9000/api';

/**
 * Sends an API request through the backend proxy.
 * @param {Object} request - { url, method, headers, body, auth }
 * @returns Response object with { status, statusText, headers, data, duration, size }
 */
export async function sendRequest(request) {
  const response = await fetch(`${API_BASE}/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url:     request.url,
      method:  request.method,
      headers: request.headers || {},
      body:    request.body || null,
      auth:    request.auth || null,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Backend error: ${response.status}`);
  }

  return response.json();
}

export default { sendRequest };