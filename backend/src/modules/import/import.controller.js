import { read, utils } from 'xlsx'
import { created } from '../../utils/response.js'

async function parseFileBuffer(buffer, mimetype) {
    const workbook = read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    return utils.sheet_to_json(sheet, { defval: null })
}

// Mapeo flexible de nombres de columnas del Excel → campos internos
const COLUMN_MAP = {
    'codigo': 'codigo', 'código': 'codigo', 'code': 'codigo', 'id': 'codigo', 'cod': 'codigo',
    // nombres y apellidos separados
    'nombres': 'nombres', 'primer nombre': 'nombres', 'first name': 'nombres',
    'apellidos': 'apellidos', 'apellido': 'apellidos', 'last name': 'apellidos',
    // nombre completo (una sola columna)
    'nombre': 'nombreCompleto', 'name': 'nombreCompleto',
    'nombre completo': 'nombreCompleto', 'nombre y apellido': 'nombreCompleto',
    'nombre y apellidos': 'nombreCompleto', 'nombres y apellidos': 'nombreCompleto',
    // otros campos
    'cedula': 'cedula', 'cédula': 'cedula', 'ci': 'cedula', 'documento': 'cedula', 'identificacion': 'cedula', 'identificación': 'cedula',
    'telefono': 'telefono1', 'teléfono': 'telefono1', 'telefono1': 'telefono1', 'teléfono1': 'telefono1', 'celular': 'telefono1', 'phone': 'telefono1', 'cel': 'telefono1',
    'telefono2': 'telefono2', 'teléfono2': 'telefono2', 'celular2': 'telefono2',
    'email': 'email', 'correo': 'email', 'e-mail': 'email',
    'direccion': 'direccion', 'dirección': 'direccion', 'address': 'direccion', 'domicilio': 'direccion',
    'fecha nacimiento': 'fechaNacimiento', 'fecha_nacimiento': 'fechaNacimiento', 'nacimiento': 'fechaNacimiento',
    'birth': 'fechaNacimiento', 'f. nacimiento': 'fechaNacimiento', 'fechanacimiento': 'fechaNacimiento',
    'f nacimiento': 'fechaNacimiento', 'fecha de nacimiento': 'fechaNacimiento',
    'programa': 'tipoPrograma', 'tipo programa': 'tipoPrograma', 'tipo': 'tipoPrograma', 'tipoprograma': 'tipoPrograma',
    'patrocinado': 'esPatrocinado', 'sponsorship': 'esPatrocinado', 'espatrocinado': 'esPatrocinado', 'es patrocinado': 'esPatrocinado',
    'patrocinio': 'fuentePatrocinio', 'fuente': 'fuentePatrocinio', 'sponsor': 'fuentePatrocinio',
    'fuente patrocinio': 'fuentePatrocinio', 'fuentepatrocinio': 'fuentePatrocinio',
    'tutor': 'tutorCodigo', 'tutorcodigo': 'tutorCodigo', 'tutor codigo': 'tutorCodigo', 'representante': 'tutorCodigo',
    'enfermedades': 'enfermedades', 'enfermedad': 'enfermedades',
    'alergias': 'alergias', 'alergia': 'alergias',
    'cuidador': 'cuidador',
}

/**
 * Normaliza una fila del Excel, mapeando las claves originales a los campos internos.
 * Si solo hay un campo "nombre" (nombreCompleto), lo divide en nombres y apellidos.
 */
function normalizeRow(row) {
    const normalized = {}
    for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.toLowerCase().trim()
        const mappedField = COLUMN_MAP[normalizedKey]
        if (mappedField) {
            normalized[mappedField] = value
        } else {
            // Guardar campos no mapeados también, por si acaso
            normalized[normalizedKey] = value
        }
    }

    // Si no hay nombres/apellidos separados pero sí hay nombreCompleto, dividir
    if (!normalized.nombres && normalized.nombreCompleto) {
        const parts = String(normalized.nombreCompleto).trim().split(/\s+/)
        if (parts.length === 1) {
            normalized.nombres = parts[0]
            normalized.apellidos = ''
        } else if (parts.length === 2) {
            // "Juan Pérez" → nombres: Juan, apellidos: Pérez
            normalized.nombres = parts[0]
            normalized.apellidos = parts[1]
        } else if (parts.length === 3) {
            // "Juan Carlos Pérez" o "Juan Pérez López"
            // Por defecto en Ecuador suele ser Nombre Apellido Apellido si solo hay 3
            // Pero intentaremos detectar si el segundo parece un nombre o un apellido es difícil.
            // Para "Vías en Acción", usaremos la regla: 1 Nombre, 2 Apellidos (más común)
            normalized.nombres = parts[0]
            normalized.apellidos = parts.slice(1).join(' ')
        } else {
            // "Juan Carlos Pérez López" (4 o más)
            // Dividir por la mitad o 2 y resto
            const mid = parts.length > 3 ? 2 : 1
            normalized.nombres = parts.slice(0, mid).join(' ')
            normalized.apellidos = parts.slice(mid).join(' ')
        }
    }

    // Si aún no hay apellidos, poner vacío
    if (!normalized.apellidos) normalized.apellidos = ''

    return normalized
}

