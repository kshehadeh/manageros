import { chromium } from 'playwright'

async function testAuth() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Testing authentication...')

    // Navigate to sign-in page
    await page.goto('http://localhost:3001/auth/signin')
    await page.waitForLoadState('networkidle')

    console.log('✓ Sign-in page loaded')

    // Fill in credentials
    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    
    console.log('✓ Credentials filled')

    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')

    console.log('✓ Form submitted, current URL:', page.url())

    // Check if we're still on sign-in page
    const isSignInPage = page.url().includes('/auth/signin')
    console.log('✓ Still on sign-in page:', isSignInPage)

    if (isSignInPage) {
      // Check for error messages
      const errorMessage = await page.locator('.bg-red-50, .text-red-600, .text-red-500, [role="alert"]').first().textContent().catch(() => null)
      console.log('Error message:', errorMessage)
      
      // Check if there's a loading state
      const isLoading = await page.locator('text=Signing in...').isVisible().catch(() => false)
      console.log('Is loading:', isLoading)
      
      // Wait a bit more to see if there's a delayed error
      await page.waitForTimeout(2000)
      const delayedErrorMessage = await page.locator('.bg-red-50, .text-red-600, .text-red-500, [role="alert"]').first().textContent().catch(() => null)
      console.log('Delayed error message:', delayedErrorMessage)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testAuth().catch(console.error)
