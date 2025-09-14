import { chromium } from 'playwright'

async function testSession() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Testing session handling...')

    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/signin')
    await page.waitForLoadState('networkidle')

    // Fill in credentials and submit
    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for authentication to complete
    await page.waitForLoadState('networkidle')
    
    console.log('✓ After auth, current URL:', page.url())

    // Check session via API
    const sessionResponse = await page.goto('http://localhost:3000/api/auth/session')
    const sessionText = await page.textContent('body')
    console.log('✓ Session API response:', sessionText)

    // Try to navigate to home page
    await page.goto('http://localhost:3000/')
    await page.waitForLoadState('networkidle')
    
    console.log('✓ Home page URL:', page.url())

    // Check if we can see authenticated content
    const hasSignOut = await page.locator('text=Sign Out').isVisible()
    console.log('✓ Sign Out visible:', hasSignOut)

    // Try to navigate to teams page
    await page.goto('http://localhost:3000/teams')
    await page.waitForLoadState('networkidle')
    
    console.log('✓ Teams page URL:', page.url())

    // Check if we're still authenticated
    const stillHasSignOut = await page.locator('text=Sign Out').isVisible()
    console.log('✓ Still authenticated on teams page:', stillHasSignOut)

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testSession().catch(console.error)
