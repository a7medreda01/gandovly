import { environment } from '../../../environments/environment';

export function isPlatformHost(host: string): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === 'mecart.app' ||
    h === 'www.mecart.app' ||
    h.endsWith('.vercel.app') ||
    h.includes('vercel.app')
  );
}

export function isPlatformContext(): boolean {
  if (environment.standalone) return false;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('tenant') || params.has('store')) return false;
  return isPlatformHost(window.location.hostname);
}

/**
 * Checks if the current visitor is on a Tenant Subdomain
 * e.g. rokn-dar.mecart.app, super.mecart.app, or testing via ?tenant=xyz
 */
export function isTenantSubdomain(): boolean {
  if (environment.standalone) return true;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  const search = window.location.search.toLowerCase();

  // Test / preview parameter
  if (search.includes('tenant=') || search.includes('store=')) {
    return true;
  }

  // Any tenant subdomain on mecart.app (e.g. rokn-dar.mecart.app, super.mecart.app, etc.) except www and apex
  if (host.endsWith('.mecart.app')) {
    const sub = host.replace('.mecart.app', '');
    if (sub !== 'www' && sub !== '' && sub !== 'mecart') {
      return true;
    }
  }

  // If this is a platform host (mecart.app, vercel.app, localhost), it is the platform landing/admin, not a tenant subdomain
  if (isPlatformHost(host)) {
    return false;
  }

  return true;
}
