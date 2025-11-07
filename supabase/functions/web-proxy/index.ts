import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
      return new Response(
        JSON.stringify({ error: 'Missing url parameter' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    let body = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      body = body.replace(
        /<head>/i,
        `<head>
        <base href="${targetUrl}">
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; }
        </style>`
      );

      body = body.replace(
        /X-Frame-Options/gi,
        'X-Frame-Options-Disabled'
      );
    }

    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      if (!key.toLowerCase().includes('x-frame-options') && 
          !key.toLowerCase().includes('content-security-policy')) {
        responseHeaders.set(key, value);
      }
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch URL', 
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});