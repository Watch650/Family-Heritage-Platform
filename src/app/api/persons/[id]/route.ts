import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Gender } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()

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

    // Await the params to get the id
    const { id } = await Promise.resolve(params)
    const data = await request.json()

    const existingPerson = await prisma.person.findFirst({
      where: {
        id: id,
        createdById: user.id,
      },
    })

    if (!existingPerson) {
      return NextResponse.json(
        { error: 'Person not found or unauthorized' },
        { status: 404 }
      )
    }

    // Convert gender string to enum
    const gender = data.gender ? data.gender.toUpperCase() as Gender : null

    // Prepare update data with correct field names
    const updateData = {
      firstName: data.firstName,
      lastName: data.lastName || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      gender,
      biography: data.notes || null,
      photoPath: data.photoPath || null,
    }

    const person = await prisma.person.update({
      where: { id: id },
      data: updateData,
    })

    return NextResponse.json(person)
  } catch (error) {
    console.error('Error updating person:', error)
    return NextResponse.json(
      { error: 'Failed to update person' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = params

    const existingPerson = await prisma.person.findFirst({
      where: {
        id: id,
        createdById: user.id,
      },
    })

    if (!existingPerson) {
      return NextResponse.json(
        { error: 'Person not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete all relationships first
    await prisma.relationship.deleteMany({
      where: {
        OR: [
          { personOneId: id },
          { personTwoId: id }
        ]
      }
    })

    // Then delete the person
    await prisma.person.delete({
      where: { id: id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting person:', error)
    return NextResponse.json(
      { error: 'Failed to delete person' },
      { status: 500 }
    )
  }
}