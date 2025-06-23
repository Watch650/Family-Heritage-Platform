import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";
import { RelationshipType } from "@prisma/client";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("personId");

    if (!personId) {
      return NextResponse.json(
        { error: "personId query parameter is required" },
        { status: 400 }
      );
    }

    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [{ personOneId: personId }, { personTwoId: personId }],
      },
    });

    return NextResponse.json(relationships);
  } catch (error) {
    console.error("[GET /api/relationships]", error);
    return NextResponse.json(
      { error: "Failed to fetch relationships" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { source, target, type } = await req.json();

    if (
      !source ||
      !target ||
      !type ||
      !Object.values(RelationshipType).includes(type)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    const deleted = await prisma.relationship.deleteMany({
      where: {
        type,
        OR: [
          { personOneId: source, personTwoId: target },
          { personOneId: target, personTwoId: source },
        ],
      },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error("[DELETE /api/relationships]", err);
    return NextResponse.json(
      { error: "Failed to delete relationship" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { type, personOneId, personTwoId } = await req.json();

    if (
      !type ||
      !personOneId ||
      !personTwoId ||
      !Object.values(RelationshipType).includes(type)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    const relationship = await prisma.relationship.create({
      data: {
        type,
        personOneId,
        personTwoId,
      },
    });

    return NextResponse.json(relationship);
  } catch (error) {
    console.error("[POST /api/relationships]", error);
    return NextResponse.json(
      { error: "Failed to create relationship" },
      { status: 500 }
    );
  }
}