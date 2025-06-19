import { Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/validation";
import { emailService } from "../services/emailService";

class OrderController {
  // POST /api/cart/confirm - Confirm cart as order
  confirmCart = [requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const cart = await storage.getActiveCartByUserId(userId);

      if (!cart) {
        return res.status(404).json({ message: "No active cart found" });
      }

      const items = await storage.getCartItems(cart.id);
      if (items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const total = items.reduce((sum, item) => 
        sum + (parseFloat(item.unitPrice) * item.quantity), 0
      );

      // Create order
      const order = await storage.createOrder({
        userId,
        cartId: cart.id,
        status: 'pending_payment',
        total: total.toString()
      });

      // Update cart status
      await storage.updateCartStatus(cart.id, 'confirmed');

      // Create invoice
      const invoice = await storage.createInvoice({
        orderId: order.id,
        amount: order.total,
        paymentStatus: 'pending'
      });

      // Send confirmation emails
      try {
        await emailService.sendOrderConfirmation(req.user!, order, items);
        await emailService.sendOrderNotificationToCompany(order, items);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the order creation if email fails
      }

      res.status(201).json({ order, invoice });
    } catch (error) {
      console.error('Error confirming cart:', error);
      res.status(500).json({ message: "Failed to confirm order" });
    }
  }];

  // GET /api/orders - Get orders (user's orders or all orders for admin)
  getOrders = [requireAuth, async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const isAdmin = req.user!.isAdmin;
      const userId = isAdmin ? undefined : req.user!.id;

      let orders = await storage.getOrders(userId);

      // Filter by status if provided
      if (status && typeof status === 'string') {
        orders = orders.filter(order => order.status === status);
      }

      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  }];

  // GET /api/orders/:id - Get specific order details
  getOrder = [requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      const order = await storage.getOrder(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can access this order
      if (!req.user!.isAdmin && order.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  }];

  // POST /api/orders/:id/update-payment - Update order payment status (Admin only)
  updatePayment = [requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }

      if (!['pending_payment', 'paid', 'canceled'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Update invoice if payment is confirmed
      if (status === 'paid') {
        const invoices = await storage.getInvoices(order.id);
        if (invoices.length > 0) {
          await storage.updateInvoicePaymentStatus(invoices[0].id, 'paid');
        }
      }

      res.json(order);
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  }];
}

export const orderController = new OrderController();
