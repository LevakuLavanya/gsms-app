import https from 'node:https';
import { URL } from 'node:url';

const UPSTREAM = process.env.GSMS_API_BASE || 'https://api.gsms.app';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function planUpstream(method, pathname, query, incomingBody) {
  if (method === 'GET' && pathname === '/api/users') {
    const payload = {
      uid: Number(query.get('uid') ?? 0),
      lid: query.get('lid') != null ? Number(query.get('lid')) : null,
      pn: Number(query.get('pn') ?? 1),
      ps: Number(query.get('ps') ?? 10),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (method === 'GET' && pathname === '/api/masters') {
    const payload = { tname: query.get('tname') ?? '' };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  return { method, body: incomingBody.length ? incomingBody : null };
}

function readBody(event) {
  if (!event.body) return Buffer.alloc(0);
  return Buffer.from(
    event.body,
    event.isBase64Encoded ? 'base64' : 'utf8'
  );
}

export default async (request, context) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const subPath = context.params?.splat ?? '';
  const pathname = `/api/${subPath}`.replace(/\/+$/, '') || '/api';
  const url = new URL(request.url);
  const incomingBody = readBody({ body: await request.text(), isBase64Encoded: false });
  const { method, body } = planUpstream(request.method, pathname, url.searchParams, incomingBody);

  const upstreamUrl = new URL(pathname, UPSTREAM);
  const headers = { Accept: 'application/json' };
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = String(Buffer.byteLength(body));
  }

  return new Promise((resolve) => {
    const upstreamReq = https.request(
      {
        hostname: upstreamUrl.hostname,
        port: upstreamUrl.port || 443,
        path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
        method,
        headers,
      },
      (upstreamRes) => {
        const outHeaders = { ...CORS_HEADERS };
        const contentType = upstreamRes.headers['content-type'];
        if (contentType) outHeaders['Content-Type'] = contentType;

        const chunks = [];
        upstreamRes.on('data', (chunk) => chunks.push(chunk));
        upstreamRes.on('end', () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: upstreamRes.statusCode || 502,
              headers: outHeaders,
            })
          );
        });
      }
    );

    upstreamReq.on('error', (err) => {
      resolve(
        Response.json(
          { message: 'Upstream request failed', detail: String(err) },
          { status: 502, headers: CORS_HEADERS }
        )
      );
    });

    if (body) upstreamReq.write(body);
    upstreamReq.end();
  });
};

export const config = {
  path: '/api/*',
};
