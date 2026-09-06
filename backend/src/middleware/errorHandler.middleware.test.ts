import { errorHandlerMiddleware } from './errorHandler.middleware';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { mockRequest, mockResponse, mockNext } from '../test/helpers';

describe('errorHandlerMiddleware', () => {
  describe('operational AppErrors', () => {
    it('returns correct status and code for UnauthorizedError', () => {
      const err = new UnauthorizedError('Token expired');
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();

      errorHandlerMiddleware(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, code: 'ERR_UNAUTHORIZED', message: 'Token expired' })
      );
    });

    it('returns 403 for ForbiddenError', () => {
      const err = new ForbiddenError();
      const res = mockResponse();
      errorHandlerMiddleware(err, mockRequest(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ERR_FORBIDDEN' }));
    });

    it('returns 404 for NotFoundError', () => {
      const err = new NotFoundError('Post', 'ERR_POST_NOT_FOUND');
      const res = mockResponse();
      errorHandlerMiddleware(err, mockRequest(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'ERR_POST_NOT_FOUND' }));
    });

    it('includes details field when provided', () => {
      const err = new ValidationError('invalid', { title: ['required'] });
      const res = mockResponse();
      errorHandlerMiddleware(err, mockRequest(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(400);
      const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
      expect(body.details).toEqual({ title: ['required'] });
    });

    it('does not include details when not provided', () => {
      const err = new ForbiddenError();
      const res = mockResponse();
      errorHandlerMiddleware(err, mockRequest(), res, mockNext());
      const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
      expect(body).not.toHaveProperty('details');
    });
  });

  describe('non-operational errors', () => {
    it('returns 500 with generic ERR_INTERNAL for plain Error', () => {
      const err = new Error('unexpected crash');
      const res = mockResponse();
      errorHandlerMiddleware(err, mockRequest(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'ERR_INTERNAL', success: false })
      );
    });

    it('does not expose stack trace in response', () => {
      const err = new Error('crash with stack');
      const res = mockResponse();
      errorHandlerMiddleware(err, mockRequest(), res, mockNext());
      const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
      expect(body).not.toHaveProperty('stack');
    });

    it('returns 500 for non-operational AppError', () => {
      const err = new AppError('crash', 500, 'ERR_INTERNAL', undefined, false);
      const res = mockResponse();
      errorHandlerMiddleware(err, mockRequest(), res, mockNext());
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('response shape', () => {
    it('always includes success: false', () => {
      const res = mockResponse();
      errorHandlerMiddleware(new UnauthorizedError(), mockRequest(), res, mockNext());
      const body = (res.json as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
      expect(body.success).toBe(false);
    });
  });
});
