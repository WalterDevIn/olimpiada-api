import { 
  users, services, carts, cartItems, orders, invoices, notificationEmails,
  type User, type InsertUser, type Service, type InsertService,
  type Cart, type InsertCart, type CartItem, type InsertCartItem,
  type Order, type InsertOrder, type Invoice, type InsertInvoice,
  type NotificationEmail, type InsertNotificationEmail
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Service management
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Cart management
  getActiveCartByUserId(userId: number): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  updateCartStatus(cartId: number, status: 'active' | 'confirmed' | 'canceled'): Promise<Cart | undefined>;

  // Cart item management
  getCartItems(cartId: number): Promise<(CartItem & { service: Service })[]>;
  addCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;

  // Order management
  getOrders(userId?: number): Promise<(Order & { user: User })[]>;
  getOrder(id: number): Promise<(Order & { user: User; cart: Cart & { cartItems: (CartItem & { service: Service })[] } }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: 'pending_payment' | 'paid' | 'canceled'): Promise<Order | undefined>;

  // Invoice management
  getInvoices(orderId?: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoicePaymentStatus(id: number, status: 'pending' | 'paid'): Promise<Invoice | undefined>;

  // Notification emails
  getNotificationEmails(sector: 'sales' | 'administration' | 'logistics'): Promise<NotificationEmail[]>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Service management
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db
      .insert(services)
      .values(service)
      .returning();
    return newService;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return result.rowCount > 0;
  }

  // Cart management
  async getActiveCartByUserId(userId: number): Promise<Cart | undefined> {
    const [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.status, 'active')));
    return cart || undefined;
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const [newCart] = await db
      .insert(carts)
      .values(cart)
      .returning();
    return newCart;
  }

  async updateCartStatus(cartId: number, status: 'active' | 'confirmed' | 'canceled'): Promise<Cart | undefined> {
    const [updatedCart] = await db
      .update(carts)
      .set({ status })
      .where(eq(carts.id, cartId))
      .returning();
    return updatedCart || undefined;
  }

  // Cart item management
  async getCartItems(cartId: number): Promise<(CartItem & { service: Service })[]> {
    return await db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        serviceId: cartItems.serviceId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        service: services,
      })
      .from(cartItems)
      .innerJoin(services, eq(cartItems.serviceId, services.id))
      .where(eq(cartItems.cartId, cartId));
  }

  async addCartItem(cartItem: InsertCartItem): Promise<CartItem> {
    const [newCartItem] = await db
      .insert(cartItems)
      .values(cartItem)
      .returning();
    return newCartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const [updatedCartItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedCartItem || undefined;
  }

  async removeCartItem(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  // Order management
  async getOrders(userId?: number): Promise<(Order & { user: User })[]> {
    const query = db
      .select({
        id: orders.id,
        userId: orders.userId,
        cartId: orders.cartId,
        confirmationDate: orders.confirmationDate,
        status: orders.status,
        total: orders.total,
        user: users,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.confirmationDate));

    if (userId) {
      return await query.where(eq(orders.userId, userId));
    }
    
    return await query;
  }

  async getOrder(id: number): Promise<(Order & { user: User; cart: Cart & { cartItems: (CartItem & { service: Service })[] } }) | undefined> {
    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        cartId: orders.cartId,
        confirmationDate: orders.confirmationDate,
        status: orders.status,
        total: orders.total,
        user: users,
        cart: carts,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(carts, eq(orders.cartId, carts.id))
      .where(eq(orders.id, id));

    if (!order) return undefined;

    const items = await this.getCartItems(order.cartId);
    
    return {
      ...order,
      cart: {
        ...order.cart,
        cartItems: items,
      },
    };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: number, status: 'pending_payment' | 'paid' | 'canceled'): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  // Invoice management
  async getInvoices(orderId?: number): Promise<Invoice[]> {
    const query = db.select().from(invoices);
    
    if (orderId) {
      return await query.where(eq(invoices.orderId, orderId));
    }
    
    return await query;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async updateInvoicePaymentStatus(id: number, status: 'pending' | 'paid'): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ paymentStatus: status })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice || undefined;
  }

  // Notification emails
  async getNotificationEmails(sector: 'sales' | 'administration' | 'logistics'): Promise<NotificationEmail[]> {
    return await db
      .select()
      .from(notificationEmails)
      .where(eq(notificationEmails.sector, sector));
  }
}

export const storage = new DatabaseStorage();
