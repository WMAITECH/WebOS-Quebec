import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function rewriteUrl(url: string, baseUrl: string, proxyBase: string): string {
  try {
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('javascript:')) {
      return url;
    }

    let absoluteUrl: string;
    if (url.startsWith('//')) {
      absoluteUrl = new URL(baseUrl).protocol + url;
    } else if (url.startsWith('/')) {
      const base = new URL(baseUrl);
      absoluteUrl = base.origin + url;
    } else if (url.startsWith('http')) {
      absoluteUrl = url;
    } else {
      absoluteUrl = new URL(url, baseUrl).href;
    }

    return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
  } catch {
    return url;
  }
}

function rewriteHtml(html: string, targetUrl: string, proxyBase: string): string {
  let rewritten = html;

  rewritten = rewritten.replace(/href=["']([^"']+)["']/gi, (match, url) => {
    if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('data:')) {
      return match;
    }
    return `href="${rewriteUrl(url, targetUrl, proxyBase)}"`;
  });

  rewritten = rewritten.replace(/src=["']([^"']+)["']/gi, (match, url) => {
    if (url.startsWith('data:')) {
      return match;
    }
    return `src="${rewriteUrl(url, targetUrl, proxyBase)}"`;
  });

  rewritten = rewritten.replace(/action=["']([^"']+)["']/gi, (match, url) => {
    if (url.startsWith('javascript:')) {
      return match;
    }
    return `action="${rewriteUrl(url, targetUrl, proxyBase)}"`;
  });

  rewritten = rewritten.replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
    if (url.startsWith('data:') || url.startsWith('#')) {
      return match;
    }
    return `url(${rewriteUrl(url, targetUrl, proxyBase)})`;
  });

  const baseTag = `<base href="${targetUrl}">`;
  if (/<head[^>]*>/i.test(rewritten)) {
    rewritten = rewritten.replace(/<head[^>]*>/i, (match) => `${match}\n${baseTag}`);
  } else {
    rewritten = baseTag + rewritten;
  }

  const metaTag = '<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">';
  if (/<head[^>]*>/i.test(rewritten)) {
    rewritten = rewritten.replace(/<head[^>]*>/i, (match) => `${match}\n${metaTag}`);
  }

  return rewritten;
}

function rewriteCss(css: string, targetUrl: string, proxyBase: string): string {
  return css.replace(/url\(["']?([^"')]+)["']?\)/gi, (match, url) => {
    if (url.startsWith('data:') || url.startsWith('#')) {
      return match;
    }
    return `url(${rewriteUrl(url, targetUrl, proxyBase)})`;
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      const errorHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Erreur Proxy</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.error{background:white;padding:48px;border-radius:16px;max-width:500px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{color:#dc2626;margin:0 0 16px;font-size:24px}p{color:#6b7280;margin:0;line-height:1.6}</style>
</head><body><div class="error"><h1>Erreur de proxy</h1><p>Paramètre URL manquant</p></div></body></html>`;
      return new Response(errorHtml, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const proxyBase = url.origin + url.pathname;

    let processedBody: string | ArrayBuffer;

    if (contentType.includes('text/html')) {
      const body = await response.text();
      processedBody = rewriteHtml(body, targetUrl, proxyBase);
    } else if (contentType.includes('text/css')) {
      const body = await response.text();
      processedBody = rewriteCss(body, targetUrl, proxyBase);
    } else if (contentType.includes('javascript')) {
      processedBody = await response.text();
    } else {
      processedBody = await response.arrayBuffer();
    }

    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.includes('x-frame-options') &&
          !lowerKey.includes('content-security-policy') &&
          !lowerKey.includes('strict-transport-security')) {
        responseHeaders.set(key, value);
      }
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    if (typeof processedBody === 'string') {
      responseHeaders.set('Content-Type', contentType || 'text/html; charset=utf-8');
    }

    return new Response(processedBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);

    const errorHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Erreur de chargement</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.error{background:white;padding:48px;border-radius:16px;max-width:600px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)}h1{color:#dc2626;margin:0 0 16px;font-size:24px}p{color:#6b7280;margin:0 0 16px;line-height:1.6}.details{background:#f3f4f6;padding:16px;border-radius:8px;margin-top:16px;font-family:monospace;font-size:12px;color:#1f2937;text-align:left;word-break:break-all}button{padding:12px 24px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;margin-top:16px}</style>
</head><body><div class="error"><h1>Impossible de charger le site</h1><p>Le site demandé n'a pas pu être chargé via le proxy.</p><div class="details">${error.message || 'Erreur inconnue'}</div><button onclick="history.back()">← Retour</button></div></body></html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
});