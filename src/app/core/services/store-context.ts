import { environment } from '../../../environments/environment';

export function isPlatformContext(): boolean {
  if (environment.standalone) return false;
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.has('tenant') || params.has('store')) return false;
  return ['localhost', '127.0.0.1', 'mecart.app', 'www.mecart.app'].includes(window.location.hostname.toLowerCase());
}

/**
 * Checks if the current visitor is on a Tenant Subdomain
 * e.g. super.mecart.app, or testing via ?tenant=super
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

  // Subdomain: super.mecart.app or backend direct URL
  if (host.startsWith('super.') || host.includes('supermarket1.runasp.net')) {
    return true;
  }

  // Any tenant subdomain on mecart.app (e.g. albaraka.mecart.app, etc.) except www and apex
  if (host.endsWith('.mecart.app')) {
    const sub = host.replace('.mecart.app', '');
    if (sub !== 'www' && sub !== '' && sub !== 'mecart') {
      return true;
    }
  }

  return !['localhost', '127.0.0.1', 'mecart.app', 'www.mecart.app'].includes(host);
}
