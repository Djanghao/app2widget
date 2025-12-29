import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create UI Style Presets
  const presets = [
    {
      name: 'modern-minimal',
      displayName: 'Modern Minimal',
      description: 'Clean, light background with restrained colors and generous whitespace. Similar to Linear or Notion.',
      promptAddition: `UI Style: Modern Minimal
- Use light backgrounds (#FFFFFF, #F8F9FA)
- Restrained color palette (grays, one accent color)
- Generous padding and whitespace
- Clean typography hierarchy
- Minimal borders, use subtle shadows
- Reference: Linear, Notion aesthetic`,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'enterprise-dashboard',
      displayName: 'Enterprise Dashboard',
      description: 'Professional, data-focused design with strong contrast and clear KPIs. Suitable for business applications.',
      promptAddition: `UI Style: Enterprise Dashboard
- Use neutral or dark backgrounds (#1F2937, #374151)
- High-contrast text and data visualization
- Emphasis on numbers and metrics
- Professional, stable appearance
- Clear data hierarchy
- Reference: BI tools, analytics dashboards`,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'vibrant-product',
      displayName: 'Vibrant Product',
      description: 'Bold colors with strong visual emphasis. Eye-catching like SaaS product landing pages.',
      promptAddition: `UI Style: Vibrant / Product-like
- Use bold, vibrant primary color
- Strong visual emphasis on key elements
- Gradient or colorful accents
- Engaging, energetic feel
- Clear call-to-action styling
- Reference: SaaS product pages, modern apps`,
      isActive: true,
      sortOrder: 3,
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
