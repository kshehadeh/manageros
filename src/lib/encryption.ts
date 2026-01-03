/**
 * Encryption utilities for sensitive data like API keys
 * Uses AES encryption with a secret key from environment variables
 */

import 'server-only'
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'default-key-change-in-production'

/**
 * Encrypt a string using AES encryption
 */
export function encrypt(text: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
    return encrypted
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt a string using AES decryption
 */
export function decrypt(encryptedText: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8)

    if (!decryptedString) {
      throw new Error('Failed to decrypt data - invalid key or corrupted data')
    }

    return decryptedString
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt data')
  }
}
