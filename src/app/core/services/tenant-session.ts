import { environment } from '../../../environments/environment';

export function adminSessionKey(): string {
  if (environment.standalone) return 'gendofly_admin_session:standalone';
  if (typeof window === 'undefined') return 'gendofly_admin_session';
  const host = window.location.hostname.toLowerCase();
  const slug = host.endsWith('.mecart.app') && host !== 'www.mecart.app'
    ? host.slice(0, -'.mecart.app'.length) : new URLSearchParams(window.location.search).get('tenant');
  return 'gendofly_admin_session' + (slug ? ':' + slug : '');
}

export function customerSessionKey(base: string): string { return base + adminSessionKey().slice('gendofly_admin_session'.length); }
