import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupSecurity } from "./middleware/security";
import { validateRequest } from "./middleware/validation";
import { serviceController } from "./controllers/serviceController";
import { cartController } from "./controllers/cartController";
import { orderController } from "./controllers/orderController";
import { invoiceController } from "./controllers/invoiceController";
import { insertServiceSchema, addCartItemSchema } from "@shared/schema";
import cors from "cors";

export function registerRoutes(app: Express): Server {
  // Security middleware
  setupSecurity(app);
  
  // Authentication routes
  setupAuth(app);

  app.use(cors());

  // Services routes (Admin only for CUD operations)
  app.post('/api/services', validateRequest(insertServiceSchema), serviceController.createService);
  app.get('/api/services', serviceController.getServices);
  app.get('/api/services/:id', serviceController.getService);
  app.put('/api/services/:id', validateRequest(insertServiceSchema), serviceController.updateService);
  app.delete('/api/services/:id', serviceController.deleteService);

  // Shopping cart routes (Authenticated users)
  app.post('/api/cart', cartController.createCart);
  app.get('/api/cart', cartController.getCart);
  app.post('/api/cart/item', cartController.addCartItem);
  app.put('/api/cart/item/:id', cartController.updateCartItem);
  app.delete('/api/cart/item/:id', cartController.removeCartItem);

  // Order routes
  app.post('/api/cart/confirm', orderController.confirmCart);
  app.get('/api/orders', orderController.getOrders);
  app.get('/api/orders/:id', orderController.getOrder);
  app.post('/api/orders/:id/update-payment', orderController.updatePayment);

  // Invoice routes
  app.get('/api/invoices', invoiceController.getInvoices);
  app.post('/api/invoices/:id/register-payment', invoiceController.registerPayment);

  const httpServer = createServer(app);
  return httpServer;
}
