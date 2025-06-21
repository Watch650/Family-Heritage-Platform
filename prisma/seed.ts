import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 12);

  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
    },
  });

  const grandpa = await prisma.person.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1940-01-15'),
      gender: 'MALE',
      birthPlace: 'New York, USA',
      biography: 'Family patriarch, served in the military.',
      isAlive: true,
      createdById: testUser.id,
    },
  });

  const grandma = await prisma.person.create({
    data: {
      firstName: 'Mary',
      lastName: 'Doe',
      birthDate: new Date('1942-03-22'),
      gender: 'FEMALE',
      birthPlace: 'Boston, USA',
      biography: 'Beloved grandmother, worked as a teacher.',
      isAlive: true,
      createdById: testUser.id,
    },
  });

  const father = await prisma.person.create({
    data: {
      firstName: 'Michael',
      lastName: 'Doe',
      birthDate: new Date('1970-07-10'),
      gender: 'MALE',
      birthPlace: 'Chicago, USA',
      isAlive: true,
      createdById: testUser.id,
    },
  });

  await prisma.relationship.create({
    data: {
      type: 'PARENT',
      personOneId: grandpa.id,
      personTwoId: father.id,
    },
  });

  await prisma.relationship.create({
    data: {
      type: 'PARENT',
      personOneId: grandma.id,
      personTwoId: father.id,
    },
  });

  await prisma.relationship.create({
    data: {
      type: 'MARRIED',
      personOneId: grandpa.id,
      personTwoId: grandma.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
