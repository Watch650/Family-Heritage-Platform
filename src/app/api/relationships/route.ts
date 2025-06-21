import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/getSessionUser";

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
