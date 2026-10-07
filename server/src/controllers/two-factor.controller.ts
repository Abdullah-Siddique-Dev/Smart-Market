import { Request, Response, NextFunction } from 'express';
import { TwoFactorService } from '../services/two-factor.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

export class TwoFactorController {
  /**
   * Generate 2FA secret and QR code for setup
   */
  static async generateSecret(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      const setup = await TwoFactorService.generateSecret(req.user.id, req.user.username);
      res.json(successResponse(setup, 'QR code generated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable 2FA after user scans QR and verifies code
   */
  static async enable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      const { secret, verificationCode, backupCodes } = req.body;

      TwoFactorService.enableTwoFactor(req.user.id, secret, verificationCode, backupCodes);
      res.json(successResponse(null, '2FA enabled successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable 2FA (requires password confirmation)
   */
  static async disable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      const { password } = req.body;

      TwoFactorService.disableTwoFactor(req.user.id, password);
      res.json(successResponse(null, '2FA disabled successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get 2FA status for current user
   */
  static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      const isEnabled = TwoFactorService.isEnabled(req.user.id);
      res.json(successResponse({ enabled: isEnabled }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get backup codes (only show unhashed codes during generation)
   */
  static async getBackupCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      const codes = TwoFactorService.getBackupCodes(req.user.id);
      // Return count and usage status only (never return actual codes for security)
      const codesInfo = codes.map((c) => ({
        id: c.id,
        used: c.used,
        used_at: c.used_at,
        created_at: c.created_at,
      }));

      res.json(successResponse({ codes: codesInfo, total: codes.length }));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      const newCodes = TwoFactorService.regenerateBackupCodes(req.user.id);
      res.json(successResponse({ backupCodes: newCodes }, 'Backup codes regenerated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get 2FA audit logs
   */
  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(errorResponse('Unauthorized', 'UNAUTHORIZED'));
        return;
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const logs = TwoFactorService.getAuditLogs(req.user.id, limit);
      res.json(successResponse({ logs }));
    } catch (error) {
      next(error);
    }
  }
}
