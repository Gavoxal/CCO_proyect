import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.usuario.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      rol: true,
      activo: true,
    }
  })
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
