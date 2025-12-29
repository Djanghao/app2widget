import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create UI Style Presets
  const presets = [
    {
      name: 'ios-stock-widget',
      displayName: 'iOS Stock Widget',
      description: 'Native iOS widget style with frosted glass effect, rounded corners, and system font. Perfect for iPhone home/lock screen.',
      promptAddition: `UI Style: iOS Stock Widget
- Use semi-transparent frosted glass background with blur effect (backdrop-filter: blur(20px))
- Rounded corners (border-radius: 20px-28px depending on widget size)
- Use iOS system font stack: -apple-system, SF Pro Display
- White text with subtle shadows on translucent backgrounds
- Support light and dark mode with adaptive colors
- Padding: 16-20px, compact layout to maximize info density
- Small widget (2x2): Single metric with icon
- Medium widget (4x2): 2-4 data points in grid
- Large widget (4x4): Rich content with multiple sections
- Use SF Symbols style icons when possible
- Subtle elevation with soft shadows
- Reference: Apple Weather, Calendar, Stocks widgets`,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'material-you',
      displayName: 'Material You',
      description: 'Android Material Design 3 style with dynamic color theming, rounded containers, and elevation.',
      promptAddition: `UI Style: Material You (Material Design 3)
- Use Material You color system with primary, secondary, tertiary colors
- Rounded corner containers (border-radius: 28px for cards)
- Surface elevation with tonal colors instead of shadows
- Use Google Sans or Roboto font family
- Pill-shaped buttons and chips
- Dynamic color theming that adapts to wallpaper
- Padding: 16-24px with consistent 8px grid system
- Use FAB (Floating Action Button) for primary actions
- Rich color fills with 60-30-10 color ratio
- Emphasis on depth through layering
- Reference: Google Pixel widgets, Material Design 3 spec`,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'neomorphism',
      displayName: 'Neomorphism',
      description: 'Soft UI with embossed/debossed elements, subtle shadows, and minimalist aesthetic.',
      promptAddition: `UI Style: Neomorphism (Soft UI)
- Monochromatic color scheme, typically light grays (#E0E5EC)
- Soft, subtle shadows: inset and outset for depth
- box-shadow: 9px 9px 16px rgba(163,177,198,0.6), -9px -9px 16px rgba(255,255,255,0.5)
- Minimal contrast between elements and background
- Rounded corners (border-radius: 12-20px)
- Flat icons with same background color as widget
- Use subtle gradients for depth perception
- Padding: 20-24px
- Emphasis on tactile, 3D-like feel
- Reference: Neumorphism design trend, soft UI patterns`,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'glassmorphism',
      displayName: 'Glassmorphism',
      description: 'Translucent glass-like cards with vibrant backgrounds and blur effects. Modern and eye-catching.',
      promptAddition: `UI Style: Glassmorphism
- Semi-transparent background: rgba(255, 255, 255, 0.1-0.25)
- Backdrop blur: backdrop-filter: blur(10px) saturate(180%)
- Border: 1px solid rgba(255, 255, 255, 0.18)
- Vibrant gradient backgrounds behind glass panels
- Use vivid accent colors (#6366F1, #8B5CF6, #EC4899)
- White or light text for contrast
- Rounded corners: border-radius: 16-24px
- Soft shadows for floating effect
- Padding: 16-20px
- Multi-layered depth with overlapping glass panels
- Reference: macOS Big Sur, Windows 11 Acrylic`,
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'modern-minimal',
      displayName: 'Modern Minimal',
      description: 'Clean, light background with restrained colors and generous whitespace. Similar to Linear or Notion.',
      promptAddition: `UI Style: Modern Minimal
- Use light backgrounds (#FFFFFF, #F8F9FA)
- Restrained color palette (grays, one accent color like #0066FF)
- Generous padding: 20-28px and whitespace
- Clean typography hierarchy: 14px body, 18-24px headings
- Minimal borders (1px #E5E7EB), use subtle shadows
- Monochrome icons with single accent color
- Card-based layout with subtle elevation
- Focus on content hierarchy and breathing room
- Font: Inter, System UI, or similar clean sans-serif
- Reference: Linear, Notion, Apple.com aesthetic`,
      isActive: true,
      sortOrder: 5,
    },
    {
      name: 'dark-mode-amoled',
      displayName: 'Dark Mode (AMOLED)',
      description: 'Pure black background optimized for OLED screens with vibrant accent colors and high contrast.',
      promptAddition: `UI Style: Dark Mode AMOLED
- Pure black background (#000000) for OLED power saving
- High contrast white text (#FFFFFF) for readability
- Vibrant accent colors: electric blue (#00D4FF), neon purple (#B026FF)
- Use colored icons and graphics to pop against black
- Minimal borders, rely on spacing for separation
- Glowing effects on interactive elements
- Card backgrounds: very dark gray (#0A0A0A, #121212)
- Padding: 16-20px
- Font weight: 500-600 for better visibility
- Reference: Reddit dark mode, Discord, Twitter night mode`,
      isActive: true,
      sortOrder: 6,
    },
    {
      name: 'gradient-vibrant',
      displayName: 'Gradient Vibrant',
      description: 'Bold gradient backgrounds with modern glass cards. Energetic and colorful for lifestyle apps.',
      promptAddition: `UI Style: Gradient Vibrant
- Rich gradient backgrounds: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
- Alternative gradients: sunset, ocean, aurora themes
- White or light colored content cards on gradient
- Card backgrounds: rgba(255, 255, 255, 0.15) with backdrop blur
- High contrast white text with subtle shadows
- Rounded corners: 20px+
- Colorful icons that complement gradient
- Padding: 18-24px
- Use smooth color transitions
- Reference: Instagram stories, Spotify, Apple Music`,
      isActive: true,
      sortOrder: 7,
    },
    {
      name: 'retro-brutal',
      displayName: 'Retro Brutalism',
      description: 'Bold borders, stark contrast, primary colors, and geometric shapes. Inspired by brutalist web design.',
      promptAddition: `UI Style: Retro Brutalism
- Bold black borders: 2-4px solid #000000
- High contrast color blocks: bright yellow (#FFFF00), red (#FF0000), blue (#0000FF)
- White or off-white backgrounds (#FFFFFF, #FFFEF7)
- Sharp corners (border-radius: 0) or minimal rounding
- Heavy, bold typography (font-weight: 700-900)
- Brutalist grid layouts with asymmetric composition
- Overlapping elements and layering
- Use primary/secondary colors without gradients
- Padding: 12-16px with tight spacing
- Reference: Brutalist web design, 60s-70s Swiss design`,
      isActive: true,
      sortOrder: 8,
    },
    {
      name: 'widget-compact-info',
      displayName: 'Compact Info Dense',
      description: 'Information-dense layout optimized for small widget sizes. Clear hierarchy with minimal decoration.',
      promptAddition: `UI Style: Compact Info Dense
- Maximize information display in limited space
- Small font sizes: 10-12px for labels, 16-20px for key metrics
- Tight padding: 12-16px
- Use icon + text combinations to save space
- Grid or list layout with dividers
- Muted background (#F5F5F5 or #1C1C1E for dark)
- Accent color only for critical info
- Tabular data presentation
- Compact line-height: 1.2-1.4
- Abbreviate labels when needed
- Reference: Yahoo Finance widget, Google Calendar widget`,
      isActive: true,
      sortOrder: 9,
    },
    {
      name: 'playful-rounded',
      displayName: 'Playful Rounded',
      description: 'Fun, friendly design with extra rounded corners, pastel colors, and cheerful illustrations.',
      promptAddition: `UI Style: Playful Rounded
- Extra rounded corners: border-radius: 24-32px
- Soft pastel color palette: #FFE5E5, #E5F3FF, #FFF4E5, #E8F5E9
- Playful, friendly icons and illustrations
- Chunky, rounded typography (font-family: Nunito, Quicksand, Rubik)
- Soft shadows for depth
- Use emoji or simple illustrations
- Warm, inviting color combinations
- Padding: 20-24px
- Smooth animations and transitions
- Reference: Headspace, Duolingo, kid-friendly apps`,
      isActive: true,
      sortOrder: 10,
    },
    {
      name: 'fitness-sport',
      displayName: 'Fitness & Sport',
      description: 'High-energy design with bold metrics, progress indicators, and motivational colors.',
      promptAddition: `UI Style: Fitness & Sport
- Bold, energetic colors: electric green (#00FF00), orange (#FF6B00), red (#FF0000)
- Large, prominent numbers for key metrics (32-48px)
- Progress bars and circular progress indicators
- Dark background (#1C1C1E) with neon accents
- Strong typography: font-weight: 700-800
- Dynamic gradients on progress elements
- Icon-heavy design with activity symbols
- Padding: 16-20px
- Emphasize achievement and progress
- Reference: Apple Fitness, Strava, Nike Run Club widgets`,
      isActive: true,
      sortOrder: 11,
    },
    {
      name: 'productivity-focus',
      displayName: 'Productivity Focus',
      description: 'Calm, distraction-free design with task prioritization and clean checkboxes.',
      promptAddition: `UI Style: Productivity Focus
- Calm, neutral backgrounds: #FAFAFA or #F8F9FA
- Minimal color usage, single accent color for priority
- Clean checkboxes and task indicators
- Clear typography hierarchy: 14px body, 16px headings
- List-based layouts with subtle dividers
- Due dates and tags with muted colors
- Padding: 16-20px
- Use of whitespace to reduce cognitive load
- Soft blues (#4A90E2) or greens (#10B981) for accents
- Reference: Todoist, Things 3, Notion task views`,
      isActive: true,
      sortOrder: 12,
    },
    {
      name: 'weather-atmospheric',
      displayName: 'Weather Atmospheric',
      description: 'Dynamic backgrounds that reflect weather conditions with appropriate colors and imagery.',
      promptAddition: `UI Style: Weather Atmospheric
- Dynamic gradient backgrounds based on conditions:
  * Sunny: #FFD93D to #6BCF7E
  * Cloudy: #BDC3C7 to #2C3E50
  * Rainy: #3A5169 to #1E3A52
  * Night: #0F2027 to #2C5364
- Large temperature display: 42-56px
- Weather icons with animated effects
- Semi-transparent cards for forecast data
- White text with shadows for readability
- Padding: 20-24px
- Include sunrise/sunset indicators
- Wind, humidity as secondary metrics
- Reference: Apple Weather, Dark Sky, Tomorrow.io`,
      isActive: true,
      sortOrder: 13,
    },
    {
      name: 'finance-stock',
      displayName: 'Finance & Stocks',
      description: 'Professional trading view with charts, real-time data, and color-coded gains/losses.',
      promptAddition: `UI Style: Finance & Stocks
- Dark professional background: #131722 or white #FFFFFF
- Red (#FF4444, #DC2626) for losses, green (#00C853, #10B981) for gains
- Prominent price display: 28-36px
- Mini candlestick or line charts
- Percentage changes with up/down arrows
- Tabular layout for multiple stocks
- Monospace font for numbers: 'Monaco', 'Courier New'
- Ticker symbols in bold or accent color
- Padding: 14-18px for data density
- Reference: Bloomberg Terminal, Robinhood, Yahoo Finance`,
      isActive: true,
      sortOrder: 14,
    },
    {
      name: 'social-engagement',
      displayName: 'Social Engagement',
      description: 'Vibrant social media style with profile pictures, engagement metrics, and colorful interactions.',
      promptAddition: `UI Style: Social Engagement
- Bright, engaging colors: Instagram gradient, Twitter blue (#1DA1F2)
- Profile pictures and avatars (circular, 32-48px)
- Engagement metrics: likes, comments, shares with icons
- Card-based layout with clear separation
- Use of colorful icons and emoji
- Light background (#FFFFFF) or dark (#000000) with colored accents
- Padding: 16-20px
- Rounded profile images and buttons
- Truncated text with "Read more" for space efficiency
- Reference: Instagram widgets, Twitter, Facebook feed cards`,
      isActive: true,
      sortOrder: 15,
    },
  ]

  for (const preset of presets) {
    await prisma.uIStylePreset.upsert({
      where: { name: preset.name },
      update: preset,
      create: preset,
    })
  }

  console.log('Seeding completed: UI Style Presets created')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
