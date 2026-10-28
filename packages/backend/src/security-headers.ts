import type { IncomingMessage, ServerResponse } from 'http';
import helmet from 'helmet';

// Swagger UI mount path, as SwaggerModule.setup takes it (no leading slash).
export const SWAGGER_PATH = 'api/docs';

type Middleware = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void;

// Helmet with its default Content-Security-Policy on every route. The Swagger UI page and its
// assets drop only upgrade-insecure-requests: over plain HTTP on a LAN address the browser
// upgrades Swagger's scripts to https:// and the page stays blank.
export function securityHeaders(): Middleware {
  const appHeaders = helmet();
  const docsHeaders = helmet({
    contentSecurityPolicy: {
      directives: { 'upgrade-insecure-requests': null },
    },
  });
  const docsPath = `/${SWAGGER_PATH}`;

  return (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];
    const isDocs = path === docsPath || path.startsWith(`${docsPath}/`);
    return isDocs ? docsHeaders(req, res, next) : appHeaders(req, res, next);
  };
}
