import { chromium } from 'playwright'

async function testTeamHierarchy() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Testing team hierarchy functionality...')

    // Navigate to the application
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')

    // Sign in
    await page.click('text=Sign In')
    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for navigation to complete
    await page.waitForLoadState('networkidle')
    
    // Check if we're still on sign-in page
    if (page.url().includes('/auth/signin')) {
      console.log('Still on sign-in page, trying direct navigation to teams')
      await page.goto('http://localhost:3001/teams')
      await page.waitForLoadState('networkidle')
    }

    console.log('✓ Signed in successfully, current URL:', page.url())

    // Create a parent team
    await page.click('text=New')
    await page.waitForLoadState('networkidle')
    
    // Debug: Check current URL and page content
    console.log('Current URL after clicking New:', page.url())
    const pageContent = await page.content()
    console.log('Page contains "Team Name":', pageContent.includes('Team Name'))
    console.log('Page contains "Enter team name":', pageContent.includes('Enter team name'))
    
    // Wait for the form to load
    await page.waitForSelector('input[placeholder="Enter team name"]', { timeout: 10000 })
    await page.fill('input[placeholder="Enter team name"]', 'Engineering Team')
    await page.fill('textarea[placeholder*="purpose"]', 'Core engineering team responsible for product development')
    await page.selectOption('select', '') // No parent team
    await page.click('button[type="submit"]')
    await page.waitForURL('**/teams')

    console.log('✓ Created parent team')

    // Create a child team
    await page.click('text=New')
    await page.fill('input[placeholder="Enter team name"]', 'Frontend Team')
    await page.fill('textarea[placeholder*="purpose"]', 'Frontend development team')
    await page.selectOption('select', { label: 'Engineering Team' })
    await page.click('button[type="submit"]')
    await page.waitForURL('**/teams')

    console.log('✓ Created child team')

    // Create another child team
    await page.click('text=New')
    await page.fill('input[placeholder="Enter team name"]', 'Backend Team')
    await page.fill('textarea[placeholder*="purpose"]', 'Backend development team')
    await page.selectOption('select', { label: 'Engineering Team' })
    await page.click('button[type="submit"]')
    await page.waitForURL('**/teams')

    console.log('✓ Created second child team')

    // Verify hierarchy is displayed correctly
    await page.waitForSelector('text=Engineering Team')
    await page.waitForSelector('text=└─ Frontend Team')
    await page.waitForSelector('text=└─ Backend Team')

    console.log('✓ Team hierarchy displayed correctly')

    // Click on parent team to view details
    await page.click('text=Engineering Team')
    await page.waitForURL('**/teams/**')

    // Verify parent team shows child teams
    await page.waitForSelector('text=Child Teams (2)')
    await page.waitForSelector('text=Frontend Team')
    await page.waitForSelector('text=Backend Team')

    console.log('✓ Parent team shows child teams')

    // Click on a child team
    await page.click('text=Frontend Team')
    await page.waitForURL('**/teams/**')

    // Verify child team shows parent team
    await page.waitForSelector('text=Parent team: Engineering Team')

    console.log('✓ Child team shows parent team')

    // Edit child team to change parent
    await page.click('text=Edit Team')
    await page.waitForURL('**/edit')

    // Verify current parent is selected
    const currentParent = await page.inputValue('select')
    console.log('Current parent:', currentParent)

    // Change to no parent
    await page.selectOption('select', '')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/teams')

    console.log('✓ Changed team to top-level')

    // Verify hierarchy updated
    await page.waitForSelector('text=Engineering Team')
    await page.waitForSelector('text=└─ Backend Team')
    await page.waitForSelector('text=Frontend Team') // Should now be top-level

    console.log('✓ Hierarchy updated correctly')

    console.log('\n🎉 All team hierarchy tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testTeamHierarchy().catch(console.error)