// POST /import/infantes
export async function importarInfantes(request, reply) {
    const db = request.server.db
    const data = await request.file()

    if (!data) return reply.status(400).send({ error: 'No se envió ningún archivo' })

    const buffer = await data.toBuffer()
    const rows = await parseFileBuffer(buffer, data.mimetype)

    const resultados = { exitosos: 0, actualizados: 0, total: rows.length, errores: [] }

    // Log de las columnas detectadas para debugging
    if (rows.length > 0) {
        const rawCols = Object.keys(rows[0])
        const normalizedSample = normalizeRow(rows[0])
        request.server.log.info(`📊 Columnas detectadas: ${rawCols.join(', ')}`)
        request.server.log.info(`📊 Ejemplo normalizado: ${JSON.stringify(normalizedSample)}`)
    }

    for (const [i, rawRow] of rows.entries()) {
        try {
            const row = normalizeRow(rawRow)
            const codigo = String(row.codigo || '').trim()

            if (!codigo || !row.nombres) {
                resultados.errores.push({ fila: i + 2, codigo: codigo || 'N/A', error: 'Falta codigo o nombre' })
                continue
            }

            // 1. Buscar Tutor
            let tutorId = null
            if (row.tutorCodigo) {
                const search = String(row.tutorCodigo).trim()
                let tutor = await db.tutor.findFirst({ where: { codigo: search } })
                if (!tutor) {
                    tutor = await db.tutor.findFirst({
                        where: {
                            persona: {
                                OR: [
                                    { nombres: { contains: search } },
                                    { apellidos: { contains: search } }
                                ]
                            }
                        }
                    })
                }
                if (tutor) tutorId = tutor.id
            }

            // 2. Procesar fecha
            let fechaNacimiento = null
            if (row.fechaNacimiento != null && row.fechaNacimiento !== '') {
                if (typeof row.fechaNacimiento === 'number') {
                    const excelEpoch = new Date(1899, 11, 30)
                    fechaNacimiento = new Date(excelEpoch.getTime() + row.fechaNacimiento * 86400000)
                } else {
                    const d = new Date(row.fechaNacimiento)
                    if (!isNaN(d.getTime())) fechaNacimiento = d
                }
            }

            // 3. Preparar datos
            const cedula = row.cedula != null ? String(row.cedula).trim() : null
            const personaData = {
                nombres: String(row.nombres).trim(),
                apellidos: String(row.apellidos || '').trim(),
                cedula,
                telefono1: row.telefono1 ? String(row.telefono1).trim() : '0000000000',
                telefono2: row.telefono2 ? String(row.telefono2).trim() : null,
                direccion: row.direccion ? String(row.direccion).trim() : null,
                fechaNacimiento
            }

            const infanteData = {
                esPatrocinado: ['si', 'sí', 'true', '1'].includes(String(row.esPatrocinado || '').toLowerCase()),
                tipoPrograma: row.tipoPrograma || 'Ministerio',
                fuentePatrocinio: row.fuentePatrocinio || 'Ninguno',
                cuidador: row.cuidador ? String(row.cuidador).trim() : null,
                tutorId
            }

            // 4. Upsert lógico
            const existingInfante = await db.infante.findUnique({
                where: { codigo },
                include: { persona: true }
            })

            if (existingInfante) {
                // Actualizar
                const updatePersona = {
                    nombres: personaData.nombres,
                    apellidos: personaData.apellidos,
                    direccion: personaData.direccion,
                    fechaNacimiento: personaData.fechaNacimiento
                }
                if (personaData.telefono1 && personaData.telefono1 !== '0000000000') updatePersona.telefono1 = personaData.telefono1
                if (personaData.telefono2) updatePersona.telefono2 = personaData.telefono2
                
                // Cédula: evitar conflictos si cambia
                if (cedula && cedula !== existingInfante.persona?.cedula) {
                    const conflict = await db.persona.findFirst({ where: { cedula, NOT: { id: existingInfante.personaId } } })
                    if (!conflict) updatePersona.cedula = cedula
                }

                await db.infante.update({
                    where: { id: existingInfante.id },
                    data: {
                        ...infanteData,
                        persona: { update: updatePersona }
                    }
                })
                resultados.actualizados++
            } else {
                // Crear
                let personaId = null
                if (cedula) {
                    const existingPersona = await db.persona.findFirst({ where: { cedula } })
                    if (existingPersona) {
                        const hasInfante = await db.infante.findFirst({ where: { personaId: existingPersona.id } })
                        if (!hasInfante) personaId = existingPersona.id
                    }
                }

                if (personaId) {
                    await db.persona.update({ where: { id: personaId }, data: personaData })
                    await db.infante.create({ data: { codigo, ...infanteData, personaId } })
                } else {
                    await db.infante.create({ data: { codigo, ...infanteData, persona: { create: personaData } } })
                }
                resultados.exitosos++
            }
        } catch (err) {
            request.server.log.error(`❌ Error importando fila ${i + 2}: ${err.message}`)
            let errorMsg = err.message
            if (err.code === 'P2002') {
                const target = err.meta?.target || 'campo único'
                errorMsg = `Ya existe un registro con ese valor de ${target}`
            }
            resultados.errores.push({ fila: i + 2, error: errorMsg })
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
