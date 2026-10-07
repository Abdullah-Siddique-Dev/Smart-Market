import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { AuthService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthenticatedUser } from '../auth/passport.js';

export class AuthController {
  /**
   * Step 1: Login with username and password
   * Returns whether 2FA is required
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;

      const result = await AuthService.validateCredentials(username, password);

      if (result.requiresTwoFactor) {
        // Store temp user ID in session for 2FA verification
        req.session.tempUserId = result.tempUserId;
        req.session.tempUsername = username;

        res.json({
          success: true,
          requiresTwoFactor: true,
          message: 'Please enter your 2FA code',
        });
        return;
      }

      // No 2FA required, log user in directly
      if (result.user) {
        req.login(result.user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.json({
            success: true,
            requiresTwoFactor: false,
            user: {
              id: result.user!.id,
              username: result.user!.username,
              role: result.user!.role,
              full_name: result.user!.full_name,
            },
            message: 'Logged in successfully',
          });
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Step 2: Verify 2FA code
   */
  static async verifyTwoFactor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code } = req.body;
      const tempUserId = req.session.tempUserId;

      if (!tempUserId) {
        res.status(400).json(errorResponse('No pending 2FA verification', 'NO_PENDING_2FA'));
        return;
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const user = AuthService.verifyTwoFactorCode(tempUserId, code, ipAddress, userAgent);

      // Clear temp session data
      delete req.session.tempUserId;
      delete req.session.tempUsername;

      // Log user in
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            full_name: user.full_name,
          },
          message: 'Logged in successfully',
        });
      });
    } catch (error) {
      next(error);
    }
  }

  static logout(req: Request, res: Response, next: NextFunction): void {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json(successResponse(null, 'Logged out successfully'));
      });
    });
  }

  static getSession(req: Request, res: Response): void {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      res.json({
        success: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          full_name: req.user.full_name,
        },
      });
      return;
    }

    res.json({
      success: true,
      user: null,
    });
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      await AuthService.changePassword(req.user.id, oldPassword, newPassword);
      res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }
}
