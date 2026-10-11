export const FASTAPI_BASE_URL =
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  'https://oumalya-api.fastapicloud.dev';

export function getFastApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${FASTAPI_BASE_URL}${cleanPath}`;
}
