import axios from 'axios';

const API_BASE_URL = '/api';

export const formatMediaUrl = (pathStr) => {
  if (!pathStr) return '';
  // Handle Windows absolute paths or missing slashes
  const path = String(pathStr).replace(/\\/g, '/');
  const match = path.match(/(uploads|outputs|evidence)\/(.+)/);
  if (match) {
    return `/${match[1]}/${match[2]}`;
  }
  return path.startsWith('/') ? path : `/${path}`;
};

export const api = {
  // Stats overview for dashboard
  getStats: async () => {
    const response = await axios.get(`${API_BASE_URL}/stats`);
    return response.data;
  },

  // Records list with optional filters
  getRecords: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/records`, { params });
    return response.data;
  },

  // Single record detail
  getRecordDetail: async (detectionId) => {
    const response = await axios.get(`${API_BASE_URL}/records/${detectionId}`);
    return response.data;
  },

  // Delete single record
  deleteRecord: async (detectionId) => {
    const response = await axios.delete(`${API_BASE_URL}/records/${detectionId}`);
    return response.data;
  },

  // Process single or multiple images
  uploadImages: async (files, confThreshold = 0.25, roadName = "Highway Sector A-1") => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('conf_threshold', confThreshold);
    formData.append('road_name', roadName);

    const response = await axios.post(`${API_BASE_URL}/detect/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Process video
  uploadVideo: async (file, confThreshold = 0.25, roadName = "Highway Sector A-1", onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conf_threshold', confThreshold);
    formData.append('road_name', roadName);

    const response = await axios.post(`${API_BASE_URL}/detect/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return response.data;
  },

  // Get PDF Report URL
  getPdfReportUrl: (detectionId) => {
    return `${API_BASE_URL}/reports/pdf/${detectionId}`;
  }
};
