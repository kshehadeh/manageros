import { chromium } from 'playwright'

async function testNextAuth() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('Testing NextAuth API...')

    // Navigate to sign-in page
    await page.goto('http://localhost:3000/auth/signin')
    await page.waitForLoadState('networkidle')

    console.log('✓ Sign-in page loaded')

    // Fill in credentials
    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    
    console.log('✓ Credentials filled')

    // Listen for network requests
    page.on('request', request => {
      if (request.url().includes('/api/auth/')) {
        console.log('Auth request:', request.method(), request.url())
      }
    })

    page.on('response', response => {
      if (response.url().includes('/api/auth/')) {
        console.log('Auth response:', response.status(), response.url())
        if (response.status() !== 200) {
          response.text().then(text => {
            console.log('Response body:', text)
          })
        }
      }
    })

    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait a bit to see the network requests
    await page.waitForTimeout(3000)

    console.log('✓ Form submitted, current URL:', page.url())

    // Check for any error messages on the page
    const errorElement = await page.locator('.bg-red-50, .text-red-600, .text-red-500').first().textContent().catch(() => null)
    if (errorElement) {
      console.log('Error message:', errorElement)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

testNextAuth().catch(console.error)
