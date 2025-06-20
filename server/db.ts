import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

async function initDatabase() {
  // Verificás si la tabla existe
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    )
  `);
  
  const exists = result.rows[0].exists;
  if (!exists) {
    console.log("Creating tables...");
    await pool.query(`

                     -- Enums
CREATE TYPE service_type AS ENUM ('stay', 'flight', 'car_rental', 'package');
CREATE TYPE cart_status AS ENUM ('active', 'confirmed', 'canceled');
CREATE TYPE order_status AS ENUM ('pending_payment', 'paid', 'canceled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');
CREATE TYPE notification_sector AS ENUM ('sales', 'administration', 'logistics');

-- Tabla users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    registration_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla services
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    service_type service_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    additional_details JSON,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla carts
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status cart_status NOT NULL DEFAULT 'active'
);

-- Tabla cart_items
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER NOT NULL REFERENCES carts(id),
    service_id INTEGER NOT NULL REFERENCES services(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL
);

-- Tabla orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    cart_id INTEGER NOT NULL REFERENCES carts(id),
    confirmation_date TIMESTAMP NOT NULL DEFAULT NOW(),
    status order_status NOT NULL DEFAULT 'pending_payment',
    total DECIMAL(10, 2) NOT NULL
);

-- Tabla invoices
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    amount DECIMAL(10, 2) NOT NULL,
    issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
    payment_status payment_status NOT NULL DEFAULT 'pending'
);

-- Tabla notification_emails
CREATE TABLE notification_emails (
    id SERIAL PRIMARY KEY,
    sector notification_sector NOT NULL,
    destination_email TEXT NOT NULL
);

    `);
  } else {
    console.log("Tables already exist.");
  }
}

initDatabase();
