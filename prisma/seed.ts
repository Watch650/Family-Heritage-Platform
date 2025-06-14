console.log("About to import PrismaClient");
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {
      name: 'Test User',
      // password: hashedPassword, // Uncomment if you add password to schema
    },
    create: {
      email: 'test@example.com',
      name: 'Test User',
      // password: hashedPassword, // Uncomment if you add password to schema
    },
  })

  // Create sample family members
  const grandpa = await prisma.person.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1940-01-15'),
      gender: 'MALE',
      birthPlace: 'New York, USA',
      biography: 'Family patriarch, served in the military.',
      createdById: testUser.id,
    },
  })

  const grandma = await prisma.person.create({
    data: {
      firstName: 'Mary',
      lastName: 'Doe',
      birthDate: new Date('1942-03-22'),
      gender: 'FEMALE',
      birthPlace: 'Boston, USA',
      biography: 'Beloved grandmother, worked as a teacher.',
      createdById: testUser.id,
    },
  })

  const father = await prisma.person.create({
    data: {
      firstName: 'Michael',
      lastName: 'Doe',
      birthDate: new Date('1970-07-10'),
      gender: 'MALE',
      birthPlace: 'Chicago, USA',
      createdById: testUser.id,
    },
  })

  // Create relationships
  await prisma.relationship.create({
    data: {
      type: 'BIOLOGICAL_PARENT',
      parentId: grandpa.id,
      childId: father.id,
    },
  })

  await prisma.relationship.create({
    data: {
      type: 'BIOLOGICAL_PARENT',
      parentId: grandma.id,
      childId: father.id,
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })