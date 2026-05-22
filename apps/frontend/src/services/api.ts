import axios from 'axios';
import type {
  SearchRequest,
  SearchResponse,
  SearchResult,
  DebugResponse,
  DebugResult,
  ClickEvent,
  ClickstreamIngestRequest,
  ClickstreamIngestResponse,
  ItemRankResponse,
  RankRequest,
  RankResponse,
} from '../types';

// The base URL defaults to /api, which works seamlessly with Vite Proxy locally
// and NGINX/Kubernetes Ingress in production since both route /api to the API Gateway.
const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_BASE_URL || '/ml',
  timeout: 6000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for logging and JWT Injection
api.interceptors.request.use((config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  
  // Inject JWT token for Phase 2/Phase 4 Security if it exists
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn('[API] Error:', err.message);
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.error('Authentication required. Please log in.');
      // Handle redirect to Keycloak/Login here in a real app
    }
    return Promise.reject(err);
  }
);

export const searchItems = async (
  request: SearchRequest
): Promise<SearchResponse> => {
  const params: Record<string, string | number> = {};
  if (request.query?.trim()) params.q = request.query.trim();
  if (request.category?.trim()) params.category = request.category.trim();
  if (request.limit) params.limit = request.limit;

  const res = await api.get<SearchResponse>('/search', { params });
  const payload = res.data;

  const normalizedResults: SearchResult[] = (payload.results ?? []).map((item, index) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    category: item.category ?? 'unknown',
    score: Number(item.score ?? 0),
    rank: Number(item.rank ?? index + 1),
  }));

  return {
    query: payload.query,
    category: payload.category,
    totalResults: payload.totalResults ?? normalizedResults.length,
    timestamp: payload.timestamp ?? Date.now(),
    results: normalizedResults,
  };
};

export const getItemRank = async (itemId: string): Promise<ItemRankResponse> => {
  const res = await api.get<ItemRankResponse>(`/search/item/${itemId}/rank`);
  return res.data;
};

export const debugSearch = async (query: string): Promise<DebugResult[]> => {
  const res = await api.get<DebugResponse>('/search/debug', { params: { q: query } });
  return (res.data.results ?? []).map((row, index) => ({
    itemId: row.itemId,
    rank: index + 1,
    computedScore: Number(row.computedScore ?? 0),
    clickCount: Number(row.clickCount ?? 0),
    avgPosition: Number(row.avgPosition ?? 0),
    itemName: row.itemName,
    category: row.category,
  }));
};

export const postClick = async (click: ClickEvent): Promise<void> => {
  const payload: ClickstreamIngestRequest = {
    userId: click.userId,
    itemId: click.itemId,
    timestamp: click.timestamp,
  };
  await api.post<ClickstreamIngestResponse>('/clicks', payload);
};

export const postBatchClicks = async (clicks: ClickEvent[]): Promise<void> => {
  await Promise.all(clicks.map((click) => postClick(click)));
};

export const ingestClickstreamEvent = async (
  payload: ClickstreamIngestRequest
): Promise<ClickstreamIngestResponse> => {
  const res = await api.post<ClickstreamIngestResponse>('/clicks', payload);
  return res.data;
};

export const getTrendingQueries = async (): Promise<{ query: string; score: number }[]> => {
  const res = await api.get<{ query: string; score: number }[]>('/search/trending');
  return res.data;
};

export const rankItems = async (payload: RankRequest): Promise<RankResponse> => {
  const res = await mlApi.post<RankResponse>('/rank', payload);
  return res.data;
};

export default api;
