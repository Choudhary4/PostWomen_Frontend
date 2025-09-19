class StorageService {
  constructor() {
    this.COLLECTIONS_KEY = 'postman_mvp_collections';
    this.HISTORY_KEY = 'postman_mvp_history';
    this.SETTINGS_KEY = 'postman_mvp_settings';
  }

  // Collections management
  getCollections() {
    try {
      const collections = localStorage.getItem(this.COLLECTIONS_KEY);
      return collections ? JSON.parse(collections) : [];
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  }

  saveCollections(collections) {
    try {
      localStorage.setItem(this.COLLECTIONS_KEY, JSON.stringify(collections));
    } catch (error) {
      console.error('Error saving collections:', error);
    }
  }

  createCollection(collection) {
    const collections = this.getCollections();
    collections.push(collection);
    this.saveCollections(collections);
  }

  deleteCollection(collectionId) {
    const collections = this.getCollections();
    const filtered = collections.filter(c => c.id !== collectionId);
    this.saveCollections(filtered);
  }

  saveRequest(request, collectionId) {
    const collections = this.getCollections();
    const collectionIndex = collections.findIndex(c => c.id === collectionId);
    
    if (collectionIndex !== -1) {
      collections[collectionIndex].requests.push(request);
      this.saveCollections(collections);
    }
  }

  deleteRequest(requestId, collectionId) {
    const collections = this.getCollections();
    const collectionIndex = collections.findIndex(c => c.id === collectionId);
    
    if (collectionIndex !== -1) {
      collections[collectionIndex].requests = collections[collectionIndex].requests
        .filter(r => r.id !== requestId);
      this.saveCollections(collections);
    }
  }

  // History management
  getHistory() {
    try {
      const history = localStorage.getItem(this.HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading history:', error);
      return [];
    }
  }

  saveToHistory(request, response) {
    const history = this.getHistory();
    const historyItem = {
      id: Date.now().toString(),
      request,
      response,
      timestamp: new Date().toISOString()
    };
    
    history.unshift(historyItem);
    
    // Keep only last 100 items
    if (history.length > 100) {
      history.splice(100);
    }
    
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  clearHistory() {
    localStorage.removeItem(this.HISTORY_KEY);
  }

  // Settings management
  getSettings() {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {
        theme: 'light',
        autoFormat: true,
        timeout: 30000
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }

  saveSettings(settings) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Utility methods
  exportData() {
    return {
      collections: this.getCollections(),
      history: this.getHistory(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
  }

  importData(data) {
    try {
      if (data.collections) this.saveCollections(data.collections);
      if (data.settings) this.saveSettings(data.settings);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export const storageService = new StorageService();