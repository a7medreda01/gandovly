export function isPlatformContext(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('tenant') || params.has('store')) return false;
  return ['localhost', '127.0.0.1', 'mecart.app', 'www.mecart.app'].includes(window.location.hostname.toLowerCase());
}
