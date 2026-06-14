import https from 'node:https';
import { URL } from 'node:url';

const UPSTREAM = process.env.GSMS_API_BASE || 'https://api.gsms.app';

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', () => resolve(Buffer.alloc(0)));
  });
}

function planUpstream(req, pathname, query, incomingBody) {
  if (req.method === 'GET' && pathname === '/api/users') {
    const payload = {
      uid: Number(query.get('uid') ?? 0),
      lid: query.get('lid') != null ? Number(query.get('lid')) : null,
      pn: Number(query.get('pn') ?? 1),
      ps: Number(query.get('ps') ?? 10),
    };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  if (req.method === 'GET' && pathname === '/api/masters') {
    const payload = { tname: query.get('tname') ?? '' };
    return { method: 'GET', body: Buffer.from(JSON.stringify(payload)) };
  }

  return { method: req.method, body: incomingBody.length ? incomingBody : null };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const slug = req.query.path;
  const subPath = Array.isArray(slug) ? slug.join('/') : slug || '';
  const pathname = `/api/${subPath}`.replace(/\/+$/, '') || '/api';
  const query = new URL(req.url || '', 'http://localhost').searchParams;
  const incomingBody = await readBody(req);
  const { method, body } = planUpstream(req, pathname, query, incomingBody);

  const upstreamUrl = new URL(pathname, UPSTREAM);
  const headers = { Accept: 'application/json' };
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  await new Promise((resolve) => {
    const upstreamReq = https.request(
      {
        hostname: upstreamUrl.hostname,
        port: upstreamUrl.port || 443,
        path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
        method,
        headers,
      },
      (upstreamRes) => {
        res.status(upstreamRes.statusCode || 502);
        const contentType = upstreamRes.headers['content-type'];
        if (contentType) res.setHeader('Content-Type', contentType);
        upstreamRes.pipe(res);
        upstreamRes.on('end', resolve);
      }
    );

    upstreamReq.on('error', (err) => {
      res.status(502).json({ message: 'Upstream request failed', detail: String(err) });
      resolve();
    });

    if (body) upstreamReq.write(body);
    upstreamReq.end();
  });
}
