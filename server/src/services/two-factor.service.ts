import { db } from '../db/connection.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { AppError } from '../middleware/error.middleware.js';
import crypto from 'crypto';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface BackupCode {
  id: number;
  code: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface TwoFactorAuditLog {
  id: number;
  user_id: number;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
}

export class TwoFactorService {
  private static APP_NAME = 'Smart Market OS';

  /**
   * Generate 2FA secret and QR code for user setup
   */
  static async generateSecret(userId: number, username: string): Promise<TwoFactorSetup> {
    // Check if user exists
    const user = db.prepare('SELECT id, username, two_fa_enabled FROM system_users WHERE id = ?').get(userId) as any;
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (user.two_fa_enabled) {
      throw new AppError('2FA is already enabled for this user', 400, '2FA_ALREADY_ENABLED');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${this.APP_NAME} (${username})`,
      issuer: this.APP_NAME,
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate 10 backup codes
    const backupCodes = this.generateBackupCodes();

    return {
      secret: secret.base32,
      qrCodeUrl,
      manualEntryKey: secret.base32,
      backupCodes,
    };
  }

  /**
   * Enable 2FA for user after verification
   */
  static enableTwoFactor(userId: number, secret: string, verificationCode: string, backupCodes: string[]): void {
    // Verify the code first
    const isValid = this.verifyToken(secret, verificationCode);
    if (!isValid) {
      throw new AppError('Invalid verification code', 400, 'INVALID_2FA_CODE');
    }

    // Enable 2FA in transaction
    const enable2FA = db.transaction(() => {
      // Update user
      db.prepare('UPDATE system_users SET two_fa_enabled = 1, two_fa_secret = ? WHERE id = ?').run(secret, userId);

      // Store backup codes
      const insertCode = db.prepare(
        'INSERT INTO two_fa_backup_codes (user_id, code) VALUES (?, ?)'
      );
      for (const code of backupCodes) {
        const hashedCode = this.hashBackupCode(code);
        insertCode.run(userId, hashedCode);
      }

      // Log event
      this.logAuditEvent(userId, 'ENABLED', null, null, '2FA enabled successfully');
    });

    enable2FA();
  }

  /**
   * Disable 2FA for user
   */
  static disableTwoFactor(userId: number, password: string): void {
    const disable2FA = db.transaction(() => {
      // Update user
      db.prepare('UPDATE system_users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = ?').run(userId);

      // Delete all backup codes
      db.prepare('DELETE FROM two_fa_backup_codes WHERE user_id = ?').run(userId);

      // Log event
      this.logAuditEvent(userId, 'DISABLED', null, null, '2FA disabled by user');
    });

    disable2FA();
  }

  /**
   * Verify TOTP token
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 60 seconds time drift (±2 steps)
    });
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(userId: number, code: string): boolean {
    const hashedCode = this.hashBackupCode(code);

    const backupCode = db
      .prepare('SELECT id, used FROM two_fa_backup_codes WHERE user_id = ? AND code = ?')
      .get(userId, hashedCode) as { id: number; used: number } | undefined;

    if (!backupCode) {
      return false;
    }

    if (backupCode.used) {
      return false; // Already used
    }

    // Mark as used
    db.prepare("UPDATE two_fa_backup_codes SET used = 1, used_at = datetime('now', 'localtime') WHERE id = ?").run(
      backupCode.id
    );

    // Log event
    this.logAuditEvent(userId, 'BACKUP_CODE_USED', null, null, 'Backup code used for login');

    return true;
  }

  /**
   * Get unused backup codes for user
   */
  static getBackupCodes(userId: number): BackupCode[] {
    return db
      .prepare('SELECT id, code, used, used_at, created_at FROM two_fa_backup_codes WHERE user_id = ? ORDER BY id')
      .all(userId) as BackupCode[];
  }

  /**
   * Regenerate backup codes
   */
  static regenerateBackupCodes(userId: number): string[] {
    const newCodes = this.generateBackupCodes();

    const regenerate = db.transaction(() => {
      // Delete old codes
      db.prepare('DELETE FROM two_fa_backup_codes WHERE user_id = ?').run(userId);

      // Insert new codes
      const insertCode = db.prepare('INSERT INTO two_fa_backup_codes (user_id, code) VALUES (?, ?)');
      for (const code of newCodes) {
        const hashedCode = this.hashBackupCode(code);
        insertCode.run(userId, hashedCode);
      }

      // Log event
      this.logAuditEvent(userId, 'ENABLED', null, null, 'Backup codes regenerated');
    });

    regenerate();
    return newCodes;
  }

  /**
   * Get 2FA audit logs for user
   */
  static getAuditLogs(userId: number, limit: number = 50): TwoFactorAuditLog[] {
    return db
      .prepare('SELECT * FROM two_fa_audit WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(userId, limit) as TwoFactorAuditLog[];
  }

  /**
   * Log 2FA audit event
   */
  static logAuditEvent(
    userId: number,
    eventType: 'ENABLED' | 'DISABLED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'BACKUP_CODE_USED',
    ipAddress: string | null = null,
    userAgent: string | null = null,
    notes: string | null = null
  ): void {
    db.prepare(
      'INSERT INTO two_fa_audit (user_id, event_type, ip_address, user_agent, notes) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, eventType, ipAddress, userAgent, notes);
  }

  /**
   * Generate 10 random backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric code (e.g., A1B2C3D4)
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup code for secure storage
   */
  private static hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Check if user has 2FA enabled
   */
  static isEnabled(userId: number): boolean {
    const user = db
      .prepare('SELECT two_fa_enabled FROM system_users WHERE id = ?')
      .get(userId) as { two_fa_enabled: number } | undefined;
    return user ? user.two_fa_enabled === 1 : false;
  }

  /**
   * Get user's 2FA secret
   */
  static getSecret(userId: number): string | null {
    const user = db
      .prepare('SELECT two_fa_secret FROM system_users WHERE id = ?')
      .get(userId) as { two_fa_secret: string | null } | undefined;
    return user?.two_fa_secret || null;
  }
}
