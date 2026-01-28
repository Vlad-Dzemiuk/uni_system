import pinoHttp from 'pino-http';
import { logger } from './index.js';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || cryptoRandomId(),
  customProps: (req) => ({
    requestId: req.id
  }),
  serializers: {
    req(req) {
      return { id: req.id, method: req.method, url: req.url };
    },
    res(res) {
      return { statusCode: res.statusCode };
    }
  }
});

function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
