/**
 * password.service.ts — Hash and verify passwords for native email auth.
 * Never log plaintext passwords. Never return hashes in API responses.
 */
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../constants/limits';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
