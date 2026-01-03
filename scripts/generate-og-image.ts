import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { createCanvas, registerFont, loadImage } from 'canvas'
import { existsSync } from 'fs'

/**
 * Generates an OG image combining the ManagerOS logo with "mpath" text
 * Uses Geist Mono (bold) for "mpath" and Geist Sans (medium) for the subtitle
 * Fonts are loaded from the geist npm package
 */
async function generateOGImage() {
  const logoPath = join(
    process.cwd(),
    'public',
    'images',
    'indigo-logo-white.png'
  )
  const outputPath = join(process.cwd(), 'public', 'og-image.png')

  // Use fonts from the geist npm package
  const geistMonoBoldPath = join(
    process.cwd(),
    'node_modules',
    'geist',
    'dist',
    'fonts',
    'geist-mono',
    'GeistMono-Bold.ttf'
  )
  const geistMonoPath = join(
    process.cwd(),
    'node_modules',
    'geist',
    'dist',
    'fonts',
    'geist-mono',
    'GeistMono-Regular.ttf'
  )
  const geistSansMediumPath = join(
    process.cwd(),
    'node_modules',
    'geist',
    'dist',
    'fonts',
    'geist-sans',
    'Geist-Medium.ttf'
  )
  const geistSansPath = join(
    process.cwd(),
    'node_modules',
    'geist',
    'dist',
    'fonts',
    'geist-sans',
    'Geist-Regular.ttf'
  )

  // Check which fonts are available
  const hasGeistMonoBold = existsSync(geistMonoBoldPath)
  const hasGeistMono = existsSync(geistMonoPath)
  const hasGeistSansMedium = existsSync(geistSansMediumPath)
  const hasGeistSans = existsSync(geistSansPath)

  // Register fonts from the geist package
  if (hasGeistMonoBold) {
    try {
      registerFont(geistMonoBoldPath, { family: 'Geist Mono', weight: 'bold' })
      console.log('✅ Registered Geist Mono Bold')
    } catch {
      console.warn('⚠️  Could not register Geist Mono Bold font')
    }
  } else if (hasGeistMono) {
    try {
      registerFont(geistMonoPath, { family: 'Geist Mono', weight: 'normal' })
      console.log('✅ Registered Geist Mono')
    } catch {
      console.warn('⚠️  Could not register Geist Mono font')
    }
  }

  if (hasGeistSansMedium) {
    try {
      registerFont(geistSansMediumPath, { family: 'Geist Sans', weight: '500' })
      console.log('✅ Registered Geist Sans Medium')
    } catch {
      console.warn('⚠️  Could not register Geist Sans Medium font')
    }
  } else if (hasGeistSans) {
    try {
      registerFont(geistSansPath, { family: 'Geist Sans', weight: 'normal' })
      console.log('✅ Registered Geist Sans')
    } catch {
      console.warn('⚠️  Could not register Geist Sans font')
    }
  }

  // Create canvas
  const width = 1200
  const height = 1200
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#05070f')
  gradient.addColorStop(1, '#0f172a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Load and draw logo
  const logoBuffer = await readFile(logoPath)
  const logoImage = await loadImage(logoBuffer)
  const logoSize = 400
  const logoX = (width - logoSize) / 2
  const logoY = 250
  ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)

  // Draw "mpath" text with Geist Mono (bold) and orange brackets
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Use Geist Mono if available, otherwise fallback
  const monoFont = hasGeistMonoBold || hasGeistMono ? 'Geist Mono' : 'monospace'
  ctx.font = `bold 140px "${monoFont}", monospace`

  // Measure text to position brackets correctly
  const mpathText = 'mpath'
  const textMetrics = ctx.measureText(mpathText)
  const textWidth = textMetrics.width
  const bracketSize = 20 // Size of brackets
  const bracketSpacing = 1 // Space between bracket and text

  // Draw orange brackets
  ctx.strokeStyle = '#f97316' // Orange color
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Left bracket: [
  const leftBracketX = width / 2 - textWidth / 2 - bracketSpacing - bracketSize
  const bracketY = 780
  const bracketHeight = 160
  ctx.beginPath()
  ctx.moveTo(leftBracketX, bracketY - bracketHeight / 2)
  ctx.lineTo(leftBracketX - bracketSize, bracketY - bracketHeight / 2)
  ctx.lineTo(leftBracketX - bracketSize, bracketY + bracketHeight / 2)
  ctx.lineTo(leftBracketX, bracketY + bracketHeight / 2)
  ctx.stroke()

  // Right bracket: ]
  const rightBracketX = width / 2 + textWidth / 2 + bracketSpacing
  ctx.beginPath()
  ctx.moveTo(rightBracketX, bracketY - bracketHeight / 2)
  ctx.lineTo(rightBracketX + bracketSize, bracketY - bracketHeight / 2)
  ctx.lineTo(rightBracketX + bracketSize, bracketY + bracketHeight / 2)
  ctx.lineTo(rightBracketX, bracketY + bracketHeight / 2)
  ctx.stroke()

  // Draw "mpath" text in white
  ctx.fillStyle = '#ffffff'
  ctx.fillText(mpathText, width / 2, bracketY)

  // Draw subtitle with Geist Sans (with more spacing below mpath)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
  const sansFont =
    hasGeistSansMedium || hasGeistSans ? 'Geist Sans' : 'sans-serif'
  ctx.font = `400 36px "${sansFont}", sans-serif`
  // Increased spacing: moved from 860 to 900 (40px more space)
  ctx.fillText('Management Operating System', width / 2, 900)

  // Convert canvas to buffer and save with sharp for better quality
  const canvasBuffer = canvas.toBuffer('image/png')
  await sharp(canvasBuffer)
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath)

  console.log(`✅ OG image generated successfully at ${outputPath}`)
  console.log(`   Dimensions: ${width}x${height}`)
  console.log(`   Fonts used: ${monoFont} (mpath), ${sansFont} (subtitle)`)
}

// Run the script
generateOGImage().catch(error => {
  console.error('❌ Error generating OG image:', error)
  process.exit(1)
})
