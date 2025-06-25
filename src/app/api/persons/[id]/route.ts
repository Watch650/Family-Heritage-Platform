import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { mapPersonData } from "@/lib/mapPersonData";

interface RouteContext {
  params: { id: string };
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
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
    return NextResponse.json(
      { error: "Failed to update person" },
      { status: 500 }
    );
  }
}