import React, { useState, useEffect } from 'react';
import { useVendorMutations } from '@/lib/queries/use-vendors';
import { Vendor } from '@/types/entities';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Building2 } from 'lucide-react';

interface VendorFormProps {
  vendor?: Vendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (vendor: Vendor) => void;
}

export const VendorForm: React.FC<VendorFormProps> = ({
  vendor, open, onOpenChange, onSuccess,
}) => {
  const [name, setName]               = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');
  const [address, setAddress]         = useState('');
  const [city, setCity]               = useState('');
  const [notes, setNotes]             = useState('');
  const [error, setError]             = useState<string | null>(null);

  const { createVendor, updateVendor } = useVendorMutations();
  const isEditing = !!vendor;

  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setContactPerson(vendor.contact_person || '');
      setPhone(vendor.phone || '');
      setEmail(vendor.email || '');
      setAddress(vendor.address || '');
      setCity(vendor.city || '');
      setNotes(vendor.notes || '');
    } else {
      setName(''); setContactPerson(''); setPhone('');
      setEmail(''); setAddress(''); setCity(''); setNotes('');
    }
    setError(null);
  }, [vendor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Vendor name is required'); return; }

    try {
      setError(null);
      let result: Vendor;
      if (isEditing && vendor) {
        result = await updateVendor.mutateAsync({
          id: vendor.id,
          data: {
            name: name.trim(),
            contact_person: contactPerson.trim() || undefined,
            phone: phone.trim() || undefined,
            email: email.trim() || undefined,
            address: address.trim() || undefined,
            city: city.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        });
      } else {
        result = await createVendor.mutateAsync({
          name: name.trim(),
          contact_person: contactPerson.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onOpenChange(false);
      onSuccess?.(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save vendor');
    }
  };

  const isPending = createVendor.isPending || updateVendor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update vendor/supplier details' : 'Add a new supplier to your vendor directory'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vendor Name */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Vendor / Supplier Name *</label>
            <Input
              type="text"
              placeholder="e.g. Ali Traders"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
              required
              autoFocus
            />
          </div>

          {/* Contact Person + Phone */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Contact Person</label>
              <Input
                type="text"
                placeholder="e.g. Mr. Ali"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Phone</label>
              <Input
                type="text"
                placeholder="03xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* Email + City */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="vendor@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">City</label>
              <Input
                type="text"
                placeholder="e.g. Lahore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Address</label>
            <Input
              type="text"
              placeholder="e.g. Mohallah Mehrabad, Near Main Bazaar"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Notes</label>
            <Input
              type="text"
              placeholder="Optional notes about this vendor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="font-semibold gap-1.5">
              {isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Saving...</span></>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Add Vendor'}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
