import { Request, Response, NextFunction } from 'express';
import { VendorService } from '../services/vendor.service.js';
import { successResponse } from '../utils/response.js';

export class VendorController {
  static getVendors(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = VendorService.getVendors(req.query);
      res.json(result);
    } catch (error) { next(error); }
  }

  static getVendorById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const vendor = VendorService.getVendorById(id);
      res.json(successResponse(vendor));
    } catch (error) { next(error); }
  }

  static createVendor(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.id;
      const vendor = VendorService.createVendor({ ...req.body, created_by: userId });
      res.status(201).json(successResponse(vendor, 'Vendor created successfully'));
    } catch (error) { next(error); }
  }

  static updateVendor(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = VendorService.updateVendor(id, req.body);
      res.json(successResponse(updated, 'Vendor updated successfully'));
    } catch (error) { next(error); }
  }

  static archiveVendor(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      VendorService.archiveVendor(id);
      res.json(successResponse(null, 'Vendor archived successfully'));
    } catch (error) { next(error); }
  }

  static getPayments(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const payments = VendorService.getPayments(id);
      res.json(successResponse(payments));
    } catch (error) { next(error); }
  }

  static recordPayment(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const payment = VendorService.recordPayment({ ...req.body, vendor_id: id, created_by: userId });
      res.status(201).json(successResponse(payment, 'Payment recorded successfully'));
    } catch (error) { next(error); }
  }

  static getPurchaseHistory(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const history = VendorService.getPurchaseHistory(id);
      res.json(successResponse(history));
    } catch (error) { next(error); }
  }
}
