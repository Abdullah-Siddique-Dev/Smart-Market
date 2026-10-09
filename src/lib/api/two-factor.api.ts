import { apiClient } from './client';
import {
  TwoFactorSetup,
  TwoFactorStatus,
  TwoFactorBackupCodes,
  TwoFactorAuditLog,
  LoginResponse,
} from '@/types/entities';

export const twoFactorApi = {
  /**
   * Generate 2FA secret and QR code for setup
   */
  async generateSecret(): Promise<TwoFactorSetup> {
    const { data } = await apiClient.post('/2fa/generate');
    return data.data;
  },

  /**
   * Enable 2FA with verification code
   */
  async enable(secret: string, verificationCode: string, backupCodes: string[]): Promise<void> {
    await apiClient.post('/2fa/enable', {
      secret,
      verificationCode,
      backupCodes,
    });
  },

  /**
   * Disable 2FA (requires password)
   */
  async disable(password: string): Promise<void> {
    await apiClient.post('/2fa/disable', { password });
  },

  /**
   * Get 2FA status for current user
   */
  async getStatus(): Promise<TwoFactorStatus> {
    const { data } = await apiClient.get('/2fa/status');
    return data.data;
  },

  /**
   * Get backup codes info (usage status only)
   */
  async getBackupCodes(): Promise<TwoFactorBackupCodes> {
    const { data } = await apiClient.get('/2fa/backup-codes');
    return data.data;
  },

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<string[]> {
    const { data } = await apiClient.post('/2fa/backup-codes/regenerate');
    return data.data.backupCodes;
  },

  /**
   * Get 2FA audit logs
   */
  async getAuditLogs(limit: number = 50): Promise<TwoFactorAuditLog[]> {
    const { data } = await apiClient.get('/2fa/audit-logs', { params: { limit } });
    return data.data.logs;
  },

  /**
   * Verify 2FA code during login (step 2)
   */
  async verifyCode(code: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/verify-2fa', { code });
    if (data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },
};
