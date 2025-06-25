// src/app/api/trees/[slug]/share/route.ts

import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";

// POST /api/trees/[slug]/share
export async function POST(request: NextRequest, context: unknown) {
  const { params } = context as { params: { slug: string } };
  const treeId = params.slug;

  if (!treeId) {
    return NextResponse.json({ error: "Tree ID is required" }, { status: 400 });
  }

  try {
    const tree = await prisma.familyTree.findUnique({
      where: { id: treeId },
      select: { id: true, shareSlug: true },
    });

    if (!tree) {
      return NextResponse.json({ error: "Tree not found" }, { status: 404 });
    }

    // Return existing slug if present
    if (tree.shareSlug) {
      return NextResponse.json({ shareSlug: tree.shareSlug });
    }

    // Generate a unique share slug
    let slug = nanoid(10); // e.g. Z8z4A1vP3k

    // Retry until unique slug (optional)
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.familyTree.findUnique({ where: { shareSlug: slug } });
      if (!existing) break;
      slug = nanoid(10);
      attempts++;
    }

    const updatedTree = await prisma.familyTree.update({
      where: { id: treeId },
      data: { shareSlug: slug },
      select: { shareSlug: true },
    });

    return NextResponse.json({ shareSlug: updatedTree.shareSlug });
  } catch (error) {
    console.error("Error generating share slug:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}