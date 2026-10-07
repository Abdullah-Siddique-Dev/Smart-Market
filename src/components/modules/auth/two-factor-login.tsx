import React, { useState, useEffect, useRef } from 'react';
import { useTwoFactorMutations } from '@/lib/queries/use-two-factor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Loader2, Key, AlertCircle, Smartphone } from 'lucide-react';

interface TwoFactorLoginProps {
  onSuccess: (user: any) => void;
  onBack?: () => void;
}

export const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({ onSuccess, onBack }) => {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { verifyCode } = useTwoFactorMutations();

  useEffect(() => {
    // Auto-focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      return;
    }

    try {
      const response = await verifyCode.mutateAsync(code);
      if (response.success && response.user) {
        onSuccess(response.user);
      }
    } catch (error) {
      // Error handled by mutation
      setCode('');
      inputRef.current?.focus();
    }
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Two-Factor Authentication</h2>
        <p className="text-sm text-muted-foreground">
          {useBackupCode
            ? 'Enter one of your 8-character backup codes'
            : 'Enter the 6-digit code from your authenticator app'}
        </p>
      </div>

      {/* Info Alert */}
      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
        <Smartphone className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-foreground">
            {useBackupCode ? 'Using backup code' : 'Open your authenticator app'}
          </p>
          <p className="text-muted-foreground">
            {useBackupCode
              ? 'Each backup code can only be used once'
              : 'The code refreshes every 30 seconds'}
          </p>
        </div>
      </div>

      {/* Code Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            ref={inputRef}
            type="text"
            inputMode={useBackupCode ? 'text' : 'numeric'}
            placeholder={useBackupCode ? 'A1B2C3D4' : '000000'}
            maxLength={useBackupCode ? 8 : 6}
            value={code}
            onChange={(e) => {
              const value = useBackupCode
                ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                : e.target.value.replace(/\D/g, '');
              setCode(value);
            }}
            className="text-center text-3xl font-mono tracking-widest h-16"
            autoComplete="off"
            disabled={verifyCode.isPending}
          />
          <p className="text-xs text-center text-muted-foreground">
            {useBackupCode ? '8 characters (letters and numbers)' : '6 digits'}
          </p>
        </div>

        {/* Error Message */}
        {verifyCode.isError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {useBackupCode
                ? 'Invalid or already used backup code'
                : 'Invalid code. Please try again.'}
            </span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={
            verifyCode.isPending ||
            (useBackupCode ? code.length !== 8 : code.length !== 6)
          }
          className="w-full h-11"
        >
          {verifyCode.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Verify & Continue
            </>
          )}
        </Button>

        {/* Toggle Backup Code */}
        <button
          type="button"
          onClick={toggleBackupCode}
          className="w-full text-sm text-primary hover:underline font-medium flex items-center justify-center gap-1.5"
        >
          <Key className="h-3.5 w-3.5" />
          {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
        </button>

        {/* Back Button */}
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full"
            disabled={verifyCode.isPending}
          >
            Back to Login
          </Button>
        )}
      </form>

      {/* Help Text */}
      <div className="text-center space-y-2 pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Lost access to your authenticator app?
        </p>
        <p className="text-xs text-muted-foreground">
          Contact your system administrator for account recovery
        </p>
      </div>
    </div>
  );
};
