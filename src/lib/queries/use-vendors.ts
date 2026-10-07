import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '../api/vendors.api';

export function useVendors(params?: {
  page?: number;
  limit?: number;
  search?: string;
  show_archived?: boolean;
}) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: () => vendorsApi.getVendors(params),
  });
}

export function useVendor(id: number) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorsApi.getVendorById(id),
    enabled: id > 0,
  });
}

export function useVendorPayments(vendorId: number) {
  return useQuery({
    queryKey: ['vendor-payments', vendorId],
    queryFn: () => vendorsApi.getPayments(vendorId),
    enabled: vendorId > 0,
  });
}

export function useVendorPurchases(vendorId: number) {
  return useQuery({
    queryKey: ['vendor-purchases', vendorId],
    queryFn: () => vendorsApi.getPurchaseHistory(vendorId),
    enabled: vendorId > 0,
  });
}

export function useVendorMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
  };

  const createVendor = useMutation({
    mutationFn: vendorsApi.createVendor,
    onSuccess: invalidate,
  });

  const updateVendor = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<any> }) =>
      vendorsApi.updateVendor(id, data),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['vendor'] });
    },
  });

  const archiveVendor = useMutation({
    mutationFn: (id: number) => vendorsApi.archiveVendor(id),
    onSuccess: invalidate,
  });

  const recordPayment = useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: number; data: any }) =>
      vendorsApi.recordPayment(vendorId, data),
    onSuccess: (_data, vars) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['vendor', vars.vendorId] });
      queryClient.invalidateQueries({ queryKey: ['vendor-payments', vars.vendorId] });
    },
  });

  return { createVendor, updateVendor, archiveVendor, recordPayment };
}
