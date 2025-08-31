import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst();
    console.log('Successfully connected to the database and fetched a user:', user);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });