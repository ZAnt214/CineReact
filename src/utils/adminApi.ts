import { apiFetch } from './apiClient.ts';

export function adminFetch(
  _adminEmail: string,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return apiFetch(url, options);
}
