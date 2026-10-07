import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { twoFactorApi } from '../api/two-factor.api';
import { toast } from 'sonner';

export const QUERY_KEYS = {
  status: ['2fa', 'status'] as const,
  backupCodes: ['2fa', 'backup-codes'] as const,
  auditLogs: ['2fa', 'audit-logs'] as const,
};

/**
 * Get 2FA status for current user
 */
export function useTwoFactorStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.status,
    queryFn: () => twoFactorApi.getStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get backup codes info
 */
export function useBackupCodes() {
  return useQuery({
    queryKey: QUERY_KEYS.backupCodes,
    queryFn: () => twoFactorApi.getBackupCodes(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get 2FA audit logs
 */
export function useTwoFactorAuditLogs(limit: number = 50) {
  return useQuery({
    queryKey: [...QUERY_KEYS.auditLogs, limit],
    queryFn: () => twoFactorApi.getAuditLogs(limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Mutations for 2FA management
 */
export function useTwoFactorMutations() {
  const queryClient = useQueryClient();

  const generateSecret = useMutation({
    mutationFn: () => twoFactorApi.generateSecret(),
    onSuccess: () => {
      toast.success('QR code generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
    },
  });

  const enable = useMutation({
    mutationFn: ({ secret, code, backupCodes }: { secret: string; code: string; backupCodes: string[] }) =>
      twoFactorApi.enable(secret, code, backupCodes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.status });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backupCodes });
      toast.success('2FA enabled successfully! Keep your backup codes safe.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to enable 2FA');
    },
  });

  const disable = useMutation({
    mutationFn: (password: string) => twoFactorApi.disable(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.status });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backupCodes });
      toast.success('2FA disabled successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    },
  });

  const regenerateBackupCodes = useMutation({
    mutationFn: () => twoFactorApi.regenerateBackupCodes(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backupCodes });
      toast.success('New backup codes generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to regenerate backup codes');
    },
  });

  const verifyCode = useMutation({
    mutationFn: (code: string) => twoFactorApi.verifyCode(code),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid 2FA code');
    },
  });

  return {
    generateSecret,
    enable,
    disable,
    regenerateBackupCodes,
    verifyCode,
  };
}
