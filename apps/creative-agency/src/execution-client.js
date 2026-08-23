const DEFAULT_BASE = 'http://127.0.0.1:8787';

export function executionApiBase() {
  if (window.__CREATIVE_AGENCY_EXECUTION_API__) return window.__CREATIVE_AGENCY_EXECUTION_API__;
  const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  if (localHost && window.location.pathname.startsWith('/preview/')) return window.location.origin;
  return DEFAULT_BASE;
}

async function request(path, options = {}) {
  const response = await fetch(`${executionApiBase()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error ?? `Execution API ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export async function getExecutionStatus() {
  return request('/api/status');
}

export async function getCreativeWorldCatalog(projectId) {
  return request(`/api/creative-projects/${encodeURIComponent(projectId)}/creative-worlds`);
}

export async function startExecution({
  projectId = 'creative-agency',
  creativeProjectId,
  iteration = 0,
  selectedCreativeWorldId,
  creativeWorldCatalogVersion
} = {}) {
  return request('/api/executions', {
    method: 'POST',
    body: JSON.stringify({
      projectId,
      creativeProjectId,
      iteration,
      selectedCreativeWorldId,
      creativeWorldCatalogVersion
    })
  });
}

export async function getExecution(id) {
  return request(`/api/executions/${encodeURIComponent(id)}`);
}

export async function approveExecution(id) {
  return request(`/api/executions/${encodeURIComponent(id)}/approve`, { method: 'POST', body: '{}' });
}
