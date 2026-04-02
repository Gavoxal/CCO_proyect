import { PrismaClient } from '@prisma/client'
import { read, utils } from 'xlsx'
import fs from 'fs'

const prisma = new PrismaClient()

// Mismo mapeo que el controlador
const COLUMN_MAP = {
    'codigo': 'codigo', 'código': 'codigo',
    'nombres': 'nombres',
    'nombre': 'nombreCompleto',
    'apellidos': 'apellidos', 'apellido': 'apellidos',
    'cedula': 'cedula', 'cédula': 'cedula',
    'telefono': 'telefono1', 'teléfono': 'telefono1', 'celular': 'telefono1',
    'direccion': 'direccion', 'dirección': 'direccion',
    'fecha de nacimiento': 'fechaNacimiento', 'fecha nacimiento': 'fechaNacimiento',
    'tutor': 'tutorCodigo', 'representante': 'tutorCodigo',
    'cuidador': 'cuidador',
}

function normalizeRow(row) {
    const normalized = {}
    for (const [key, value] of Object.entries(row)) {
        const normalizedKey = key.toLowerCase().trim()
        const mappedField = COLUMN_MAP[normalizedKey]
        if (mappedField) {
            normalized[mappedField] = value
        } else {
            normalized[normalizedKey] = value
        }
    }

    if (!normalized.nombres && normalized.nombreCompleto) {
        const parts = String(normalized.nombreCompleto).trim().split(/\s+/)
        if (parts.length <= 2) {
            normalized.nombres = parts[0] || ''
            normalized.apellidos = parts[1] || ''
        } else if (parts.length === 3) {
            normalized.nombres = parts.slice(0, 1).join(' ')
            normalized.apellidos = parts.slice(1).join(' ')
        } else {
            const mid = Math.ceil(parts.length / 2)
            normalized.nombres = parts.slice(0, mid).join(' ')
            normalized.apellidos = parts.slice(mid).join(' ')
        }
    }
    if (!normalized.apellidos) normalized.apellidos = ''
    return normalized
}

async function main() {
    const buffer = fs.readFileSync('C:\\Users\\ASUS\\Documents\\Proyectos individuales\\CCO_Proyect\\CCO_proyect\\lista general mvidas.xlsx')
    const workbook = read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = utils.sheet_to_json(sheet, { defval: null })

    console.log(`Total filas: ${rows.length}`)
    
    let exitos = 0
    let errores = 0

    for (const [i, rawRow] of rows.entries()) {
        const row = normalizeRow(rawRow)
        const codigo = String(row.codigo || '').trim()
        
        if (!codigo || !row.nombres) {
            console.error(`Fila ${i+2}: Falta codigo o nombre`)
            errores++
            continue
        }

        let fechaNacimiento = null
        if (row.fechaNacimiento != null) {
            const rawDate = row.fechaNacimiento
            if (typeof rawDate === 'number') {
                const excelEpoch = new Date(1899, 11, 30)
                fechaNacimiento = new Date(excelEpoch.getTime() + rawDate * 86400000)
            }
        }

        try {
            const cedula = row.cedula != null ? String(row.cedula).trim() : null
            
            await prisma.infante.create({
                data: {
                    codigo,
                    esPatrocinado: false,
                    tipoPrograma: 'Ministerio',
                    fuentePatrocinio: 'Ninguno',
                    cuidador: row.cuidador ? String(row.cuidador).trim() : null,
                    persona: {
                        create: {
                            nombres: String(row.nombres).trim(),
                            apellidos: String(row.apellidos || '').trim(),
                            cedula,
                            telefono1: row.telefono1 ? String(row.telefono1).trim() : '0000000000',
                            direccion: row.direccion ? String(row.direccion).trim() : null,
                            fechaNacimiento
                        }
                    }
                }
            })
            exitos++
            if (exitos % 50 === 0) console.log(`... ${exitos} procesados`)
        } catch (err) {
            console.error(`❌ Error Fila ${i+2} (${codigo}):`, err.message)
            errores++
        }
    }

    console.log(`\nImportación finalizada: ${exitos} exitosos, ${errores} errores.`)
}

main()
    .catch(e => console.error('Fatal:', e))
    .finally(() => prisma.$disconnect())
