/**
 * storageService.js
 *
 * All localStorage operations for collections, request history, and environments.
 * Everything is namespaced under 'pw_' to avoid key collisions.
 */

const KEYS = {
  COLLECTIONS: 'pw_collections',
  HISTORY:     'pw_history',
  ENVS:        'pw_environments',
  ACTIVE_ENV:  'pw_active_env',
};

// ─── Helpers ────────────────────────────────────────────────────────────
function load(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Collections ─────────────────────────────────────────────────────────
export function getCollections() {
  return load(KEYS.COLLECTIONS, []);
}

export function saveCollections(collections) {
  save(KEYS.COLLECTIONS, collections);
}

export function createCollection(name) {
  const collections = getCollections();
  const newCollection = { id: Date.now().toString(), name, requests: [], createdAt: new Date().toISOString() };
  collections.push(newCollection);
  saveCollections(collections);
  return newCollection;
}

export function deleteCollection(id) {
  const collections = getCollections().filter((c) => c.id !== id);
  saveCollections(collections);
}

export function saveRequestToCollection(collectionId, request) {
  const collections = getCollections();
  const col = collections.find((c) => c.id === collectionId);
  if (!col) return;

  const req = { ...request, id: Date.now().toString(), savedAt: new Date().toISOString() };
  col.requests.push(req);
  saveCollections(collections);
  return req;
}

export function deleteRequestFromCollection(collectionId, requestId) {
  const collections = getCollections();
  const col = collections.find((c) => c.id === collectionId);
  if (!col) return;
  col.requests = col.requests.filter((r) => r.id !== requestId);
  saveCollections(collections);
}

// ─── History (last 50 requests) ──────────────────────────────────────────
export function getHistory() {
  return load(KEYS.HISTORY, []);
}

export function addToHistory(request, response) {
  const history = getHistory();
  history.unshift({ request, response, timestamp: new Date().toISOString(), id: Date.now().toString() });
  save(KEYS.HISTORY, history.slice(0, 50)); // Keep only last 50
}

export function clearHistory() {
  save(KEYS.HISTORY, []);
}

// ─── Environments ─────────────────────────────────────────────────────────
export function getEnvironments() {
  return load(KEYS.ENVS, []);
}

export function saveEnvironments(envs) {
  save(KEYS.ENVS, envs);
}

export function createEnvironment(name) {
  const envs = getEnvironments();
  const env = { id: Date.now().toString(), name, variables: {} };
  envs.push(env);
  saveEnvironments(envs);
  return env;
}

export function getActiveEnvironment() {
  const id = load(KEYS.ACTIVE_ENV);
  if (!id) return null;
  return getEnvironments().find((e) => e.id === id) || null;
}

export function setActiveEnvironment(id) {
  save(KEYS.ACTIVE_ENV, id);
}

export function updateEnvironment(id, updates) {
  const envs = getEnvironments().map((e) => (e.id === id ? { ...e, ...updates } : e));
  saveEnvironments(envs);
}

export function deleteEnvironment(id) {
  const envs = getEnvironments().filter((e) => e.id !== id);
  saveEnvironments(envs);
  if (load(KEYS.ACTIVE_ENV) === id) save(KEYS.ACTIVE_ENV, null);
}

/**
 * Resolves {{variable}} placeholders in a string using the active environment.
 */
export function resolveVariables(text) {
  if (!text || typeof text !== 'string') return text;
  const env = getActiveEnvironment();
  if (!env) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return env.variables[key] !== undefined ? env.variables[key] : `{{${key}}}`;
  });
}