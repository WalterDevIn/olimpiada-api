import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const serviceTypeEnum = pgEnum('service_type', ['stay', 'flight', 'car_rental', 'package']);
export const cartStatusEnum = pgEnum('cart_status', ['active', 'confirmed', 'canceled']);
export const orderStatusEnum = pgEnum('order_status', ['pending_payment', 'paid', 'canceled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid']);
export const notificationSectorEnum = pgEnum('notification_sector', ['sales', 'administration', 'logistics']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  registrationDate: timestamp("registration_date").defaultNow().notNull(),
});

// Services/Tourist Packages table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  serviceType: serviceTypeEnum("service_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  additionalDetails: json("additional_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Carts table
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  creationDate: timestamp("creation_date").defaultNow().notNull(),
  status: cartStatusEnum("status").default('active').notNull(),
});

// Cart Items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  cartId: integer("cart_id").references(() => carts.id).notNull(),
  confirmationDate: timestamp("confirmation_date").defaultNow().notNull(),
  status: orderStatusEnum("status").default('pending_payment').notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default('pending').notNull(),
});

// Notification Email table
export const notificationEmails = pgTable("notification_emails", {
  id: serial("id").primaryKey(),
  sector: notificationSectorEnum("sector").notNull(),
  destinationEmail: text("destination_email").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  carts: many(carts),
  orders: many(orders),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  cartItems: many(cartItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  service: one(services, {
    fields: [cartItems.serviceId],
    references: [services.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  cart: one(carts, {
    fields: [orders.cartId],
    references: [carts.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  registrationDate: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  creationDate: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

// Schema for adding items to cart (only serviceId and quantity needed)
export const addCartItemSchema = z.object({
  serviceId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  confirmationDate: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  issueDate: true,
});

export const insertNotificationEmailSchema = createInsertSchema(notificationEmails).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type NotificationEmail = typeof notificationEmails.$inferSelect;
export type InsertNotificationEmail = z.infer<typeof insertNotificationEmailSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;
