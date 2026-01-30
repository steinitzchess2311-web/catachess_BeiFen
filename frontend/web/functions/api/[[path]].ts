/**
 * Cloudflare Pages Function to proxy all /api/* requests to api.catachess.com
 *
 * This function intercepts requests to /api/* and forwards them to the backend API.
 * The [[path]] syntax matches all paths under /api/
 */

export async function onRequest(context: any) {
  const { request } = context;
  const url = new URL(request.url);

  // Build the target URL by replacing the host
  const targetUrl = `https://api.catachess.com${url.pathname}${url.search}`;

  console.log(`[Cloudflare Function] Proxying: ${url.pathname} -> ${targetUrl}`);

  // Create a new request with the same method, headers, and body
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow',
  });

  try {
    // Forward the request to the backend API
    const response = await fetch(modifiedRequest);

    // Clone the response to modify headers if needed
    const modifiedResponse = new Response(response.body, response);

    // Add CORS headers if needed
    modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
    modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log(`[Cloudflare Function] Response: ${response.status} ${response.statusText}`);

    return modifiedResponse;
  } catch (error) {
    console.error(`[Cloudflare Function] Error proxying request:`, error);
    return new Response(JSON.stringify({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
