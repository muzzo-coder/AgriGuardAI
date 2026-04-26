import axios from 'axios';

const API_V1_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8088';

const api = axios.create({
  baseURL: API_V1_URL,
  timeout: 60000, // 60 second timeout for LLM + translation
});

export const getBaseURL = () => API_V1_URL;
export default api;
