import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://borlette-backend-web-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Ajouter le token automatiquement
api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('borlette_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Gérer les erreurs 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('borlette_token');
        localStorage.removeItem('borlette_user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// ── FONCTIONS AUTH ────────────────────────────────────────────
export const loginApi = (data) => api.post('/api/auth/login', data);
export const registerApi = (data) => api.post('/api/auth/register', data);

// ── AGENTS ───────────────────────────────────────────────────
export const getAgents      = ()     => api.get('/api/admin/agents');
export const createAgent    = (data) => api.post('/api/admin/agents', data);
export const updateAgent    = (id, data) => api.put(`/api/admin/agents/${id}`, data);
export const deleteAgent    = (id)   => api.delete(`/api/admin/agents/${id}`);
export const toggleAgent    = (id)   => api.put(`/api/admin/agents/${id}/toggle`);

// ── TIRAGES ──────────────────────────────────────────────────
export const getTirages     = ()     => api.get('/api/tirages/disponibles');
export const getAllTirages   = ()     => api.get('/api/admin/tirages');
export const createTirage   = (data) => api.post('/api/admin/tirages', data);
export const updateTirage   = (id, data) => api.put(`/api/admin/tirages/${id}`, data);
export const deleteTirage   = (id)   => api.delete(`/api/admin/tirages/${id}`);

// ── FICHES ───────────────────────────────────────────────────
export const getFiches      = (params) => api.get('/api/admin/fiches', { params });
export const searchFiche    = (ticket) => api.get(`/api/fiches/${ticket}`);
export const eliminerFiche  = (ticket) => api.delete(`/api/fiches/${ticket}`);
export const getFichesEliminees = (params) => api.get('/api/rapport/eliminer', { params });
export const getFichesGagnantes = (params) => api.get('/api/rapport/gagnant', { params });

// ── RAPPORTS ─────────────────────────────────────────────────
export const getRapportPartiel  = (params) => api.get('/api/rapport/partiel', { params });
export const getRapportTirage   = (params) => api.get('/api/rapport/tirage', { params });
export const getRapportJournalier = (params) => api.get('/api/rapport/journalier', { params });
export const getStatistiques    = (params) => api.get('/api/rapport/statistiques', { params });
export const getTransactions    = (params) => api.get('/api/rapport/transactions', { params });

// ── ADMIN ────────────────────────────────────────────────────
export const getStats       = ()     => api.get('/api/admin/stats');
export const getPrimes      = ()     => api.get('/api/admin/primes');
export const updatePrimes   = (data) => api.put('/api/admin/primes', data);
export const getLimites     = ()     => api.get('/api/admin/limites');
export const updateLimites  = (data) => api.put('/api/admin/limites', data);
export const getResultats   = ()     => api.get('/api/admin/resultats');
export const addResultat    = (data) => api.post('/api/admin/resultats', data);
export const deleteResultat = (id)   => api.delete(`/api/admin/resultats/${id}`);
export const addPaiement    = (data) => api.post('/api/admin/paiement', data);
export const getPOS         = ()     => api.get('/api/admin/pos');
export const addPOS         = (data) => api.post('/api/admin/pos', data);
export const deletePOS      = (id)   => api.delete(`/api/admin/pos/${id}`);

export default api;
export { API_URL };
