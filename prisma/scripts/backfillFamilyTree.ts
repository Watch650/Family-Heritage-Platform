import { prisma } from "@/lib/prisma";

async function backfill() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    const people = await prisma.person.findMany({ where: { createdById: user.id } });

    if (people.length === 0) continue;

    const familyTree = await prisma.familyTree.create({
      data: {
        title: `${user.name ?? "Unnamed"}'s Tree`,
        createdById: user.id,
      },
    });

    await prisma.person.updateMany({
      where: { createdById: user.id },
      data: { familyTreeId: familyTree.id },
    });

    await prisma.relationship.updateMany({
      where: { personOneId: { in: people.map(p => p.id) } },
      data: { familyTreeId: familyTree.id },
    });

    console.log(`Backfilled familyTreeId for user ${user.email}`);
  }

  console.log("✅ Backfill complete.");
}

backfill().then(() => process.exit());