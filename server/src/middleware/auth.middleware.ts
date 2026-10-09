import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';
import { UserRole } from '../config/constants.js';
import { AuthService } from '../services/auth.service.js';

function extractUser(req: Request) {
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return req.user;
  }
  const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (token) {
      const user = AuthService.getUserByToken(token);
      if (user) {
        req.user = user;
        return user;
      }
    }
  }
  return null;
}

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const user = extractUser(req);
  if (user) {
    return next();
  }
  res.status(401).json(errorResponse('Authentication required. Please log in.', 'UNAUTHORIZED'));
}

export function requireRole(allowedRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = extractUser(req);
    if (!user) {
      res.status(401).json(errorResponse('Authentication required.', 'UNAUTHORIZED'));
      return;
    }

    if (user.role !== allowedRole) {
      res.status(403).json(
        errorResponse(
          `Forbidden: This action requires ${allowedRole} administrative privileges.`,
          'FORBIDDEN'
        )
      );
      return;
    }

    next();
  };
}
