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
      // Include screenshots in this API
    })

    if (!app) {
      return NextResponse.json(
        { error: `App not found: ${appId}` },
        { status: 404 }
      )
    }

    return NextResponse.json(app)
  } catch (error) {
    console.error('Error in /api/apps/[id]/screenshot:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
