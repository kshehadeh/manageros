import nodemailer from 'nodemailer'

// Validate email configuration
function validateEmailConfig() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD']
  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required email configuration: ${missing.join(', ')}`
    )
  }
}

// Email configuration
let transporter: nodemailer.Transporter

try {
  validateEmailConfig()

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
} catch (error) {
  console.warn('Email configuration incomplete:', error)
  // Create a dummy transporter for development
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  })
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  try {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

    // Use the authenticated SMTP user as the from address to avoid domain mismatch
    const fromAddress = process.env.SMTP_FROM!

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: 'Reset your mpath password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset your password</h2>
          <p>You requested a password reset for your mpath account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            This email was sent from mpath. If you have any questions, please contact support.
          </p>
        </div>
      `,
      text: `
        Reset your password
        
        You requested a password reset for your mpath account.
        
        Click this link to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour. If you didn't request this password reset, you can safely ignore this email.
        
        This email was sent from mpath. If you have any questions, please contact support.
      `,
    }

    const result = await transporter.sendMail(mailOptions)

    // In development mode with dummy transporter, log the email content
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('=== PASSWORD RESET EMAIL (Development Mode) ===')
      console.log(`To: ${email}`)
      console.log(`From: ${fromAddress}`)
      console.log(`Subject: Reset your mpath password`)
      console.log(`Reset URL: ${resetUrl}`)
      console.log('===============================================')
      return { success: true, messageId: 'dev-mode' }
    }

    console.log('Password reset email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration() {
  try {
    // Skip verification in development mode without SMTP config
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
      console.log('Email configuration: Development mode (no SMTP configured)')
      return true
    }

    await transporter.verify()
    console.log('Email configuration is valid')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}

/**
 * Get email configuration status
 */
export function getEmailConfigStatus() {
  const config = {
    smtpHost: !!process.env.SMTP_HOST,
    smtpUser: !!process.env.SMTP_USER,
    smtpPassword: !!process.env.SMTP_PASSWORD,
    smtpPort: process.env.SMTP_PORT || '587',
    smtpSecure: process.env.SMTP_SECURE === 'true',
    nextAuthUrl: !!process.env.NEXTAUTH_URL,
  }

  const isConfigured = config.smtpHost && config.smtpUser && config.smtpPassword

  return {
    ...config,
    isConfigured,
    mode: isConfigured ? 'production' : 'development',
  }
}
