import { type Request, type Response, type NextFunction } from 'express';
import { verifyJWTToken, verifyAPIKey, extractKeyId, validateSessionData, type JWTPayload, type SessionData } from './auth';
import { storage } from './storage';
import { type User } from '@shared/schema';

// Extend Express Request interface to add session typing
declare module 'express-serve-static-core' {
  interface Request {
    session?: any;
  }
}

// Extended Request interface with user data
export interface AuthenticatedRequest extends Request {
  user?: User;
  authMethod?: 'jwt' | 'session' | 'api_key';
  jwtPayload?: JWTPayload;
  sessionData?: SessionData;
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
function rateLimit(identifier: string, windowMs: number = 60000, maxRequests: number = 100): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitStore.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * JWT/API Key Only Authentication - For API endpoints to prevent CSRF attacks
 * This middleware ONLY accepts JWT tokens and API keys, NO session authentication
 */
export const secureAuthenticateAPI = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Rate limiting based on IP
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (!rateLimit(`auth_${clientIP}`, 60000, 100)) {
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        code: 'RATE_LIMITED'
      });
    }

    let user: User | undefined;
    let authMethod: 'jwt' | 'api_key' | undefined;

    // Method 1: JWT Token Authentication (Preferred for APIs)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      try {
        const payload = verifyJWTToken(token);
        user = await storage.getUser(payload.userId);
        
        if (user) {
          authMethod = 'jwt';
          req.jwtPayload = payload;
          
          // Verify JWT payload matches current user data
          if (user.email !== payload.email || user.username !== payload.username) {
            return res.status(401).json({
              success: false,
              error: 'Token payload mismatch. Please login again.',
              code: 'TOKEN_MISMATCH'
            });
          }
        }
      } catch (error: any) {
        const errorCode = error.message || 'TOKEN_INVALID';
        return res.status(401).json({
          success: false,
          error: getTokenErrorMessage(errorCode),
          code: errorCode
        });
      }
    }

    // Method 2: Secure API Key Authentication (For service-to-service)
    if (!user) {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (apiKey) {
        try {
          const keyId = extractKeyId(apiKey);
          if (!keyId) {
            return res.status(401).json({
              success: false,
              error: 'Invalid API key format',
              code: 'INVALID_API_KEY_FORMAT'
            });
          }

          // Get the stored API key data from database
          const storedApiKey = await storage.getAPIKey(keyId);
          if (!storedApiKey) {
            return res.status(401).json({
              success: false,
              error: 'API key not found',
              code: 'API_KEY_NOT_FOUND'
            });
          }

          // Check if API key is expired
          if (storedApiKey.expiresAt && new Date() > storedApiKey.expiresAt) {
            return res.status(401).json({
              success: false,
              error: 'API key has expired',
              code: 'API_KEY_EXPIRED'
            });
          }

          // Verify the API key hash
          const isValidKey = await verifyAPIKey(apiKey, storedApiKey.hashedKey);
          if (!isValidKey) {
            return res.status(401).json({
              success: false,
              error: 'Invalid API key',
              code: 'INVALID_API_KEY'
            });
          }

          user = await storage.getUser(storedApiKey.userId);
          if (user) {
            authMethod = 'api_key';
            // Update last used timestamp
            await storage.updateAPIKeyLastUsed(keyId);
          }
        } catch (error: any) {
          console.error('API key verification error:', error);
          return res.status(401).json({
            success: false,
            error: 'API key verification failed',
            code: 'API_KEY_VERIFICATION_FAILED'
          });
        }
      }
    }

    // No valid authentication method found
    if (!user || !authMethod) {
      return res.status(401).json({
        success: false,
        error: 'API authentication required. Provide a valid JWT token or API key. Sessions are not supported for API endpoints.',
        code: 'API_AUTHENTICATION_REQUIRED',
        supportedMethods: ['Bearer JWT token', 'API key (x-api-key header)']
      });
    }

    // Attach user and auth method to request
    req.user = user;
    req.authMethod = authMethod;

    // Log successful authentication for audit
    console.log(`🔐 API authenticated: ${user.username} (${user.id}) via ${authMethod} from ${clientIP}`);

    next();

  } catch (error) {
    console.error('❌ API authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Legacy authentication middleware that supports JWT, API Key, and Session authentication
 * Should only be used for web interface endpoints that need session support
 */
export const secureAuthenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Rate limiting based on IP
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (!rateLimit(`auth_${clientIP}`, 60000, 100)) {
      return res.status(429).json({
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        code: 'RATE_LIMITED'
      });
    }

    let user: User | undefined;
    let authMethod: 'jwt' | 'session' | 'api_key' | undefined;

    // Method 1: JWT Token Authentication (Preferred for APIs)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      try {
        const payload = verifyJWTToken(token);
        user = await storage.getUser(payload.userId);
        
        if (user) {
          authMethod = 'jwt';
          req.jwtPayload = payload;
          
          // Verify JWT payload matches current user data
          if (user.email !== payload.email || user.username !== payload.username) {
            return res.status(401).json({
              success: false,
              error: 'Token payload mismatch. Please login again.',
              code: 'TOKEN_MISMATCH'
            });
          }
        }
      } catch (error: any) {
        const errorCode = error.message || 'TOKEN_INVALID';
        return res.status(401).json({
          success: false,
          error: getTokenErrorMessage(errorCode),
          code: errorCode
        });
      }
    }

    // Method 2: Session Authentication (For web interfaces)
    if (!user && req.session) {
      const sessionData = (req.session as any).user;
      
      if (validateSessionData(sessionData)) {
        user = await storage.getUser(sessionData.userId);
        
        if (user) {
          authMethod = 'session';
          req.sessionData = sessionData;
          
          // Verify session data matches current user
          if (user.email !== sessionData.email || user.username !== sessionData.username) {
            // Clear invalid session
            (req.session as any).user = null;
            return res.status(401).json({
              success: false,
              error: 'Session data mismatch. Please login again.',
              code: 'SESSION_MISMATCH'
            });
          }
        }
      }
    }

    // Method 3: Secure API Key Authentication (For service-to-service)
    if (!user) {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (apiKey) {
        try {
          const keyId = extractKeyId(apiKey);
          if (!keyId) {
            return res.status(401).json({
              success: false,
              error: 'Invalid API key format',
              code: 'INVALID_API_KEY_FORMAT'
            });
          }

          // Get the stored API key data from database
          const storedApiKey = await storage.getAPIKey(keyId);
          if (!storedApiKey) {
            return res.status(401).json({
              success: false,
              error: 'API key not found',
              code: 'API_KEY_NOT_FOUND'
            });
          }

          // Check if API key is expired
          if (storedApiKey.expiresAt && new Date() > storedApiKey.expiresAt) {
            return res.status(401).json({
              success: false,
              error: 'API key has expired',
              code: 'API_KEY_EXPIRED'
            });
          }

          // Verify the API key hash
          const isValidKey = await verifyAPIKey(apiKey, storedApiKey.hashedKey);
          if (!isValidKey) {
            return res.status(401).json({
              success: false,
              error: 'Invalid API key',
              code: 'INVALID_API_KEY'
            });
          }

          user = await storage.getUser(storedApiKey.userId);
          if (user) {
            authMethod = 'api_key';
          }
        } catch (error: any) {
          console.error('API key verification error:', error);
          return res.status(401).json({
            success: false,
            error: 'API key verification failed',
            code: 'API_KEY_VERIFICATION_FAILED'
          });
        }
      }
    }

    // No valid authentication method found
    if (!user || !authMethod) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Provide a valid JWT token, session, or API key.',
        code: 'AUTHENTICATION_REQUIRED',
        supportedMethods: ['Bearer JWT token', 'Session cookie', 'API key (x-api-key header)']
      });
    }

    // Attach user and auth method to request
    req.user = user;
    req.authMethod = authMethod;

    // Log successful authentication for audit
    console.log(`🔐 User authenticated: ${user.username} (${user.id}) via ${authMethod} from ${clientIP}`);

    next();

  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Get user-friendly error message for token errors
 */
function getTokenErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'EXPIRED_TOKEN':
      return 'Your session has expired. Please login again.';
    case 'INVALID_TOKEN':
      return 'Invalid authentication token. Please login again.';
    case 'TOKEN_VERIFICATION_FAILED':
      return 'Token verification failed. Please login again.';
    default:
      return 'Authentication failed. Please login again.';
  }
}

/**
 * Optional authentication middleware (doesn't fail if no auth provided)
 */
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Try to authenticate, but don't fail if no auth provided
    await secureAuthenticateUser(req, res, (error?: any) => {
      if (error) {
        // If there was an authentication error, just continue without user
        req.user = undefined;
        req.authMethod = undefined;
      }
      next();
    });
  } catch (error) {
    // Continue without authentication if there's an error
    req.user = undefined;
    req.authMethod = undefined;
    next();
  }
};

/**
 * Authorization middleware for subscription features
 */
export const requireSubscription = (minPlan: 'free' | 'basic' | 'pro' | 'enterprise' = 'free') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const planHierarchy = { 'free': 0, 'basic': 1, 'pro': 2, 'enterprise': 3 };
    const userPlanLevel = planHierarchy[user.subscriptionPlan || 'free'];
    const requiredLevel = planHierarchy[minPlan];
    
    if (userPlanLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: `${minPlan} subscription or higher required`,
        code: 'SUBSCRIPTION_REQUIRED',
        upgrade_url: '/pricing'
      });
    }
    
    next();
  };
};

/**
 * Admin-only authorization middleware
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  // Check if user has admin role (add this field to User schema if needed)
  const isAdmin = (user as any).role === 'admin' || (user as any).isAdmin === true;
  
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

/**
 * Standardized error response helper
 */
export const sendAuthError = (res: Response, type: 'unauthenticated' | 'unauthorized' | 'subscription', message?: string) => {
  switch (type) {
    case 'unauthenticated':
      return res.status(401).json({
        success: false,
        error: message || 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    case 'unauthorized':
      return res.status(403).json({
        success: false,
        error: message || 'Access denied',
        code: 'ACCESS_DENIED'
      });
    case 'subscription':
      return res.status(403).json({
        success: false,
        error: message || 'Subscription upgrade required',
        code: 'SUBSCRIPTION_REQUIRED',
        upgrade_url: '/pricing'
      });
  }
};