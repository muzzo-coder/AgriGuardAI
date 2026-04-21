import axios from 'axios';

const API_V1_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_V1_URL,
  timeout: 10000, // 10 second timeout
});

export const getBaseURL = () => API_V1_URL;
export default api;
