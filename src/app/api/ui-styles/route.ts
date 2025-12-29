import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const presets = await prisma.uIStylePreset.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        name: true,
        displayName: true,
        description: true,
      },
    })

    return NextResponse.json(presets)
  } catch (error) {
    console.error('Error fetching UI style presets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch UI style presets' },
      { status: 500 }
    )
  }
}
