import { chromium } from 'playwright'

async function testTeamCreationFinal() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Testing team creation with proper authentication...')

    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/signin')
    await page.waitForLoadState('networkidle')

    console.log('✓ Sign-in page loaded')

    // Fill in credentials and submit
    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for authentication to complete
    await page.waitForLoadState('networkidle')
    
    console.log('✓ Authenticated, current URL:', page.url())

    // Navigate to teams page
    await page.goto('http://localhost:3000/teams')
    await page.waitForLoadState('networkidle')
    
    console.log('✓ Teams page loaded, current URL:', page.url())

    // Check if we can see the teams page content
    const hasNewButton = await page.locator('text=New').isVisible()
    console.log('✓ New button visible:', hasNewButton)

    // Click New to create a team
    await page.click('text=New')
    await page.waitForLoadState('networkidle')
    
    console.log('✓ New team page loaded, current URL:', page.url())

    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter team name"]', { timeout: 10000 })
    
    // Fill in team details
    await page.fill('input[placeholder="Enter team name"]', 'Test Engineering Team')
    await page.fill('textarea[placeholder*="purpose"]', 'A test team for engineering work')
    
    console.log('✓ Team details filled')

    // Submit form
    await page.click('button[type="submit"]')
    await page.waitForLoadState('networkidle')
    
    console.log('✓ Form submitted, current URL:', page.url())

    // Check if we're back on teams page
    if (page.url().includes('/teams')) {
      console.log('✓ Successfully created team and redirected to teams page')
      
      // Check if the new team appears in the list
      const hasNewTeam = await page.locator('text=Test Engineering Team').isVisible()
      console.log('✓ New team visible in list:', hasNewTeam)
    } else {
      console.log('❌ Unexpected redirect to:', page.url())
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testTeamCreationFinal().catch(console.error)
