// Cliente de API — wrapper fino sobre fetch, centralizando:
// - base URL (via proxy do Vite em dev, mesma origem em produção)
// - anexação do token de admin ou de cliente quando presente
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

function getClienteToken(): string | null {
  return localStorage.getItem('cliente_token');
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; authCliente?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = false, authCliente = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } else if (authCliente) {
    const token = getClienteToken();
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
  get: <T>(path: string, auth = false, authCliente = false) => request<T>(path, { method: 'GET', auth, authCliente }),
  post: <T>(path: string, body?: unknown, auth = false, authCliente = false) =>
    request<T>(path, { method: 'POST', body, auth, authCliente }),
  patch: <T>(path: string, body?: unknown, auth = false, authCliente = false) =>
    request<T>(path, { method: 'PATCH', body, auth, authCliente }),
  put: <T>(path: string, body?: unknown, auth = false, authCliente = false) =>
    request<T>(path, { method: 'PUT', body, auth, authCliente }),
  delete: <T>(path: string, auth = false, authCliente = false) =>
    request<T>(path, { method: 'DELETE', auth, authCliente }),
};

export { ApiError, getAdminToken, getClienteToken };
