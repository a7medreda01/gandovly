const API = 'https://mecart.app/api/v1';
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function imageUrl(value, origin) {
  if (!value) return null;
  try { const url = new URL(value, origin); return /^https?:$/.test(url.protocol) ? url.href : null; } catch { return null; }
}

// Social crawlers do not execute Angular. Resolve the same public tenant data server-side.
export async function preview(request, fetcher = fetch) {
  const host = String(request.headers.host || '').toLowerCase();
  if (!/^[a-z0-9.-]+(?::\d+)?$/.test(host)) return {status:400,html:'Invalid host'};
  const origin = 'https://' + host;
  const query = new URL(request.url, origin).searchParams;
  const pathId = query.get('id');
  const productId = pathId || query.get('product');
  if (productId && !/^[1-9]\d*$/.test(productId)) return {status:404,html:'Product not found'};
  let slug = host.endsWith('.mecart.app') && host !== 'www.mecart.app' ? host.slice(0,-11) : query.get('tenant');
  if (slug && !/^[a-z0-9-]+$/.test(slug)) return {status:404,html:'Store not found'};
  if (!slug && !['mecart.app','www.mecart.app'].includes(host)) {
    try { const resolved=await fetcher(API+'/public/store-domain?host='+encodeURIComponent(host),{signal:AbortSignal.timeout(12000)}); if(!resolved.ok) return {status:404,html:'Store not found'}; slug=(await resolved.json()).data?.slug; if(!slug)return {status:404,html:'Store not found'}; } catch { return {status:503,html:'Preview unavailable'}; }
  }
  // Custom-domain API requests pass through that domain's existing frontend proxy.
  const base = slug ? API : origin + '/api/v1';
  async function get(path) {
    const response = await fetcher(base + path, {headers:slug ? {'X-Tenant-Slug':slug} : {}, signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw Object.assign(new Error('Public data unavailable'), {status:response.status});
    const body = await response.json();
    if (!body.data) throw new Error('Public data unavailable');
    return body.data;
  }
  try {
    const [settings, product] = await Promise.all([get('/storefront/settings'), productId ? get('/storefront/products/' + productId) : null]);
    const name = settings.restaurantName || 'المتجر';
    const title = product?.nameAr || name;
    const description = product?.description || settings.description || settings.tagline || name;
    const image = imageUrl(product?.imageUrl || settings.logoUrl || settings.heroBannerDesktopUrl || settings.heroBannerMobileUrl, origin);
    const canonical = new URL(productId ? '/product/' + productId : '/', origin);
    if (query.get('tenant')) canonical.searchParams.set('tenant', query.get('tenant'));
    const tags = {'og:type':product ? 'product':'website','og:title':title,'og:site_name':name,'og:description':description,'og:url':canonical.href,'og:locale':'ar_EG',...(image?{'og:image':image,'og:image:alt':title}:{})};
    const html = '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>'+escape(title)+'</title><meta name="description" content="'+escape(description)+'"><link rel="canonical" href="'+escape(canonical.href)+'">'+Object.entries(tags).map(([key,value])=>'<meta property="'+key+'" content="'+escape(value)+'">').join('')+'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+escape(title)+'">'+(image?'<meta name="twitter:image" content="'+escape(image)+'">':'')+'</head><body><h1>'+escape(title)+'</h1><p>'+escape(description)+'</p><a href="'+escape(canonical.href)+'">فتح المتجر</a></body></html>';
    return {status:200,html};
  } catch (error) { return {status:error.status===404?404:503,html:'<!doctype html><html lang="ar"><meta charset="utf-8"><title>المتجر</title><p>تعذر تحميل المعاينة، يرجى المحاولة لاحقًا.</p></html>'}; }
}
export default async function handler(request,response) {
  const result=await preview(request);
  response.setHeader('Content-Type','text/html; charset=utf-8');
  response.setHeader('Cache-Control','private, no-store');
  response.setHeader('Vary','User-Agent, Host');
  response.status(result.status).send(result.html);
}
