#!/usr/bin/env bun

import {
  testResendConfiguration,
  getResendConfigStatus,
} from '../src/lib/email-resend'

/**
 * Test email configuration script
 * Run this to verify your email setup
 */
async function main() {
  console.log('=== Email Configuration Test ===')

  const config = getResendConfigStatus()
  console.log('Configuration Status:', config)

  if (config.isConfigured) {
    console.log('\nTesting Resend configuration...')
    const isValid = await testResendConfiguration()

    if (isValid) {
      console.log('✅ Email configuration is valid and ready to use!')
    } else {
      console.log(
        '❌ Email configuration test failed. Check your Resend API key.'
      )
    }
  } else {
    console.log('\n⚠️  Email configuration incomplete.')
    console.log('Required environment variables:')
    console.log('- RESEND_API_KEY')
    if (config.resendFromEmail) {
      console.log(`- From email: ${config.resendFromEmail}`)
    } else {
      console.log(
        '- RESEND_FROM_EMAIL (optional, defaults to SMTP_FROM or noreply@manageros.com)'
      )
    }
  }

  console.log('\n=== End Test ===')
}

main().catch(console.error)
