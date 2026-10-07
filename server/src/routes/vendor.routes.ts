import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller.js';
import { ensureAuthenticated, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { USER_ROLES } from '../config/constants.js';
import { z } from 'zod';

const router = Router();

const createVendorSchema = z.object({
  body: z.object({
    name:           z.string().min(1, 'Vendor name is required'),
    contact_person: z.string().optional(),
    phone:          z.string().optional(),
    email:          z.string().email().optional().or(z.literal('')),
    address:        z.string().optional(),
    city:           z.string().optional(),
    notes:          z.string().optional(),
  }),
});

const updateVendorSchema = z.object({
  body: z.object({
    name:           z.string().min(1).optional(),
    contact_person: z.string().optional(),
    phone:          z.string().optional(),
    email:          z.string().email().optional().or(z.literal('')),
    address:        z.string().optional(),
    city:           z.string().optional(),
    notes:          z.string().optional(),
    is_active:      z.number().int().min(0).max(1).optional(),
  }),
});

const recordPaymentSchema = z.object({
  body: z.object({
    amount:         z.number().positive('Amount must be greater than 0'),
    payment_date:   z.string().optional(),
    payment_method: z.enum(['CASH', 'BANK', 'CREDIT']).optional(),
    reference:      z.string().optional(),
    notes:          z.string().optional(),
  }),
});

router.use(ensureAuthenticated);

router.get('/',    VendorController.getVendors);
router.get('/:id', VendorController.getVendorById);

router.post('/',    requireRole(USER_ROLES.OWNER), validate(createVendorSchema),  VendorController.createVendor);
router.put('/:id',  requireRole(USER_ROLES.OWNER), validate(updateVendorSchema),  VendorController.updateVendor);
router.delete('/:id', requireRole(USER_ROLES.OWNER), VendorController.archiveVendor);

router.get('/:id/payments',  VendorController.getPayments);
router.post('/:id/payments', requireRole(USER_ROLES.OWNER), validate(recordPaymentSchema), VendorController.recordPayment);
router.get('/:id/purchases', VendorController.getPurchaseHistory);

export const vendorRoutes = router;
