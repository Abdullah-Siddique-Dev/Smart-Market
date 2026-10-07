import { Router } from 'express';
import { TwoFactorController } from '../controllers/two-factor.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

// All 2FA routes require authentication
router.use(ensureAuthenticated);

const enableSchema = z.object({
  body: z.object({
    secret: z.string().min(1, 'Secret is required'),
    verificationCode: z.string().length(6, 'Verification code must be 6 digits'),
    backupCodes: z.array(z.string()).length(10, 'Must provide 10 backup codes'),
  }),
});

const disableSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
  }),
});

// Generate QR code and backup codes for setup
router.post('/generate', TwoFactorController.generateSecret);

// Enable 2FA with verification
router.post('/enable', validate(enableSchema), TwoFactorController.enable);

// Disable 2FA (requires password)
router.post('/disable', validate(disableSchema), TwoFactorController.disable);

// Get 2FA status
router.get('/status', TwoFactorController.getStatus);

// Get backup codes info
router.get('/backup-codes', TwoFactorController.getBackupCodes);

// Regenerate backup codes
router.post('/backup-codes/regenerate', TwoFactorController.regenerateBackupCodes);

// Get audit logs
router.get('/audit-logs', TwoFactorController.getAuditLogs);

export const twoFactorRoutes = router;
