// Cliente de API — wrapper fino sobre fetch, centralizando:
// - base URL (via proxy do Vite em dev, mesma origem em produção)
// - anexação do token de admin quando presente
// - tratamento consistente de erros vindos do backend

const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(typeof body === 'object' && body && 'erro' in body ? String((body as any).erro) : 'Erro na requisição');
    this.status = status;
    this.body = body;
  }
}

function getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = resposta.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await resposta.json() : null;

  if (!resposta.ok) {
    throw new ApiError(resposta.status, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = false) => request<T>(path, { method: 'POST', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = false) => request<T>(path, { method: 'PATCH', body, auth }),
};

export { ApiError, getAdminToken };
