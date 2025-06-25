import { prisma } from "@/lib/prisma";

export async function getSharedTreeData(slug: string) {
  const tree = await prisma.familyTree.findUnique({
    where: { shareSlug: slug },
    include: {
      persons: {
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      },
      relationships: true,
    },
  });

  if (!tree) {
    throw new Error("Family tree not found or not shared");
  }

  return {
    title: tree.title,
    persons: tree.persons,
    relationships: tree.relationships,
    createdAt: tree.createdAt,
  };
}
