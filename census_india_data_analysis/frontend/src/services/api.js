import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getOverview = async () => {
  const response = await api.get('/overview');
  return response.data;
};

export const getDemographics = async () => {
  const response = await api.get('/demographics');
  return response.data;
};

export const getHousing = async () => {
  const response = await api.get('/housing');
  return response.data;
};

export const getWorkforce = async () => {
  const response = await api.get('/workforce');
  return response.data;
};

export const getPlotlyChart = async (chartType) => {
  const response = await api.get(`/charts/plotly/${chartType}`);
  return response.data;
};

export const askQuestion = async (question) => {
  const response = await api.post('/qa', { question });
  return response.data;
};

export const getStates = async () => {
  const response = await api.get('/states');
  return response.data;
};

export const getStateDetails = async (stateName) => {
  const response = await api.get(`/state/${encodeURIComponent(stateName)}`);
  return response.data;
};

export default api;
