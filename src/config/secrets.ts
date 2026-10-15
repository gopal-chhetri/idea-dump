/**
 * Central access to secrets. In production a missing secret is a startup
 * error rather than a silent fallback: a known default JWT key would let
 * anyone mint admin tokens.
 */

const isProduction = process.env.NODE_ENV === 'production';

function decodeBase64(value: string | undefined): string | undefined {
  return value ? Buffer.from(value, 'base64').toString('utf-8') : undefined;
}

function requireInProduction(name: string, value: string | undefined): void {
  if (isProduction && !value) {
    throw new Error(`${name} must be set in production`);
  }
}

const DEV_JWT_SECRET = 'dev-secret-not-for-production';
const DEV_ENCRYPTION_KEY = 'insecure-dev-key-32-chars-long!!';

export interface JwtKeys {
  /** Key used to sign tokens. */
  signingKey: string;
  /** Key used to verify tokens. */
  verifyKey: string;
  algorithm: 'RS256' | 'HS256';
}

export function jwtKeys(): JwtKeys {
  requireInProduction('JWT_PRIVATE_KEY', process.env.JWT_PRIVATE_KEY);
  requireInProduction('JWT_PUBLIC_KEY', process.env.JWT_PUBLIC_KEY);

  const privateKey = decodeBase64(process.env.JWT_PRIVATE_KEY);
  const publicKey = decodeBase64(process.env.JWT_PUBLIC_KEY);
  if (privateKey && publicKey) {
    return { signingKey: privateKey, verifyKey: publicKey, algorithm: 'RS256' };
  }
  if (privateKey || publicKey) {
    throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set together');
  }
  return {
    signingKey: DEV_JWT_SECRET,
    verifyKey: DEV_JWT_SECRET,
    algorithm: 'HS256',
  };
}

export function encryptionKey(): string {
  requireInProduction('APP_ENCRYPTION_KEY', process.env.APP_ENCRYPTION_KEY);
  return process.env.APP_ENCRYPTION_KEY || DEV_ENCRYPTION_KEY;
}

/** TypeSafe API key for Jev scoring; undefined disables Jev. */
export function typesafeApiKey(): string | undefined {
  return process.env.TYPESAFE_API_KEY?.trim() || undefined;
}

/** Jev scores below this confidence fall back to the rule-based score. */
export function jevMinConfidence(): number {
  const value = Number(process.env.JEV_MIN_CONFIDENCE);
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0.5;
}

/** Per-request timeout for Jev calls; idea creation waits on this. */
export function jevTimeoutMs(): number {
  return Number(process.env.JEV_TIMEOUT_MS) || 3000;
}
