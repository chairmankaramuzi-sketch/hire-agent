import crypto from 'crypto';

const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

function scryptAsync(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, SCRYPT_PARAMS, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

/**
 * Hashes a password with a random salt using scrypt.
 * Format: scrypt$<saltHex>$<hashHex>
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await scryptAsync(password, salt);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/**
 * Constant-time verification of a password against a stored scrypt hash.
 */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scryptAsync(password, Buffer.from(saltHex, 'hex'));
  return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}
