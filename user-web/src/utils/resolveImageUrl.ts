/**
 * Resolves an image/media path into a full URL.
 * It uses VITE_API_URL to determine the base domain.
 */
export const resolveImageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;

  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Remove /api or /api/ suffix to get the base domain
  const baseUrl = rawApiUrl.replace(/\/api\/?$/, '');
  
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
