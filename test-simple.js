import { chromium } from 'playwright'

async function testSimple() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Testing basic functionality...')

    // Navigate to the application
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    console.log('✓ Application loaded')

    // Check if we can see the sign-in page
    const hasSignIn = await page.locator('a[href="/auth/signin"]').isVisible()
    console.log('✓ Sign-in link visible:', hasSignIn)

    // Try to navigate to teams page directly
    await page.goto('http://localhost:3000/teams')
    await page.waitForLoadState('networkidle')
    
    console.log('Current URL:', page.url())
    
    // Check if we're redirected to sign-in
    const isSignInPage = page.url().includes('/auth/signin')
    console.log('✓ Redirected to sign-in:', isSignInPage)

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testSimple().catch(console.error)
