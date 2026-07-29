import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const user = await prisma.usuario.findFirst({
        where: { username: 'admin' },
        include: { persona: true }
    });
    console.log("Success:", user ? user.username : 'No users found');
    console.log("Password updated at:", user.passwordUpdatedAt);
    
    // Simulate what the controller does:
    const passwordExpired = (new Date() - new Date(user.passwordUpdatedAt)) / (1000 * 60 * 60 * 24) >= 90;
    console.log("Password expired:", passwordExpired);
    
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main()
