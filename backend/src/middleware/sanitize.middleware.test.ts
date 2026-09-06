import { sanitizeBody, sanitizeString } from './sanitize.middleware';
import { mockRequest, mockResponse, mockNext } from '../test/helpers';

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<b>bold</b>')).toBe('bold');
    expect(sanitizeString('<script>alert(1)</script>')).toBe('alert(1)');
    expect(sanitizeString('<img src=x onerror=alert(1)>')).toBe('');
  });

  it('strips nested and malformed tags', () => {
    expect(sanitizeString('<p><strong>text</strong></p>')).toBe('text');
    expect(sanitizeString('hello <br/> world')).toBe('hello  world'.replace('  ', ' ')); // single space after collapse
  });

  it('collapses multiple newlines to two', () => {
    expect(sanitizeString('a\n\n\n\nb')).toBe('a\n\nb');
    expect(sanitizeString('a\n\nb')).toBe('a\n\nb'); // already two — unchanged
  });

  it('collapses multiple spaces and tabs', () => {
    expect(sanitizeString('a   b')).toBe('a b');
    expect(sanitizeString('a\t\tb')).toBe('a b');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
    expect(sanitizeString('\n\nhello\n\n')).toBe('hello');
  });

  it('preserves normal text unchanged', () => {
    const text = 'This is a normal post.\n\nWith two paragraphs.';
    expect(sanitizeString(text)).toBe(text);
  });

  it('handles empty string', () => {
    expect(sanitizeString('')).toBe('');
  });
});

describe('sanitizeBody middleware', () => {
  it('sanitizes string fields in req.body', () => {
    const req = mockRequest({ body: { content: '<b>hello</b>' } });
    const next = mockNext();
    sanitizeBody(req, mockResponse(), next);
    expect(req.body.content).toBe('hello');
    expect(next).toHaveBeenCalledWith();
  });

  it('sanitizes nested objects', () => {
    const req = mockRequest({ body: { meta: { title: '<h1>Title</h1>' } } });
    const next = mockNext();
    sanitizeBody(req, mockResponse(), next);
    expect(req.body.meta.title).toBe('Title');
  });

  it('sanitizes strings inside arrays', () => {
    const req = mockRequest({ body: { tags: ['<em>one</em>', 'two'] } });
    const next = mockNext();
    sanitizeBody(req, mockResponse(), next);
    expect(req.body.tags).toEqual(['one', 'two']);
  });

  it('leaves numbers and booleans untouched', () => {
    const req = mockRequest({ body: { count: 5, active: true } });
    const next = mockNext();
    sanitizeBody(req, mockResponse(), next);
    expect(req.body.count).toBe(5);
    expect(req.body.active).toBe(true);
  });

  it('leaves null body untouched and calls next', () => {
    const req = mockRequest({ body: null });
    const next = mockNext();
    expect(() => sanitizeBody(req, mockResponse(), next)).not.toThrow();
    expect(next).toHaveBeenCalledWith();
  });

  it('always calls next', () => {
    const req = mockRequest({ body: {} });
    const next = mockNext();
    sanitizeBody(req, mockResponse(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
