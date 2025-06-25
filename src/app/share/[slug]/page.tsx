// src/app/share/[slug]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ShareTreeClient from "./ShareTreeClient";
import { PersonWithRelationships, SavedLayout } from "@/types/family";

export default async function ShareTreePage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  if (!slug) return notFound();

  const tree = await prisma.familyTree.findUnique({
    where: { shareSlug: slug },
    include: {
      persons: {
        include: {
          relationshipsAsOne: true,
          relationshipsAsTwo: true,
        },
      },
      relationships: true,
      TreeLayout: true,
    },
  });

  if (!tree) return notFound();

  const layout: SavedLayout = (tree.TreeLayout
    ?.data as unknown as SavedLayout) ?? {
    nodes: [],
    edges: [],
  };

  return (
    <ShareTreeClient
      title={tree.title}
      persons={tree.persons as PersonWithRelationships[]}
      relationships={tree.relationships}
      layout={layout}
    />
  );
}
