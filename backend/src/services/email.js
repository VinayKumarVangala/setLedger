const envConfig = require('../config/env');

class EmailService {
  constructor() {
    this.apiKey = envConfig.email.apiKey;
    this.from = envConfig.email.from;
    this.service = envConfig.email.service;
  }

  // Send invitation email
  async sendInvitation(data) {
    const { to, organizationName, inviterName, inviteeName, role, invitationLink, message, expiresIn } = data;
    
    const emailContent = {
      to,
      from: this.from,
      subject: `Invitation to join ${organizationName} on setLedger`,
      html: this.generateInvitationHTML({
        organizationName,
        inviterName,
        inviteeName,
        role,
        invitationLink,
        message,
        expiresIn
      })
    };

    // In production, integrate with actual email service
    console.log('Invitation Email:', emailContent);
    
    // Mock successful send
    return { success: true, messageId: 'mock_' + Date.now() };
  }

  // Generate invitation email HTML
  generateInvitationHTML(data) {
    const { organizationName, inviterName, inviteeName, role, invitationLink, message, expiresIn } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitation to ${organizationName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .role-badge { background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏦 setLedger</h1>
            <p>Financial Management Platform</p>
          </div>
          
          <div class="content">
            <h2>You're invited to join ${organizationName}!</h2>
            
            <p>Hi ${inviteeName},</p>
            
            <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on setLedger as a <span class="role-badge">${role.toUpperCase()}</span>.</p>
            
            ${message ? `<div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;"><p><strong>Personal message:</strong></p><p>"${message}"</p></div>` : ''}
            
            <p>setLedger is a comprehensive financial management platform that helps businesses manage billing, inventory, GST compliance, and analytics all in one place.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" class="button">Accept Invitation</a>
            </div>
            
            <p><strong>What you'll get access to:</strong></p>
            <ul>
              <li>📊 Real-time financial dashboards</li>
              <li>🧾 Automated billing and invoicing</li>
              <li>📦 Smart inventory management</li>
              <li>💰 GST compliance and reporting</li>
              <li>🤖 AI-powered business insights</li>
            </ul>
            
            <p><small><strong>Note:</strong> This invitation expires in ${expiresIn}. If you don't accept it by then, please ask ${inviterName} to send a new invitation.</small></p>
            
            <p>If you have any questions, feel free to contact ${inviterName} or our support team.</p>
            
            <p>Welcome to the team!</p>
          </div>
          
          <div class="footer">
            <p>© 2024 setLedger. All rights reserved.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Send welcome email after registration
  async sendWelcomeEmail(data) {
    const { to, organizationName, adminName } = data;
    
    const emailContent = {
      to,
      from: this.from,
      subject: `Welcome to setLedger - ${organizationName} is ready!`,
      html: this.generateWelcomeHTML({ organizationName, adminName })
    };

    console.log('Welcome Email:', emailContent);
    return { success: true, messageId: 'mock_' + Date.now() };
  }

  // Generate welcome email HTML
  generateWelcomeHTML(data) {
    const { organizationName, adminName } = data;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to setLedger</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to setLedger!</h1>
          </div>
          
          <div class="content">
            <h2>Your organization is ready, ${adminName}!</h2>
            
            <p>Congratulations! <strong>${organizationName}</strong> has been successfully set up on setLedger.</p>
            
            <p><strong>Next steps:</strong></p>
            <ol>
              <li>Complete your organization profile</li>
              <li>Invite team members</li>
              <li>Set up your first products</li>
              <li>Create your first invoice</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p>Need help getting started? Check out our <a href="${process.env.FRONTEND_URL}/help">help center</a> or contact our support team.</p>
          </div>
          
          <div class="footer">
            <p>© 2024 setLedger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();