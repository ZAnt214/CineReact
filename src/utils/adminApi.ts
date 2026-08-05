export function adminFetch(
  adminEmail: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('X-Admin-Email', adminEmail);

  let finalUrl = url;
  let body = options.body;
  const method = (options.method || 'GET').toUpperCase();

  if (method === 'GET' || method === 'HEAD') {
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}adminEmail=${encodeURIComponent(adminEmail)}`;
  } else if (body && typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      parsed.adminEmail = adminEmail;
      body = JSON.stringify(parsed);
    } catch {
      // mantém body original
    }
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  } else if (!body && method !== 'GET' && method !== 'HEAD') {
    body = JSON.stringify({ adminEmail });
    headers.set('Content-Type', 'application/json');
  }

  return fetch(finalUrl, { ...options, headers, body });
}
