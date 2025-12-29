import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        mode: true,
        inputContent: true,
        uiStyle: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            content: true,
            messageType: true
          }
        }
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
