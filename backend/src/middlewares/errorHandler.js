import { ApiError } from '../utils/ApiError.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  req.log?.error(
    { err, statusCode, requestId: req.id },
    err instanceof ApiError ? 'API error' : 'Unexpected error'
  );

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 ? 'Internal Server Error' : err.message,
      requestId: req.id,
      details: err instanceof ApiError ? err.details : undefined
    }
  });
}
