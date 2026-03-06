import { read, utils } from 'xlsx'
import { created } from '../../utils/response.js'

async function parseFileBuffer(buffer, mimetype) {
    const workbook = read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    return utils.sheet_to_json(sheet, { defval: null })
}

// POST /import/infantes
export async function importarInfantes(request, reply) {
    const db = request.server.db
    const data = await request.file()

    if (!data) {
        return reply.status(400).send({ error: 'No se envió ningún archivo' })
    }

    const buffer = await data.toBuffer()
    const rows = await parseFileBuffer(buffer, data.mimetype)

    const resultados = { exitosos: 0, errores: [] }

    for (const [i, row] of rows.entries()) {
        try {
            // Columnas esperadas en el Excel:
            // codigo | nombres | apellidos | cedula | telefono1 | telefono2 |
            // direccion | esPatrocinado | tipoPrograma | fuentePatrocinio | tutorCodigo
            const codigo = String(row.codigo || '').trim()
            if (!codigo || !row.nombres || !row.apellidos) {
                resultados.errores.push({ fila: i + 2, error: 'Falta codigo, nombres o apellidos' })
                continue
            }

            // Buscar tutor por código si se proporciona
            let tutorId = null
            if (row.tutorCodigo) {
                const tutor = await db.tutor.findFirst({ where: { codigo: String(row.tutorCodigo) } })
                if (tutor) tutorId = tutor.id
            }

            await db.infante.upsert({
                where: { codigo },
                create: {
                    codigo,
                    esPatrocinado: row.esPatrocinado === true || row.esPatrocinado === 'TRUE' || row.esPatrocinado === '1',
                    tipoPrograma: row.tipoPrograma || 'Ministerio',
                    fuentePatrocinio: row.fuentePatrocinio || 'Ninguno',
                    tutorId,
                    persona: {
                        create: {
                            nombres: String(row.nombres).trim(),
                            apellidos: String(row.apellidos).trim(),
                            cedula: row.cedula ? String(row.cedula).trim() : null,
                            telefono1: row.telefono1 ? String(row.telefono1).trim() : '0000000000',
                            telefono2: row.telefono2 ? String(row.telefono2).trim() : null,
                            direccion: row.direccion ? String(row.direccion).trim() : null,
                            fechaNacimiento: row.fechaNacimiento ? new Date(row.fechaNacimiento) : null
                        }
                    }
                },
                update: {
                    esPatrocinado: row.esPatrocinado === true || row.esPatrocinado === 'TRUE' || row.esPatrocinado === '1',
                    tipoPrograma: row.tipoPrograma || 'Ministerio',
                    fuentePatrocinio: row.fuentePatrocinio || 'Ninguno',
                    tutorId,
                    persona: {
                        update: {
                            nombres: String(row.nombres).trim(),
                            apellidos: String(row.apellidos).trim(),
                            telefono1: row.telefono1 ? String(row.telefono1).trim() : undefined,
                            telefono2: row.telefono2 ? String(row.telefono2).trim() : undefined,
                            direccion: row.direccion ? String(row.direccion).trim() : undefined
                        }
                    }
                }
            })
            resultados.exitosos++
        } catch (err) {
            resultados.errores.push({ fila: i + 2, error: err.message })
        }
    }

    return created(reply, resultados)
}

// POST /import/regalos
export async function importarRegalos(request, reply) {
    const db = request.server.db
    const data = await request.file()

    if (!data) return reply.status(400).send({ error: 'No se envió ningún archivo' })

    const buffer = await data.toBuffer()
    const rows = await parseFileBuffer(buffer, data.mimetype)

    const resultados = { exitosos: 0, errores: [] }
    const anio = new Date().getFullYear()

    for (const [i, row] of rows.entries()) {
        try {
            const codigoInfante = String(row.codigoInfante || '').trim()
            if (!codigoInfante || !row.tipo) {
                resultados.errores.push({ fila: i + 2, error: 'Falta codigoInfante o tipo' })
                continue
            }

            const infante = await db.infante.findUnique({ where: { codigo: codigoInfante } })
            if (!infante) {
                resultados.errores.push({ fila: i + 2, error: `Infante con código ${codigoInfante} no encontrado` })
                continue
            }

            await db.regalo.upsert({
                where: {
                    // Buscar regalo del mismo año y tipo para el mismo infante
                    id: 0  // Workaround: buscar primero
                },
                create: {
                    tipo: row.tipo,
                    estado: row.estado || 'pendiente',
                    anio,
                    infanteId: infante.id,
                    observaciones: row.observaciones || null,
                    fechaEntrega: row.fechaEntrega ? new Date(row.fechaEntrega) : null
                },
                update: {}
            }).catch(async () => {
                // Si no existe, crear
                return db.regalo.create({
                    data: {
                        tipo: row.tipo, estado: row.estado || 'pendiente',
                        anio, infanteId: infante.id,
                        observaciones: row.observaciones || null,
                        fechaEntrega: row.fechaEntrega ? new Date(row.fechaEntrega) : null
                    }
                })
            })

            resultados.exitosos++
        } catch (err) {
            resultados.errores.push({ fila: i + 2, error: err.message })
        }
    }

    return created(reply, resultados)
}
