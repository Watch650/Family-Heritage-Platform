import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const personId = searchParams.get('personId')

    if (!personId) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 })
    }

    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { parentId: personId },
          { childId: personId }
        ]
      }
    })

    return NextResponse.json(relationships)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch relationships' }, { status: 500 })
  }
}