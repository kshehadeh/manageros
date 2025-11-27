import { Resend } from 'resend'
import type { ReactElement } from 'react'

// Validate Resend configuration
function validateResendConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing required email configuration: RESEND_API_KEY')
  }
}

// Initialize Resend client
let resend: Resend | null = null

try {
  validateResendConfig()
  resend = new Resend(process.env.RESEND_API_KEY)
} catch (error) {
  console.warn('Resend configuration incomplete:', error)
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  react?: ReactElement
}

/**
 * Send an email using Resend API
 */
export async function sendEmail(options: SendEmailOptions) {
  if (!resend) {
    throw new Error(
      'Resend is not configured. Please set RESEND_API_KEY environment variable.'
    )
  }

  const from =
    options.from || process.env.RESEND_FROM_EMAIL || 'noreply@manageros.com'

  try {
    // If react component is provided, use it directly
    if (options.react) {
      const result = await resend.emails.send({
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        react: options.react,
      })

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`)
      }

      return {
        success: true,
        messageId: result.data?.id,
      }
    }

    // Otherwise, use html/text
    if (!options.html && !options.text) {
      throw new Error('Either html, text, or react component must be provided')
    }

    const emailData: {
      from: string
      to: string[]
      subject: string
      html?: string
      text?: string
    } = {
      from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    }

    if (options.html) {
      emailData.html = options.html
    }
    if (options.text) {
      emailData.text = options.text
    }

    // Type assertion needed due to Resend's strict typing
    const result = await resend.emails.send(
      emailData as Parameters<typeof resend.emails.send>[0]
    )

    if (result.error) {
      throw new Error(`Resend API error: ${result.error.message}`)
    }

    return {
      success: true,
      messageId: result.data?.id,
    }
  } catch (error) {
    console.error('Error sending email via Resend:', error)
    throw error
  }
}

/**
 * Test Resend configuration
 */
export async function testResendConfiguration() {
  try {
    if (!resend) {
      console.log(
        'Resend configuration: Not configured (RESEND_API_KEY missing)'
      )
      return false
    }

    // Resend doesn't have a verify method, so we'll just check if the client is initialized
    console.log('Resend configuration is valid')
    return true
  } catch (error) {
    console.error('Resend configuration error:', error)
    return false
  }
}

/**
 * Get Resend configuration status
 */
export function getResendConfigStatus() {
  const config = {
    resendApiKey: !!process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL || null,
  }

  const isConfigured = config.resendApiKey

  return {
    ...config,
    isConfigured,
    mode: isConfigured ? 'production' : 'development',
  }
}
