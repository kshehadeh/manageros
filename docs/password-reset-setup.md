# Password Reset Setup

This document describes the password reset functionality and how to configure it.

## Overview

The password reset flow allows users to reset their passwords via email when they forget their credentials. The flow includes:

1. User requests password reset by entering their email
2. System generates a secure token and sends reset email
3. User clicks link in email to access reset form
4. User enters new password and submits
5. System validates token and updates password

## Email Configuration

The system uses Resend API for email delivery (recommended) or SMTP for backward compatibility.

### Resend API (Recommended)

To enable email sending with Resend, configure the following environment variables:

```env
# Resend API Configuration
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application URL (used in reset links) - DO NOT include /api/auth
NEXTAUTH_URL=http://localhost:3000
```

**Setup Steps:**

1. Sign up for a Resend account at [resend.com](https://resend.com)
2. Create an API key in your Resend dashboard
3. Add and verify your sending domain in Resend
4. Set `RESEND_API_KEY` to your API key
5. Set `RESEND_FROM_EMAIL` to a verified email address or domain

**Benefits of Resend:**

- Better deliverability than SMTP
- Built-in email tracking and analytics
- React email templates support
- Simplified configuration

### SMTP Configuration (Legacy)

For backward compatibility, SMTP is still supported:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com

# Application URL (used in reset links) - DO NOT include /api/auth
NEXTAUTH_URL=http://localhost:3000
```

**Important**: The system automatically uses `SMTP_USER` as the "from" address to avoid domain authorization issues. Do not set `SMTP_FROM` unless you have verified domain ownership with your email provider.

### Gmail Setup (SMTP)

For Gmail, you'll need to:

1. Enable 2-factor authentication
2. Generate an "App Password" for this application
3. Use the app password as `SMTP_PASSWORD`

### Other SMTP Providers

The system supports most SMTP providers:

- **SendGrid**: Use their SMTP settings
- **Mailgun**: Use their SMTP settings
- **AWS SES**: Use their SMTP settings
- **Custom SMTP**: Configure with your provider's settings

## Security Features

- **Token Expiration**: Reset tokens expire after 1 hour
- **Single Use**: Tokens are deleted after successful password reset
- **Secure Generation**: Tokens are cryptographically secure random strings
- **Email Enumeration Protection**: Same response regardless of whether email exists
- **Automatic Cleanup**: Expired tokens are automatically cleaned up

## Maintenance

### Cleanup Expired Tokens

Run the cleanup script periodically to remove expired tokens:

```bash
bun scripts/cleanup-expired-tokens.ts
```

You can set up a cron job to run this daily:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/manageros && bun scripts/cleanup-expired-tokens.ts
```

## Testing

### Development Testing

In development, if email is not configured, the reset token will be logged to the console:

```
Password reset token for user@example.com: abc123...
Reset link: http://localhost:3000/auth/reset-password?token=abc123...
```

### Production Testing

1. Ensure email configuration is working
2. Test the full flow:
   - Request password reset
   - Check email for reset link
   - Click link and reset password
   - Verify you can sign in with new password

## Troubleshooting

### Email Not Sending

1. **Domain Authorization Error (450 Not authorized)**
   - The system now automatically uses `SMTP_USER` as the "from" address
   - Ensure your SMTP credentials match the domain you're sending from
   - For Gmail, use your Gmail address as `SMTP_USER`

2. **Check SMTP configuration**
   - Verify credentials and permissions
   - Check server logs for email errors
   - Test SMTP connection manually

3. **Development Mode**
   - If SMTP is not configured, reset tokens are logged to console
   - Check server logs for the reset URL
   - Copy the URL and test the reset flow manually

### Token Validation Issues

1. **Incorrect NEXTAUTH_URL**
   - Ensure `NEXTAUTH_URL` is set to your base URL (e.g., `http://localhost:3000`)
   - Do NOT include `/api/auth` in the NEXTAUTH_URL
   - Wrong: `NEXTAUTH_URL=http://localhost:3000/api/auth`
   - Correct: `NEXTAUTH_URL=http://localhost:3000`

2. **Token Expiration**
   - Ensure `NEXTAUTH_URL` is correctly set
   - Check that tokens are not expired
   - Verify database connection

### Reset Link Not Working

1. Check that the reset URL is accessible
2. Verify token format in URL
3. Check for URL encoding issues

## API Endpoints

- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/validate-reset-token` - Validate reset token
- `POST /api/auth/reset-password` - Reset password with token

## Database Schema

The `PasswordResetToken` model stores:

- `id`: Unique identifier
- `email`: User's email address
- `token`: Secure reset token
- `expires`: Token expiration timestamp
- `createdAt`: Token creation timestamp
