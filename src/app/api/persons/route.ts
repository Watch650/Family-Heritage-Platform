import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { Gender } from '@prisma/client'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const persons = await prisma.person.findMany({
      where: { createdById: user.id },
      include: {
        parentRelationships: true
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(persons)
  } catch (error) {
    console.error('Error in GET /api/persons:', error)
    return NextResponse.json({ error: 'Failed to fetch persons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const data = await request.json()

    // Convert gender string to enum value
    let gender: Gender | null = null
    if (data.gender) {
      gender = data.gender.toUpperCase() as Gender
    }

    const person = await prisma.person.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        deathDate: data.deathDate ? new Date(data.deathDate) : null,
        gender,
        biography: data.notes || null,
        createdById: user.id,
      }
    })

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error in POST /api/persons:', error)
    return NextResponse.json({ error: 'Failed to create person' }, { status: 500 })
  }
}