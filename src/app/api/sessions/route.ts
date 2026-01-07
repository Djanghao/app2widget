import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        inputContent: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
