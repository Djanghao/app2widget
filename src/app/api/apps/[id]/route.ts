import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appId = params.id

    const app = await prisma.appMetadata.findUnique({
      where: { id: appId },
      select: {
        id: true,
        title: true,
        icon: true,
        description: true,
        osSystem: true,
        category: true,
        geometricDomain: true,
        price: true,
        currency: true,
        lang: true,
        wordCount: true,
        // screenshots excluded by default
      },
    })

    if (!app) {
      return NextResponse.json(
        { error: `App not found: ${appId}` },
        { status: 404 }
      )
    }

    return NextResponse.json(app)
  } catch (error) {
    console.error('Error in /api/apps/[id]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
