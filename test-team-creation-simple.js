import { chromium } from 'playwright'

async function testTeamCreation() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Testing team creation...')

    // Navigate to teams page
    await page.goto('http://localhost:3000/teams')
    await page.waitForLoadState('networkidle')

    console.log('✓ Teams page loaded, current URL:', page.url())

    // Check if we're redirected to sign-in
    if (page.url().includes('/auth/signin')) {
      console.log('Redirected to sign-in, trying to sign in...')
      
      // Fill in credentials
      await page.fill('input[name="email"]', 'admin@acme.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      
      // Wait for navigation
      await page.waitForLoadState('networkidle')
      
      // Try to navigate to teams again
      await page.goto('http://localhost:3000/teams')
      await page.waitForLoadState('networkidle')
    }

    console.log('✓ After auth, current URL:', page.url())

    // Try to create a team
    await page.click('text=New')
    await page.waitForLoadState('networkidle')
    
    console.log('✓ New team page loaded, current URL:', page.url())

    // Fill in team details
    await page.fill('input[placeholder="Enter team name"]', 'Test Team')
    await page.fill('textarea[placeholder*="purpose"]', 'Test team description')
    
    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    
    console.log('✓ Form submitted, current URL:', page.url())

    // Check if we're back on teams page
    if (page.url().includes('/teams')) {
      console.log('✓ Successfully created team and redirected to teams page')
    } else {
      console.log('❌ Unexpected redirect to:', page.url())
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testTeamCreation().catch(console.error)
