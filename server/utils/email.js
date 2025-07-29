import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, you can use a service like Ethereal Email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
        pass: process.env.EMAIL_PASS || 'ethereal.pass'
      }
    });
  }

  // For production, configure with your email service
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail', // gmail, outlook, etc.
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use app password for Gmail
    }
  });
};

const transporter = createTransporter();

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendVerificationEmail = async (email, token, username) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@neverrelapse.com',
    to: email,
    subject: 'Never Relapse - Email Verification',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Never Relapse</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #0ea5e9 0%, #075985 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { width: 48px; height: 48px; margin: 0 auto 16px; }
          .content { padding: 40px 30px; }
          .verification-code { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .code { font-size: 32px; font-weight: bold; color: #0ea5e9; letter-spacing: 4px; font-family: monospace; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 14px; color: #64748b; }
          .btn { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7v10c0 5.55 3.84 10 9 9 5.16 1 9-3.45 9-9V7l-10-5z"/>
                <path d="M8 11l2 2 4-4"/>
              </svg>
            </div>
            <h1>Welcome to Never Relapse</h1>
            <p>Your recovery journey starts here</p>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>Thank you for joining Never Relapse! To complete your registration and start your recovery journey, please verify your email address using the code below:</p>
            
            <div class="verification-code">
              <p style="margin: 0 0 10px 0; font-weight: 600;">Your Verification Code:</p>
              <div class="code">${token}</div>
            </div>
            
            <p>Enter this 6-digit code on the verification page to activate your account. This code will expire in 10 minutes for security reasons.</p>
            
            <p>If you didn't create an account with Never Relapse, please ignore this email.</p>
            
            <p>We're here to support you every step of the way. Your recovery journey matters, and we're honored to be part of it.</p>
            
            <p>Stay strong,<br>The Never Relapse Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
            <p>&copy; 2025 Never Relapse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, token, username) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@neverrelapse.com',
    to: email,
    subject: 'Never Relapse - Password Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Never Relapse</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { width: 48px; height: 48px; margin: 0 auto 16px; }
          .content { padding: 40px 30px; }
          .reset-code { background: #fef2f2; border: 2px solid #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
          .code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 4px; font-family: monospace; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 14px; color: #64748b; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7v10c0 5.55 3.84 10 9 9 5.16 1 9-3.45 9-9V7l-10-5z"/>
                <path d="M8 11l2 2 4-4"/>
              </svg>
            </div>
            <h1>Password Reset Request</h1>
            <p>Secure your Never Relapse account</p>
          </div>
          <div class="content">
            <h2>Hi ${username},</h2>
            <p>We received a request to reset your password for your Never Relapse account. Use the code below to reset your password:</p>
            
            <div class="reset-code">
              <p style="margin: 0 0 10px 0; font-weight: 600;">Your Reset Code:</p>
              <div class="code">${token}</div>
            </div>
            
            <p>Enter this 6-digit code on the password reset page to create a new password. This code will expire in 30 minutes for security reasons.</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
            </div>
            
            <p>Remember to choose a strong password with at least 8 characters, including uppercase and lowercase letters, numbers, and special characters.</p>
            
            <p>Stay secure,<br>The Never Relapse Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
            <p>&copy; 2025 Never Relapse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@neverrelapse.com',
    to: email,
    subject: 'Welcome to Never Relapse - Your Recovery Journey Begins',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Never Relapse</title>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #22c55e 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
          .logo { width: 48px; height: 48px; margin: 0 auto 16px; }
          .content { padding: 40px 30px; }
          .feature { display: flex; align-items: center; margin: 20px 0; padding: 16px; background: #f0fdf4; border-radius: 8px; }
          .feature-icon { width: 24px; height: 24px; margin-right: 16px; color: #22c55e; }
          .footer { background: #f8fafc; padding: 20px 30px; text-align: center; font-size: 14px; color: #64748b; }
          .btn { display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7v10c0 5.55 3.84 10 9 9 5.16 1 9-3.45 9-9V7l-10-5z"/>
                <path d="M8 11l2 2 4-4"/>
              </svg>
            </div>
            <h1>Welcome to Never Relapse!</h1>
            <p>Your recovery journey starts now</p>
          </div>
          <div class="content">
            <h2>Congratulations, ${username}!</h2>
            <p>You've taken the most important step by joining Never Relapse. We're here to support you every day of your recovery journey.</p>
            
            <h3>What you can do with Never Relapse:</h3>
            
            <div class="feature">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <div>
                <strong>Track Your Progress:</strong> Monitor your recovery with our real-time timer and see your streak grow day by day.
              </div>
            </div>
            
            <div class="feature">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="7"/>
                <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>
              </svg>
              <div>
                <strong>Earn Achievements:</strong> Unlock milestones and celebrate your victories, from your first day to one year and beyond.
              </div>
            </div>
            
            <div class="feature">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 9V5a3 3 0 0 0-6 0v4"/>
                <rect x="2" y="9" width="20" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="15" r="1"/>
              </svg>
              <div>
                <strong>Stay Motivated:</strong> Get daily inspirational quotes and track your statistics to stay focused on your goals.
              </div>
            </div>
            
            <p>Remember, recovery is a journey, not a destination. Every day you choose recovery is a victory worth celebrating. We believe in you and your strength to overcome challenges.</p>
            
            <p>If you ever need support or have questions, don't hesitate to reach out. You're not alone in this journey.</p>
            
            <p>Here's to your success and a brighter future!</p>
            
            <p>With support and encouragement,<br>The Never Relapse Team</p>
          </div>
          <div class="footer">
            <p>This email was sent to ${email}. You're receiving this because you created an account with Never Relapse.</p>
            <p>&copy; 2025 Never Relapse. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};