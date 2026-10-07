import axios from 'axios';
import {
  TwoFactorSetup,
  TwoFactorStatus,
  TwoFactorBackupCodes,
  TwoFactorAuditLog,
  LoginResponse,
} from '@/types/entities';

const API_BASE = '/api';

export const twoFactorApi = {
  /**
   * Generate 2FA secret and QR code for setup
   */
  async generateSecret(): Promise<TwoFactorSetup> {
    const { data } = await axios.post(`${API_BASE}/2fa/generate`);
    return data.data;
  },

  /**
   * Enable 2FA with verification code
   */
  async enable(secret: string, verificationCode: string, backupCodes: string[]): Promise<void> {
    await axios.post(`${API_BASE}/2fa/enable`, {
      secret,
      verificationCode,
      backupCodes,
    });
  },

  /**
   * Disable 2FA (requires password)
   */
  async disable(password: string): Promise<void> {
    await axios.post(`${API_BASE}/2fa/disable`, { password });
  },

  /**
   * Get 2FA status for current user
   */
  async getStatus(): Promise<TwoFactorStatus> {
    const { data } = await axios.get(`${API_BASE}/2fa/status`);
    return data.data;
  },

  /**
   * Get backup codes info (usage status only)
   */
  async getBackupCodes(): Promise<TwoFactorBackupCodes> {
    const { data } = await axios.get(`${API_BASE}/2fa/backup-codes`);
    return data.data;
  },

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(): Promise<string[]> {
    const { data } = await axios.post(`${API_BASE}/2fa/backup-codes/regenerate`);
    return data.data.backupCodes;
  },

  /**
   * Get 2FA audit logs
   */
  async getAuditLogs(limit: number = 50): Promise<TwoFactorAuditLog[]> {
    const { data } = await axios.get(`${API_BASE}/2fa/audit-logs`, { params: { limit } });
    return data.data.logs;
  },

  /**
   * Verify 2FA code during login (step 2)
   */
  async verifyCode(code: string): Promise<LoginResponse> {
    const { data } = await axios.post(`${API_BASE}/auth/verify-2fa`, { code });
    return data;
  },
};
