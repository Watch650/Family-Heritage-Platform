import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { mapPersonData } from "@/lib/mapPersonData";

// PUT /api/persons/[id]
export async function PUT(
  request: NextRequest,
  context: { params: { [key: string]: string } }
) {
  const id = context.params.id;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const existingPerson = await prisma.person.findFirst({
      where: { id, createdById: user.id },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { error: "Person not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateData = mapPersonData(data);

    const person = await prisma.person.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("[PUT /api/persons/:id]", error);
    return NextResponse.json({ error: "Failed to update person" }, { status: 500 });
  }
}

// DELETE /api/persons/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: { [key: string]: string } }
) {
  const id = context.params.id;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existingPerson = await prisma.person.findFirst({
      where: {
        id,
        createdById: user.id,
      },
    });

    if (!existingPerson) {
      return NextResponse.json(
        { error: "Person not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.relationship.deleteMany({
      where: {
        OR: [{ personOneId: id }, { personTwoId: id }],
      },
    });

    await prisma.person.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/persons/:id]", error);
    return NextResponse.json(
      { error: "Failed to delete person" },
      { status: 500 }
    );
  }
}