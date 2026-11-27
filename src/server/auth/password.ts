import "server-only";
import { pbkdf2, randomInt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);

const ALGORITHM = "pbkdf2_sha256";
const ITERATIONS = 1_000_000;
const SALT_LENGTH = 22;
const KEY_LENGTH = 32;
const SALT_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Verifies a plain password against a Django `pbkdf2_sha256$...` hash. Never throws on bad input. */
export async function verifyPassword(
  plain: string,
  encoded: string
): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 4) return false;
  const [algorithm, iterationsRaw, salt, hashB64] = parts;
  if (algorithm !== ALGORITHM) return false;
  if (!/^\d+$/.test(iterationsRaw)) return false;
  const iterations = Number(iterationsRaw);
  if (!Number.isSafeInteger(iterations) || iterations < 1) return false;
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length === 0) return false;
  try {
    const actual = await pbkdf2Async(
      plain,
      salt,
      iterations,
      expected.length,
      "sha256"
    );
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Hashes a password in Django's format so the database stays Django-readable. */
export async function hashPassword(plain: string): Promise<string> {
  let salt = "";
  for (let i = 0; i < SALT_LENGTH; i++) {
    salt += SALT_ALPHABET[randomInt(SALT_ALPHABET.length)];
  }
  const dk = await pbkdf2Async(plain, salt, ITERATIONS, KEY_LENGTH, "sha256");
  return `${ALGORITHM}$${ITERATIONS}$${salt}$${dk.toString("base64")}`;
}
