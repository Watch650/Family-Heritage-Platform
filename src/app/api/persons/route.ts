import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { mapPersonData } from "@/lib/mapPersonData";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const persons = await prisma.person.findMany({
      where: { createdById: user.id },
      include: {
        relationshipsAsOne: true,
        relationshipsAsTwo: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(persons);
  } catch (error) {
    console.error("[GET /api/persons]", error);
    return NextResponse.json({ error: "Failed to fetch persons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    // 1. Check if the user already has a FamilyTree
    let familyTree = await prisma.familyTree.findFirst({
      where: { createdById: user.id },
    });

    // 2. Create one if not found
    if (!familyTree) {
      familyTree = await prisma.familyTree.create({
        data: {
          title: `${user.name ?? "Unnamed"}'s Tree`,
          createdById: user.id,
        },
      });
    }

    // 3. Create the new person, attaching familyTreeId
    const personData = {
      ...mapPersonData(data),
      createdById: user.id,
      familyTreeId: familyTree.id, // inject it here
    };

    const person = await prisma.person.create({
      data: personData,
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("[POST /api/persons]", error);
    return NextResponse.json(
      { error: "Failed to create person" },
      { status: 500 }
    );
  }
}