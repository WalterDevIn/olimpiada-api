import { Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/validation";

class InvoiceController {
  // GET /api/invoices - Get invoices
  getInvoices = [requireAuth, async (req: Request, res: Response) => {
    try {
      const { orderId } = req.query;
      
      let invoices = await storage.getInvoices(
        orderId ? parseInt(orderId as string) : undefined
      );

      // If not admin, filter to only user's invoices
      if (!req.user!.isAdmin && orderId) {
        const order = await storage.getOrder(parseInt(orderId as string));
        if (!order || order.userId !== req.user!.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (!req.user!.isAdmin) {
        // For non-admin users without orderId, get all their orders' invoices
        const userOrders = await storage.getOrders(req.user!.id);
        const userOrderIds = userOrders.map(order => order.id);
        invoices = invoices.filter(invoice => userOrderIds.includes(invoice.orderId));
      }

      res.json(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  }];

  // POST /api/invoices/:id/register-payment - Register payment for invoice (Admin only)
  registerPayment = [requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }

      const invoice = await storage.updateInvoicePaymentStatus(id, 'paid');
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Also update the related order status
      await storage.updateOrderStatus(invoice.orderId, 'paid');

      res.json(invoice);
    } catch (error) {
      console.error('Error registering payment:', error);
      res.status(500).json({ message: "Failed to register payment" });
    }
  }];
}

export const invoiceController = new InvoiceController();
