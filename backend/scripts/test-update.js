import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const codigo = "EC080200001" // Nataly Fernanda (Ya existe)
    console.log(`Simulando actualización para ${codigo}...`)

    try {
        const existingInfante = await prisma.infante.findUnique({
            where: { codigo },
            include: { persona: true }
        })

        if (!existingInfante) {
            console.log('No existe el infante')
            return
        }

        const updatePersona = {
            nombres: "Nataly Fernanda",
            apellidos: "Sánchez Lalangui",
        }
        
        // Simular lógica del controlador
        const cedula = "1150548178"
        if (cedula && cedula !== existingInfante.persona?.cedula) {
            const cedulaConflict = await prisma.persona.findFirst({ where: { cedula, NOT: { id: existingInfante.persona?.id } } })
            if (!cedulaConflict) {
                updatePersona.cedula = cedula
            } else {
                console.log('Conflicto de cédula detectado')
            }
        }

        await prisma.infante.update({
            where: { codigo },
            data: {
                persona: { update: updatePersona }
            }
        })
        console.log('✅ Actualización exitosa')
    } catch (err) {
        console.error('❌ Error:', err.message)
    }
}
main().finally(() => prisma.$disconnect())
