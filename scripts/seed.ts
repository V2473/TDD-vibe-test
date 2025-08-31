import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with test users...');

  // Clear existing data
  await prisma.user.deleteMany();

  // Create test users
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@demo.com',
        password: await bcrypt.hash('DemoPass123!', 10),
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await bcrypt.hash('AdminPass123!', 10),
      },
    }),
  ]);

  console.log(`Created ${users.length} test users:`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });