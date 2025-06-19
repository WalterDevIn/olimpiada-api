import nodemailer from 'nodemailer';
import { User, Order, CartItem, Service } from '@shared/schema';
import { storage } from '../storage';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendOrderConfirmation(
    user: User, 
    order: Order, 
    items: (CartItem & { service: Service })[]
  ): Promise<void> {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.service.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.unitPrice}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF6B6B; text-align: center;">Order Confirmation</h1>
            <p>Dear ${user.name},</p>
            <p>Thank you for your order! Your booking has been confirmed.</p>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> #${order.id}</p>
              <p><strong>Order Date:</strong> ${new Date(order.confirmationDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${order.status.replace('_', ' ').toUpperCase()}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #FF6B6B; color: white;">
                  <th style="padding: 10px; text-align: left;">Package</th>
                  <th style="padding: 10px; text-align: center;">Quantity</th>
                  <th style="padding: 10px; text-align: right;">Unit Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                <tr style="background-color: #f9f9f9; font-weight: bold;">
                  <td colspan="3" style="padding: 15px; text-align: right;">Total Amount:</td>
                  <td style="padding: 15px; text-align: right;">$${order.total}</td>
                </tr>
              </tbody>
            </table>

            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4>What's Next?</h4>
              <p>• You will receive payment instructions shortly</p>
              <p>• Our travel specialists will contact you within 24 hours</p>
              <p>• Keep this email for your records</p>
            </div>

            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The TravelCo Team</p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: `Order Confirmation - TravelCo #${order.id}`,
      html: emailHtml,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOrderNotificationToCompany(
    order: Order, 
    items: (CartItem & { service: Service })[]
  ): Promise<void> {
    // Get company notification emails
    const salesEmails = await storage.getNotificationEmails('sales');
    
    if (salesEmails.length === 0) {
      console.warn('No sales notification emails configured');
      return;
    }

    const itemsList = items.map(item => 
      `${item.service.name} (Qty: ${item.quantity}) - $${item.unitPrice} each`
    ).join('\n');

    const emailText = `
New Order Received - TravelCo

Order ID: #${order.id}
Order Date: ${new Date(order.confirmationDate).toLocaleString()}
Total Amount: $${order.total}
Status: ${order.status.replace('_', ' ').toUpperCase()}

Items Ordered:
${itemsList}

Please process this order and contact the customer if needed.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: salesEmails.map(email => email.destinationEmail).join(', '),
      subject: `New Order #${order.id} - TravelCo`,
      text: emailText,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordRecovery(user: User, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #FF6B6B; text-align: center;">Password Recovery</h1>
            <p>Dear ${user.name},</p>
            <p>You requested to reset your password. Click the link below to set a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #FF6B6B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this, please ignore this email.
            </p>
            
            <p>Best regards,<br>The TravelCo Team</p>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Password Recovery - TravelCo',
      html: emailHtml,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
