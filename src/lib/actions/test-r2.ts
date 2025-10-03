'use server'

import { getR2Config } from '@/lib/r2-upload'

export async function testR2Config() {
  try {
    const config = getR2Config()
    return {
      success: true,
      message: 'R2 configuration is valid',
      config: {
        accountId: config.R2_ACCOUNT_ID ? 'SET' : 'NOT SET',
        accessKeyId: config.R2_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
        secretAccessKey: config.R2_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
        bucketName: config.R2_BUCKET_NAME ? 'SET' : 'NOT SET',
        publicUrl: config.R2_PUBLIC_URL ? 'SET' : 'NOT SET',
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
