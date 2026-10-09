import crypto from 'node:crypto';
import { db } from '../db/connection.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { AppError } from '../middleware/error.middleware.js';
import { AuthenticatedUser } from '../auth/passport.js';
import { TwoFactorService } from './two-factor.service.js';

export interface LoginStepOneResult {
  requiresTwoFactor: boolean;
  tempUserId?: number;
  user?: AuthenticatedUser;
}

export class AuthService {
  /**
   * Step 1: Validate username and password
   * Returns whether 2FA is required
   */
  static async validateCredentials(username: string, password: string): Promise<LoginStepOneResult> {
    const user = db
      .prepare('SELECT * FROM system_users WHERE username = ? LIMIT 1')
      .get(username) as (AuthenticatedUser & { password_hash: string; two_fa_enabled: number }) | undefined;

    if (!user) {
      throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.is_active !== 1) {
      throw new AppError('Account is deactivated. Contact system owner.', 401, 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
    }

    // If 2FA is enabled, don't return user yet
    if (user.two_fa_enabled === 1) {
      return {
        requiresTwoFactor: true,
        tempUserId: user.id,
      };
    }

    // No 2FA, return user directly
    const safeUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    };

    return {
      requiresTwoFactor: false,
      user: safeUser,
    };
  }

  /**
   * Step 2: Verify 2FA code (TOTP or backup code)
   */
  static verifyTwoFactorCode(
    userId: number,
    code: string,
    ipAddress?: string,
    userAgent?: string
  ): AuthenticatedUser {
    const user = db
      .prepare('SELECT * FROM system_users WHERE id = ?')
      .get(userId) as (AuthenticatedUser & { two_fa_secret: string | null; two_fa_enabled: number }) | undefined;

    if (!user || user.two_fa_enabled !== 1) {
      throw new AppError('2FA is not enabled for this user', 400, '2FA_NOT_ENABLED');
    }

    let isValid = false;
    let usedBackupCode = false;

    // Try TOTP first
    if (user.two_fa_secret && code.length === 6) {
      isValid = TwoFactorService.verifyToken(user.two_fa_secret, code);
    }

    // Try backup code if TOTP failed
    if (!isValid && code.length === 8) {
      isValid = TwoFactorService.verifyBackupCode(userId, code);
      usedBackupCode = isValid;
    }

    if (!isValid) {
      // Log failed attempt
      TwoFactorService.logAuditEvent(userId, 'LOGIN_FAILED', ipAddress || null, userAgent || null, 'Invalid 2FA code');
      throw new AppError('Invalid 2FA code', 401, 'INVALID_2FA_CODE');
    }

    // Log successful login
    TwoFactorService.logAuditEvent(
      userId,
      'LOGIN_SUCCESS',
      ipAddress || null,
      userAgent || null,
      usedBackupCode ? 'Login with backup code' : 'Login with TOTP'
    );

    const safeUser: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    };

    return safeUser;
  }

  static async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = db
      .prepare('SELECT password_hash FROM system_users WHERE id = ?')
      .get(userId) as { password_hash: string } | undefined;

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await comparePassword(oldPassword, user.password_hash);
    if (!isMatch) {
      throw new AppError('Current password does not match', 400, 'INVALID_OLD_PASSWORD');
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400, 'WEAK_PASSWORD');
    }

    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE system_users SET password_hash = ? WHERE id = ?').run(newHash, userId);
  }

  static getProfile(userId: number): AuthenticatedUser & { two_fa_enabled: boolean } {
    const user = db
      .prepare('SELECT id, username, full_name, role, is_active, two_fa_enabled FROM system_users WHERE id = ?')
      .get(userId) as (AuthenticatedUser & { two_fa_enabled: number }) | undefined;

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      ...user,
      two_fa_enabled: user.two_fa_enabled === 1,
    };
  }

  static createToken(userId: number): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      db.prepare(`
        INSERT INTO auth_tokens (token, user_id, expires_at)
        VALUES (?, ?, ?)
      `).run(token, userId, expiresAt);
    } catch (err) {
      console.error('Failed to create auth token in DB:', err);
    }
    return token;
  }

  static getUserByToken(token: string): AuthenticatedUser | null {
    if (!token || typeof token !== 'string') return null;
    try {
      const record = db.prepare(`
        SELECT u.id, u.username, u.full_name, u.role, u.is_active
        FROM auth_tokens t
        JOIN system_users u ON t.user_id = u.id
        WHERE t.token = ? AND t.expires_at > datetime('now', 'localtime') AND u.is_active = 1
        LIMIT 1
      `).get(token) as AuthenticatedUser | undefined;

      return record || null;
    } catch {
      return null;
    }
  }

  static revokeToken(token: string): void {
    if (!token) return;
    try {
      db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
    } catch {}
  }
}
