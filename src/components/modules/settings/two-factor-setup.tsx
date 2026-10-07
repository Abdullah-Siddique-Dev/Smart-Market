import React, { useState } from 'react';
import { useTwoFactorMutations } from '@/lib/queries/use-two-factor';
import { TwoFactorSetup as TwoFactorSetupData } from '@/types/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Smartphone, Key, Copy, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ open, onOpenChange, onSuccess }) => {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup'>('generate');
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState<Set<number>>(new Set());

  const { generateSecret, enable } = useTwoFactorMutations();

  const handleGenerate = async () => {
    try {
      const data = await generateSecret.mutateAsync();
      setSetupData(data);
      setStep('verify');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleVerify = async () => {
    if (!setupData || !verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      await enable.mutateAsync({
        secret: setupData.secret,
        code: verificationCode,
        backupCodes: setupData.backupCodes,
      });
      setStep('backup');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodes((prev) => new Set(prev).add(index));
    toast.success('Code copied to clipboard');
    setTimeout(() => {
      setCopiedCodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 2000);
  };

  const handleCopyAllCodes = () => {
    if (!setupData) return;
    const allCodes = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(allCodes);
    toast.success('All backup codes copied to clipboard');
  };

  const handleFinish = () => {
    setStep('generate');
    setSetupData(null);
    setVerificationCode('');
    setCopiedCodes(new Set());
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Enable Two-Factor Authentication</span>
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your account with TOTP 2FA
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Generate QR Code */}
        {step === 'generate' && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-300">Download an authenticator app</p>
                <p className="text-blue-700 dark:text-blue-400 text-xs">
                  Install Google Authenticator or Microsoft Authenticator on your smartphone
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">How 2FA works:</p>
              <ul className="space-y-1.5 ml-4 list-disc text-xs">
                <li>You'll scan a QR code with your authenticator app</li>
                <li>The app generates a new 6-digit code every 30 seconds</li>
                <li>You'll need this code along with your password to login</li>
                <li>Works 100% offline - no internet needed!</li>
              </ul>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateSecret.isPending}
              className="w-full"
            >
              {generateSecret.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Scan QR and Verify */}
        {step === 'verify' && setupData && (
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">1. Scan this QR code with your app:</p>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>

              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-1">Manual entry key:</p>
                <code className="text-xs font-mono text-foreground break-all">{setupData.manualEntryKey}</code>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">2. Enter the 6-digit code to verify:</p>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('generate')} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={enable.isPending || verificationCode.length !== 6}
                className="flex-1"
              >
                {enable.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify & Enable
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Save Backup Codes */}
        {step === 'backup' && setupData && (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-amber-900 dark:text-amber-300">Save these backup codes!</p>
                <p className="text-amber-700 dark:text-amber-400 text-xs">
                  Each code can be used once if you lose access to your authenticator app
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Your backup codes:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAllCodes}
                  className="h-7 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy All
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg border border-border max-h-64 overflow-y-auto">
                {setupData.backupCodes.map((code, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopyCode(code, index)}
                    className="flex items-center justify-between p-2 rounded bg-background hover:bg-accent transition-colors group"
                  >
                    <code className="font-mono text-xs font-semibold">{code}</code>
                    {copiedCodes.has(index) ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleFinish} className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Done - I've Saved My Codes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
