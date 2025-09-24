# Cloudflare R2 Setup for Image Uploads

This document explains how to set up Cloudflare R2 for image uploads in the GitHub bug reporting feature.

## Overview

Cloudflare R2 is used to store images uploaded with bug reports. R2 provides:

- Free tier with generous limits
- Fast global CDN
- Direct public URLs
- S3-compatible API

## Setup Steps

### 1. Create Cloudflare R2 Bucket

1. Log in to your Cloudflare dashboard
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Choose a bucket name (e.g., `manageros-images`)
5. Select a location close to your users
6. Click **Create bucket**

### 2. Configure Public Access

1. Go to your bucket settings
2. Navigate to **Settings** → **Public access**
3. Enable **Allow Access** for public access
4. Note the **Custom Domain** or **R2.dev subdomain** URL

### 3. Create API Token

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use **Custom token** template
4. Configure permissions:
   - **Account** → **Cloudflare R2:Edit**
   - **Zone Resources** → **Include** → **All zones** (or specific zone)
5. Click **Continue to summary** → **Create Token**
6. Copy the token (you won't see it again)

### 4. Get Account ID

1. In your Cloudflare dashboard, go to **My Profile**
2. Copy your **Account ID** from the right sidebar

### 5. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_api_token_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_api_token_here
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.your-domain.com
```

**Note**: For R2, both `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` use the same API token value.

### 6. Custom Domain (Optional but Recommended)

For better branding and control:

1. In your bucket settings, go to **Custom Domains**
2. Add a custom domain (e.g., `images.yourdomain.com`)
3. Configure DNS records as instructed
4. Update `CLOUDFLARE_R2_PUBLIC_URL` to use your custom domain

## Technical Implementation

The image upload feature uses **Cloudflare R2's S3-compatible API** with the AWS SDK:

- **SDK**: `@aws-sdk/client-s3` for S3-compatible operations
- **Endpoint**: `https://{account-id}.r2.cloudflarestorage.com`
- **Authentication**: AWS-style access keys (same as R2 API tokens)
- **Region**: `auto` (Cloudflare's automatic region selection)
- **Method**: `PutObjectCommand` for uploading files

This approach provides:

- **Standard S3 API**: Uses well-tested AWS SDK patterns
- **Better Error Handling**: More detailed error messages and status codes
- **Reliability**: S3-compatible API is more stable than native R2 API
- **Future Compatibility**: Easy to migrate to other S3-compatible services

## File Organization

Images are organized in the bucket as:

```
bucket-name/
└── bug-reports/
    ├── 1703123456789-abc123def456.png
    ├── 1703123456790-xyz789ghi012.jpg
    └── ...
```

Each filename includes:

- Timestamp for uniqueness
- Random string for additional uniqueness
- Original file extension

## Security Considerations

- **Public Access**: Images are publicly accessible via direct URLs
- **No Authentication**: Anyone with the URL can view the image
- **File Validation**: Only image files (JPEG, PNG, GIF, WebP) are allowed
- **Size Limits**: Maximum 10MB per image
- **Rate Limiting**: Cloudflare provides built-in DDoS protection

## Cost

Cloudflare R2 free tier includes:

- **Storage**: 10 GB per month
- **Class A Operations**: 1 million requests per month
- **Class B Operations**: 10 million requests per month
- **Egress**: 10 GB per month

For most applications, this is more than sufficient.

## Troubleshooting

### Common Issues

1. **"R2 configuration is incomplete"**
   - Check that all environment variables are set
   - Verify the API token has R2 permissions

2. **"Failed to upload image to R2: 403 Forbidden"**
   - API token may not have sufficient permissions
   - Check that the token includes R2:Edit permission

3. **"Failed to upload image to R2: 404 Not Found"**
   - Verify the bucket name is correct
   - Check that the account ID is correct

4. **Images not displaying**
   - Verify the public URL is correct
   - Check that public access is enabled on the bucket
   - Ensure the custom domain (if used) is properly configured

### Testing Upload

You can test the R2 configuration by:

1. Setting up the environment variables
2. Running the application
3. Submitting a bug report with an image
4. Checking the GitHub issue to see if the image appears

### Monitoring Usage

Monitor your R2 usage in the Cloudflare dashboard:

1. Go to **Analytics & Logs** → **R2**
2. View storage usage, request counts, and egress
3. Set up alerts for approaching limits

## Alternative: Using R2.dev Subdomain

If you don't want to set up a custom domain, you can use the default R2.dev subdomain:

1. In your bucket settings, note the **R2.dev subdomain** URL
2. Use this URL as your `CLOUDFLARE_R2_PUBLIC_URL`
3. Example: `https://pub-abc123def456.r2.dev`

This approach is simpler but less customizable.
