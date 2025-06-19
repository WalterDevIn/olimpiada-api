import { Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth } from "../middleware/validation";

class CartController {
  // POST /api/cart - Create or get active cart
  createCart = [requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Check if user already has an active cart
      let cart = await storage.getActiveCartByUserId(userId);
      
      if (!cart) {
        cart = await storage.createCart({ userId, status: 'active' });
      }

      res.json(cart);
    } catch (error) {
      console.error('Error creating/getting cart:', error);
      res.status(500).json({ message: "Failed to create cart" });
    }
  }];

  // GET /api/cart - Get user's active cart with items
  getCart = [requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const cart = await storage.getActiveCartByUserId(userId);

      if (!cart) {
        return res.json({ cart: null, items: [], total: 0 });
      }

      const items = await storage.getCartItems(cart.id);
      const total = items.reduce((sum, item) => 
        sum + (parseFloat(item.unitPrice) * item.quantity), 0
      );

      res.json({ cart, items, total });
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  }];

  // POST /api/cart/item - Add item to cart
  addCartItem = [requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      let cart = await storage.getActiveCartByUserId(userId);

      if (!cart) {
        cart = await storage.createCart({ userId, status: 'active' });
      }

      const { serviceId, quantity = 1 } = req.body;
      
      // Get service to verify it exists and get current price
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const cartItem = await storage.addCartItem({
        cartId: cart.id,
        serviceId,
        quantity,
        unitPrice: service.unitPrice
      });

      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Error adding cart item:', error);
      res.status(500).json({ message: "Failed to add item to cart" });
    }
  }];

  // PUT /api/cart/item/:id - Update cart item quantity
  updateCartItem = [requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;

      if (isNaN(id) || !quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid item ID or quantity" });
      }

      const cartItem = await storage.updateCartItem(id, quantity);
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(cartItem);
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  }];

  // DELETE /api/cart/item/:id - Remove item from cart
  removeCartItem = [requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid item ID" });
      }

      const deleted = await storage.removeCartItem(id);
      if (!deleted) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error removing cart item:', error);
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  }];
}

export const cartController = new CartController();
