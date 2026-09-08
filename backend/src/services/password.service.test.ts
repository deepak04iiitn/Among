import { hashPassword, verifyPassword } from './password.service';

describe('password.service', () => {
  it('hashes a password to a bcrypt string', async () => {
    const hash = await hashPassword('correct-horse-battery');
    expect(hash).not.toBe('correct-horse-battery');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies the correct password', async () => {
    const hash = await hashPassword('secret-pass-1');
    await expect(verifyPassword('secret-pass-1', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('secret-pass-1');
    await expect(verifyPassword('wrong-pass-1', hash)).resolves.toBe(false);
  });
});
