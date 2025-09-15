import { type Express, type Request } from 'express';
import { z } from 'zod';
import { generateJWTToken, generateAPIKey, hashPassword, verifyPassword, createSessionData } from './auth';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';
import { secureAuthenticateAPI, type AuthenticatedRequest } from './secure-auth';

// Request type with session support (using module augmentation from secure-auth.ts)
type RequestWithSession = Request;

// Validation schemas for auth endpoints
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const createAPIKeySchema = z.object({
  name: z.string().min(1, 'API key name is required'),
  permissions: z.array(z.string()).default(['read']),
  expiresAt: z.string().datetime().optional()
});

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(identifier: string, windowMs: number = 60000, maxRequests: number = 10): boolean {
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

export function registerAuthRoutes(app: Express) {
  
  /**
   * User Registration
   */
  app.post('/api/auth/register', async (req: RequestWithSession, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Rate limiting for registration
      if (!rateLimit(`register_${clientIP}`, 300000, 3)) { // 3 attempts per 5 minutes
        return res.status(429).json({
          success: false,
          error: 'Too many registration attempts. Please try again later.',
          code: 'RATE_LIMITED'
        });
      }

      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists',
          code: 'USERNAME_EXISTS'
        });
      }

      if (validatedData.email) {
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            error: 'Email already exists',
            code: 'EMAIL_EXISTS'
          });
        }
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword
      });

      // Generate JWT token
      const token = generateJWTToken(user);

      // Create session if sessions are enabled
      if (req.session) {
        (req.session as any).user = createSessionData(user);
      }

      console.log(`✅ New user registered: ${user.username} (${user.id})`);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            subscriptionPlan: user.subscriptionPlan,
            createdAt: user.createdAt
          },
          token,
          expiresIn: '24h'
        }
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  });

  /**
   * User Login
   */
  app.post('/api/auth/login', async (req: RequestWithSession, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      
      // Rate limiting for login
      if (!rateLimit(`login_${clientIP}`, 300000, 5)) { // 5 attempts per 5 minutes
        return res.status(429).json({
          success: false,
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMITED'
        });
      }

      const validatedData = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const isValidPassword = await verifyPassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate JWT token
      const token = generateJWTToken(user);

      // Regenerate session ID to prevent session fixation attacks
      if (req.session) {
        req.session.regenerate((err: any) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({
              success: false,
              error: 'Login failed',
              code: 'SESSION_ERROR'
            });
          }
          
          // Set session data after successful regeneration
          (req.session as any).user = createSessionData(user);
          
          console.log(`🔐 User logged in: ${user.username} (${user.id}) from ${clientIP}`);

          res.json({
            success: true,
            data: {
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                subscriptionPlan: user.subscriptionPlan,
                createdAt: user.createdAt
              },
              token,
              expiresIn: '24h'
            }
          });
        });
      } else {
        // No session support, just return JWT token
        console.log(`🔐 User logged in: ${user.username} (${user.id}) from ${clientIP}`);

        res.json({
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              subscriptionPlan: user.subscriptionPlan,
              createdAt: user.createdAt
            },
            token,
            expiresIn: '24h'
          }
        });
      }

    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  });

  /**
   * Logout
   */
  app.post('/api/auth/logout', (req: RequestWithSession, res) => {
    try {
      // Clear session if exists
      if (req.session) {
        (req.session as any).user = null;
        req.session.destroy((err: any) => {
          if (err) {
            console.error('Session destroy error:', err);
          }
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  });

  /**
   * Get current user profile
   */
  app.get('/api/auth/me', secureAuthenticateAPI, (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            subscriptionPlan: user.subscriptionPlan,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          authMethod: req.authMethod
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  });

  /**
   * Create API Key
   */
  app.post('/api/auth/api-keys', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const validatedData = createAPIKeySchema.parse(req.body);

      // Check existing API keys limit based on subscription
      const existingKeys = await storage.getAPIKeys(user.id);
      const maxKeys = user.subscriptionPlan === 'enterprise' ? 10 : 
                     user.subscriptionPlan === 'pro' ? 5 : 
                     user.subscriptionPlan === 'basic' ? 2 : 1;

      if (existingKeys.length >= maxKeys) {
        return res.status(403).json({
          success: false,
          error: `Maximum of ${maxKeys} API keys allowed for ${user.subscriptionPlan} plan`,
          code: 'API_KEY_LIMIT_REACHED',
          upgrade_url: '/pricing'
        });
      }

      // Generate secure API key
      const { keyId, apiKey, hashedKey } = await generateAPIKey(
        user.id, 
        validatedData.permissions,
        validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
      );

      // Store API key in database
      const storedKey = await storage.createAPIKey({
        keyId,
        userId: user.id,
        name: validatedData.name,
        hashedKey,
        permissions: validatedData.permissions,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
        isActive: true
      });

      console.log(`🔑 API key created: ${validatedData.name} for user ${user.username}`);

      res.status(201).json({
        success: true,
        data: {
          id: storedKey.id,
          keyId: storedKey.keyId,
          name: storedKey.name,
          apiKey, // Only returned once during creation
          permissions: storedKey.permissions,
          expiresAt: storedKey.expiresAt,
          createdAt: storedKey.createdAt
        },
        warning: 'Store this API key securely. It will not be shown again.'
      });

    } catch (error: any) {
      console.error('Create API key error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create API key'
      });
    }
  });

  /**
   * List API Keys
   */
  app.get('/api/auth/api-keys', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const apiKeys = await storage.getAPIKeys(user.id);

      res.json({
        success: true,
        data: apiKeys.map(key => ({
          id: key.id,
          keyId: key.keyId,
          name: key.name,
          permissions: key.permissions,
          lastUsedAt: key.lastUsedAt,
          expiresAt: key.expiresAt,
          isActive: key.isActive,
          createdAt: key.createdAt
          // Note: hashedKey is never returned for security
        }))
      });

    } catch (error) {
      console.error('List API keys error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list API keys'
      });
    }
  });

  /**
   * Delete API Key
   */
  app.delete('/api/auth/api-keys/:keyId', secureAuthenticateAPI, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { keyId } = req.params;

      // Verify the API key belongs to the user
      const apiKey = await storage.getAPIKey(keyId);
      if (!apiKey || apiKey.userId !== user.id) {
        return res.status(404).json({
          success: false,
          error: 'API key not found',
          code: 'API_KEY_NOT_FOUND'
        });
      }

      const deleted = await storage.deleteAPIKey(keyId);
      if (deleted) {
        console.log(`🔑 API key deleted: ${apiKey.name} for user ${user.username}`);
        
        res.json({
          success: true,
          message: 'API key deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'API key not found'
        });
      }

    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete API key'
      });
    }
  });
}