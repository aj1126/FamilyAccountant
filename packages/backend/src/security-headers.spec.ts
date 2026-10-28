import type { IncomingMessage, ServerResponse } from 'http';
import { securityHeaders } from './security-headers';

function headersFor(url: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const res = {
    setHeader: (name: string, value: string) => {
      headers[name.toLowerCase()] = String(value);
    },
    removeHeader: (name: string) => {
      delete headers[name.toLowerCase()];
    },
  } as unknown as ServerResponse;
  const req = { url, method: 'GET', headers: {} } as unknown as IncomingMessage;
  const next = jest.fn();
  securityHeaders()(req, res, next);
  expect(next).toHaveBeenCalledTimes(1);
  return headers;
}

describe('securityHeaders', () => {
  it('sends the default CSP, upgrade-insecure-requests included, on API routes', () => {
    const csp = headersFor('/api/accounts')['content-security-policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('drops only upgrade-insecure-requests on the Swagger UI page and its assets', () => {
    for (const url of ['/api/docs', '/api/docs/', '/api/docs/swagger-ui-init.js', '/api/docs?x=1']) {
      const csp = headersFor(url)['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self'");
      expect(csp).not.toContain('upgrade-insecure-requests');
    }
  });

  it('treats look-alike paths as API routes', () => {
    for (const url of ['/api/docsx', '/api/docs-json']) {
      expect(headersFor(url)['content-security-policy']).toContain('upgrade-insecure-requests');
    }
  });

  it('keeps frame protection on every route', () => {
    for (const url of ['/api/accounts', '/api/docs']) {
      const headers = headersFor(url);
      expect(headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(headers['content-security-policy']).toContain("frame-ancestors 'self'");
    }
  });
});
