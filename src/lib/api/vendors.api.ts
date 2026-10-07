import { apiClient } from './client';
import { Vendor, VendorPayment, VendorPurchase } from '@/types/entities';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const vendorsApi = {
  getVendors: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    show_archived?: boolean;
  }) => {
    const res = await apiClient.get<PaginatedResponse<Vendor>>('/vendors', { params });
    return res.data;
  },

  getVendorById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Vendor>>(`/vendors/${id}`);
    return res.data.data!;
  },

  createVendor: async (data: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Vendor>>('/vendors', data);
    return res.data.data!;
  },

  updateVendor: async (id: number, data: Partial<Vendor>) => {
    const res = await apiClient.put<ApiResponse<Vendor>>(`/vendors/${id}`, data);
    return res.data.data!;
  },

  archiveVendor: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/vendors/${id}`);
    return res.data;
  },

  getPayments: async (vendorId: number) => {
    const res = await apiClient.get<ApiResponse<VendorPayment[]>>(`/vendors/${vendorId}/payments`);
    return res.data.data!;
  },

  recordPayment: async (vendorId: number, data: {
    amount: number;
    payment_date?: string;
    payment_method?: string;
    reference?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<VendorPayment>>(`/vendors/${vendorId}/payments`, data);
    return res.data.data!;
  },

  getPurchaseHistory: async (vendorId: number) => {
    const res = await apiClient.get<ApiResponse<VendorPurchase[]>>(`/vendors/${vendorId}/purchases`);
    return res.data.data!;
  },
};
