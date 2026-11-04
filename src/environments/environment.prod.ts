export const environment = {
  production: true,
  apiUrl: typeof window !== 'undefined' && window.location.hostname.includes('supermarket1.runasp.net')
    ? '/api/v1'
    : 'https://supermarket1.runasp.net/api/v1'
};
