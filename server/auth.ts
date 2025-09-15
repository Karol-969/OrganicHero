import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { type User } from '@shared/schema';
import { storage } from './storage';
import { randomBytes } from 'crypto';

// JWT Configuration - Environment variables are required for production security
const JWT_SECRET = getRequiredSecret('JWT_SECRET');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const API_KEY_SECRET = getRequiredSecret('API_KEY_SECRET');

// Secure secret validation and fallback for development
function getRequiredSecret(envVar: string): string {
  const secret = process.env[envVar];
  
  if (secret && secret.length >= 32) {
    return secret;
  }
  
  // For development environments only - log warning and generate temporary secret
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.warn(`⚠️  SECURITY WARNING: ${envVar} not set or too short. Using temporary secret for development.`);
    console.warn(`   Please set ${envVar} to a secure 64+ character random string in production.`);
    return generateSecretKey();
  }
  
  // In production, fail fast rather than using insecure fallback
  throw new Error(
    `SECURITY ERROR: ${envVar} environment variable is required in production and must be at least 32 characters long. ` +
    `Generate a secure secret with: openssl rand -hex 64`
  );
}

// Generate a secure secret key for development fallback only
function generateSecretKey(): string {
  return randomBytes(64).toString('hex');
}

// JWT Token Interface
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  subscriptionPlan: string;
  iat?: number;
  exp?: number;
}

// API Key Interface
export interface APIKeyData {
  userId: string;
  keyId: string;
  permissions: string[];
  expiresAt?: Date;
}

/**
 * Generate a secure JWT token for a user
 */
export function generateJWTToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email || '',
    username: user.username,
    subscriptionPlan: user.subscriptionPlan || 'free'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'campaign-management-api',
    audience: 'campaign-users'
  } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyJWTToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'campaign-management-api',
      audience: 'campaign-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('EXPIRED_TOKEN');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('INVALID_TOKEN');
    } else {
      throw new Error('TOKEN_VERIFICATION_FAILED');
    }
  }
}

/**
 * Generate a secure API key for programmatic access
 */
export async function generateAPIKey(userId: string, permissions: string[] = ['read'], expiresAt?: Date): Promise<{ keyId: string; apiKey: string; hashedKey: string }> {
  const keyId = randomBytes(16).toString('hex');
  const rawKey = randomBytes(32).toString('hex');
  
  // Create the API key data
  const apiKeyData: APIKeyData = {
    userId,
    keyId,
    permissions,
    expiresAt
  };
  
  // Create the full API key with metadata
  const apiKey = `ck_${keyId}_${rawKey}`;
  
  // Hash the API key for secure storage
  const hashedKey = await bcrypt.hash(rawKey, 12);
  
  return { keyId, apiKey, hashedKey };
}

/**
 * Verify an API key against stored hash
 */
export async function verifyAPIKey(apiKey: string, storedHash: string): Promise<boolean> {
  try {
    // Extract the raw key from the API key format
    const parts = apiKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'ck') {
      return false;
    }
    
    const rawKey = parts[2];
    return await bcrypt.compare(rawKey, storedHash);
  } catch (error) {
    console.error('API key verification error:', error);
    return false;
  }
}

/**
 * Extract key ID from API key
 */
export function extractKeyId(apiKey: string): string | null {
  try {
    const parts = apiKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'ck') {
      return null;
    }
    return parts[1];
  } catch (error) {
    return null;
  }
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate session data for express-session
 */
export interface SessionData {
  userId: string;
  email: string;
  username: string;
  subscriptionPlan: string;
  isAuthenticated: boolean;
  loginTime: number;
}

export function createSessionData(user: User): SessionData {
  return {
    userId: user.id,
    email: user.email || '',
    username: user.username,
    subscriptionPlan: user.subscriptionPlan || 'free',
    isAuthenticated: true,
    loginTime: Date.now()
  };
}

/**
 * Validate session data
 */
export function validateSessionData(sessionData: any): sessionData is SessionData {
  return (
    sessionData &&
    typeof sessionData.userId === 'string' &&
    typeof sessionData.email === 'string' &&
    typeof sessionData.username === 'string' &&
    typeof sessionData.subscriptionPlan === 'string' &&
    sessionData.isAuthenticated === true &&
    typeof sessionData.loginTime === 'number'
  );
}

// Export constants for use in other modules
export { JWT_SECRET, JWT_EXPIRES_IN, API_KEY_SECRET };