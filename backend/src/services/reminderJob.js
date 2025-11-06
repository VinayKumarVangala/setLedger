const cron = require('node-cron');
const CreditLedger = require('../models/creditLedger');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class ReminderJob {
  static async checkOverdueCredits() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueCredits = await CreditLedger.find({
        dueDate: { $lt: today },
        balanceAmount: { $gt: 0 },
        status: { $in: ['pending', 'partial'] }
      });

      console.log(`📧 Found ${overdueCredits.length} overdue credits`);

      for (const credit of overdueCredits) {
        // Update status to overdue
        credit.status = 'overdue';
        await credit.save();

        // Send reminder email
        await this.sendReminderEmail(credit);
      }

      console.log('✅ Overdue credit check completed');
    } catch (error) {
      console.error('❌ Error checking overdue credits:', error);
    }
  }

  static async sendReminderEmail(credit) {
    const ReminderLog = require('../models/reminderLog');
    
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const templatePath = path.join(__dirname, '../templates/reminder.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      htmlTemplate = htmlTemplate
        .replace('{{customerName}}', credit.customerId)
        .replace('{{invoiceId}}', credit.invoiceId)
        .replace('{{balanceAmount}}', credit.balanceAmount.toFixed(2))
        .replace('{{dueDate}}', credit.dueDate.toLocaleDateString())
        .replace('{{daysOverdue}}', Math.floor((new Date() - credit.dueDate) / (1000 * 60 * 60 * 24)));

      const recipient = credit.customerId.includes('@') ? credit.customerId : `${credit.customerId}@example.com`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: `Payment Reminder - Invoice ${credit.invoiceId}`,
        html: htmlTemplate
      };

      await transporter.sendMail(mailOptions);
      
      // Log successful reminder
      await ReminderLog.create({
        orgId: credit.orgId,
        customerId: credit.customerId,
        customerName: credit.customerId,
        invoiceId: credit.invoiceId,
        mode: 'Email',
        status: 'Sent',
        details: {
          subject: mailOptions.subject,
          recipient: recipient
        }
      });
      
      console.log(`📧 Reminder sent for credit ${credit._id}`);
    } catch (error) {
      // Log failed reminder
      await ReminderLog.create({
        orgId: credit.orgId,
        customerId: credit.customerId,
        customerName: credit.customerId,
        invoiceId: credit.invoiceId,
        mode: 'Email',
        status: 'Failed',
        details: {
          errorMessage: error.message
        }
      });
      
      console.error(`❌ Failed to send reminder for credit ${credit._id}:`, error);
    }
  }

  static startScheduler() {
    // Run daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily overdue credit check...');
      await this.checkOverdueCredits();
    });

    console.log('📅 Credit reminder scheduler started');
  }
}

module.exports = ReminderJob;