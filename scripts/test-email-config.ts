#!/usr/bin/env bun

import { testEmailConfiguration, getEmailConfigStatus } from '../src/lib/email'

/**
 * Test email configuration script
 * Run this to verify your email setup
 */
async function main() {
  console.log('=== Email Configuration Test ===')

  const config = getEmailConfigStatus()
  console.log('Configuration Status:', config)

  if (config.isConfigured) {
    console.log('\nTesting SMTP connection...')
    const isValid = await testEmailConfiguration()

    if (isValid) {
      console.log('✅ Email configuration is valid and ready to use!')
    } else {
      console.log(
        '❌ Email configuration test failed. Check your SMTP settings.'
      )
    }
  } else {
    console.log('\n⚠️  Email configuration incomplete.')
    console.log('Required environment variables:')
    console.log('- SMTP_HOST')
    console.log('- SMTP_USER')
    console.log('- SMTP_PASSWORD')
    console.log(
      '\nIn development mode, password reset tokens will be logged to console.'
    )
  }

  console.log('\n=== End Test ===')
}

main().catch(console.error)
