import path from 'node:path'
import url from 'node:url'

export default {
  path: path.dirname(url.fileURLToPath(import.meta.url)) + '/../',
  title: 'VPWA Chat API',
  version: '1.0.0',
  description: 'API documentation for the VPWA Chat application',
  tagIndex: 2,
  productionEnv: 'production',
  info: {
    title: 'VPWA Chat API',
    version: '1.0.0',
    description: 'API documentation for the VPWA Chat application',
  },
  snakeCase: true,
  debug: false,
  ignore: ['/swagger', '/docs'],
  preferredPutPatch: 'PUT',
  common: {
    parameters: {},
    headers: {},
  },
  securitySchemes: {},
  authMiddlewares: ['auth', 'auth:api'],
  defaultSecurityScheme: 'BearerAuth',
  persistAuthorization: true,
  showFullPath: false,
}