# TravelCo Tourism Backend API

## Overview

TravelCo is a comprehensive RESTful API backend for a leading tourism company, built with Node.js, Express.js, and PostgreSQL. The system manages travel packages, user accounts, shopping carts, orders, and invoicing for both customers and administrators.

## System Architecture

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy and bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **Email Service**: Nodemailer with SMTP configuration
- **Security**: Helmet.js for HTTP security headers
- **Validation**: Zod schemas for request validation

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **UI Components**: Radix UI with shadcn/ui components
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing

## Key Components

### Database Schema
The system uses Drizzle ORM with the following core entities:
- **Users**: User accounts with admin role support
- **Services**: Tourism packages (stays, flights, car rentals, packages)
- **Carts**: Shopping cart management
- **Cart Items**: Individual items in shopping carts
- **Orders**: Confirmed purchases
- **Invoices**: Billing and payment tracking
- **Notification Emails**: Email communication logs

### Authentication & Authorization
- **Passport.js** with local strategy for user authentication
- **Role-based access control** with admin privileges
- **Session-based authentication** with secure session storage
- **Password hashing** using bcrypt with salt

### API Structure
The API follows RESTful conventions with these main endpoints:
- `/api/services` - Tourism package management
- `/api/cart` - Shopping cart operations
- `/api/orders` - Order processing and tracking
- `/api/invoices` - Billing and payment management

### Email System
- **Automated notifications** for order confirmations
- **Company notifications** for new orders
- **SMTP configuration** with TLS security
- **Template-based emails** with order details

## Data Flow

1. **User Registration/Login**: Users register and authenticate through Passport.js
2. **Service Browsing**: Public access to view tourism packages
3. **Cart Management**: Authenticated users can add/remove items from cart
4. **Order Processing**: Cart confirmation creates orders and triggers email notifications
5. **Admin Management**: Administrators can manage services, orders, and invoicing
6. **Payment Tracking**: Invoice system tracks payment status and updates orders

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL driver for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations
- **passport & passport-local**: Authentication framework
- **bcrypt**: Password hashing
- **nodemailer**: Email service
- **helmet**: Security middleware
- **express-session**: Session management

### Frontend Dependencies
- **React ecosystem**: React, React DOM, TypeScript
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight routing

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit development environment
- **Hot Reload**: Vite development server with HMR
- **Database Provisioning**: Automatic PostgreSQL setup

### Production Build
- **Build Process**: Vite for frontend, esbuild for backend
- **Output**: Static frontend assets and bundled Node.js server
- **Deployment Target**: Autoscale deployment on Replit

### Environment Configuration
- **Database URL**: PostgreSQL connection string
- **Session Secret**: Secure session encryption key
- **SMTP Settings**: Email service configuration
- **Environment Variables**: Comprehensive .env.example provided

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **June 19, 2025**: Complete backend REST API implementation
  - Full authentication system with session-based auth for browsers
  - Bearer token support for API testing tools (Hoppscotch, Postman)
  - Interactive API testing page with working session authentication
  - Complete CRUD operations for services, cart, orders, and invoicing
  - Email notification system configured (requires SMTP credentials)
  - Successfully tested complete customer journey from registration to order completion

## Authentication Methods

The system supports dual authentication:
1. **Session-based**: For browsers and the interactive testing page
2. **Bearer tokens**: For external API testing tools (login response includes token field)

## User Preferences

- Preferred communication style: Simple, everyday language
- Testing preference: Interactive web-based API testing over external tools

## Changelog

- June 19, 2025: Initial setup and complete backend implementation