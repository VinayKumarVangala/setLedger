const fs = require('fs');
const path = require('path');

class FallbackService {
  static async getData(apiFn, fallbackFile) {
    try {
      // Attempt API call first
      const result = await apiFn();
      return { data: result, source: 'api' };
    } catch (error) {
      console.warn(`API call failed, using fallback: ${fallbackFile}`, error.message);
      
      try {
        // Load fallback dataset
        const fallbackPath = path.join(__dirname, '../../data/fallback', fallbackFile);
        const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        return { data: fallbackData, source: 'fallback' };
      } catch (fallbackError) {
        console.error(`Fallback data load failed: ${fallbackFile}`, fallbackError.message);
        throw new Error(`Both API and fallback failed: ${error.message}`);
      }
    }
  }

  static loadFallbackData(filename) {
    try {
      const filePath = path.join(__dirname, '../../data/fallback', filename);
      
      if (filename.endsWith('.csv')) {
        return this.parseCSV(fs.readFileSync(filePath, 'utf8'));
      }
      
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      console.error(`Failed to load fallback data: ${filename}`, error.message);
      return null;
    }
  }

  static parseCSV(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });
  }

  static getDatasetMetadata(filename) {
    try {
      const metadataPath = path.join(__dirname, '../../data/fallback/datasets.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      return metadata.datasets[filename] || null;
    } catch (error) {
      console.error('Failed to load dataset metadata:', error.message);
      return null;
    }
  }

  static async withFallback(apiCall, fallbackData) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn('API call failed, using provided fallback data');
      return fallbackData;
    }
  }
}

module.exports = FallbackService;