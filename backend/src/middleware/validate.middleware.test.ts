import { z } from 'zod';
import { validate, validateAll } from './validate.middleware';
import { ValidationError } from '../utils/errors';
import { mockRequest, mockResponse, mockNext } from '../test/helpers';

const TestSchema = z.object({
  title: z.string().min(3).max(100),
  count: z.coerce.number().int().positive().optional(),
});

describe('validate middleware', () => {
  describe('body validation (default)', () => {
    it('passes valid body through and coerces types', () => {
      const req = mockRequest({ body: { title: 'hello world', count: '5' } });
      const next = mockNext();
      validate(TestSchema)(req, mockResponse(), next);

      expect(next).toHaveBeenCalledWith(); // called with no args = pass
      expect(req.body.count).toBe(5); // coerced from string to number
    });

    it('calls next with ValidationError for invalid body', () => {
      const req = mockRequest({ body: { title: 'ab' } }); // too short
      const next = mockNext();
      validate(TestSchema)(req, mockResponse(), next);

      expect(next).toHaveBeenCalledTimes(1);
      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
      expect(err.code).toBe('ERR_VALIDATION');
    });

    it('includes field-level error details', () => {
      const req = mockRequest({ body: { title: 'x' } });
      const next = mockNext();
      validate(TestSchema)(req, mockResponse(), next);

      const err = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      expect(err.details).toBeDefined();
      const details = err.details as Record<string, string[]>;
      expect(details['title']).toBeDefined();
    });

    it('returns _root key for top-level errors', () => {
      const ScalarSchema = z.string().min(5);
      const req = mockRequest({ body: 'ab' });
      const next = mockNext();
      validate(ScalarSchema)(req, mockResponse(), next);

      const err = (next as jest.Mock).mock.calls[0][0] as ValidationError;
      const details = err.details as Record<string, string[]>;
      expect(details['_root']).toBeDefined();
    });

    it('passes empty body if schema allows it', () => {
      const OptionalSchema = z.object({ name: z.string().optional() });
      const req = mockRequest({ body: {} });
      const next = mockNext();
      validate(OptionalSchema)(req, mockResponse(), next);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('query validation', () => {
    const QuerySchema = z.object({ page: z.coerce.number().default(1) });

    it('validates req.query when part is "query"', () => {
      const req = mockRequest({ query: { page: '3' } as never });
      const next = mockNext();
      validate(QuerySchema, 'query')(req, mockResponse(), next);
      expect(next).toHaveBeenCalledWith();
      expect((req.query as Record<string, unknown>).page).toBe(3);
    });

    it('rejects invalid query', () => {
      const req = mockRequest({ query: { page: 'abc' } as never });
      const next = mockNext();
      validate(QuerySchema, 'query')(req, mockResponse(), next);
      const err = (next as jest.Mock).mock.calls[0][0];
      expect(err).toBeInstanceOf(ValidationError);
    });
  });

  describe('params validation', () => {
    const ParamsSchema = z.object({ id: z.string().min(1) });

    it('validates req.params when part is "params"', () => {
      const req = mockRequest({ params: { id: 'abc123' } as never });
      const next = mockNext();
      validate(ParamsSchema, 'params')(req, mockResponse(), next);
      expect(next).toHaveBeenCalledWith();
    });
  });
});

describe('validateAll middleware', () => {
  it('validates body and query together, passing both', () => {
    const BodySchema = z.object({ text: z.string().min(1) });
    const QuerySchema = z.object({ page: z.coerce.number().default(1) });
    const req = mockRequest({ body: { text: 'hello' }, query: { page: '2' } as never });
    const next = mockNext();

    validateAll({ body: BodySchema, query: QuerySchema })(req, mockResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body.text).toBe('hello');
  });

  it('collects errors from all failing parts', () => {
    const BodySchema = z.object({ text: z.string().min(10) });
    const QuerySchema = z.object({ page: z.coerce.number() });
    const req = mockRequest({ body: { text: 'short' }, query: { page: 'bad' } as never });
    const next = mockNext();

    validateAll({ body: BodySchema, query: QuerySchema })(req, mockResponse(), next);

    const err = (next as jest.Mock).mock.calls[0][0] as ValidationError;
    expect(err).toBeInstanceOf(ValidationError);
    const details = err.details as Record<string, unknown>;
    expect(details['body']).toBeDefined();
    expect(details['query']).toBeDefined();
  });
});
