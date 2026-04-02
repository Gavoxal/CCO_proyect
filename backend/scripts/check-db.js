import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const count = await prisma.infante.count()
    console.log(`Total infantes en DB: ${count}`)
    const first5 = await prisma.infante.findMany({
        take: 5,
        include: { persona: true }
    })
    console.log('Primeros 5:', JSON.stringify(first5, null, 2))
}
main().finally(() => prisma.$disconnect())
