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
    const personData = {
      ...mapPersonData(data),
      createdById: user.id,
    };

    const person = await prisma.person.create({
      data: personData,
    });

    return NextResponse.json(person);
  } catch (error) {
    console.error("[POST /api/persons]", error);
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 });
  }
}
