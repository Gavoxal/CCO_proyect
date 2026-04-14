import { ok, created, noContent, notFound, paginated } from '../../../utils/response.js'
import { getPagination } from '../../../utils/pagination.js'
import * as xlsx from 'xlsx'
import * as fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

const ALLOWED_FIELDS = [
    'codigo', 'nombreMaterial', 'cantidadDisponible', 'stockMinimo',
    'categoria', 'area', 'tipo', 'marca', 'numeroSerie', 'fotografia',
    'pertenece', 'fungible'
];

function filterData(body) {
    const data = {};
    ALLOWED_FIELDS.forEach(key => {
        if (body[key] !== undefined) {
            data[key] = body[key];
        }
    });
    // Parse integer fields
    if (data.cantidadDisponible !== undefined) data.cantidadDisponible = parseInt(data.cantidadDisponible) || 0;
    if (data.stockMinimo !== undefined) data.stockMinimo = parseInt(data.stockMinimo) || 0;
    return data;
}

// GET /inventario/materiales
export async function listar(request, reply) {
    const { page, limit, skip } = getPagination(request.query)
    const { buscar, stockBajo, pertenece, fungible } = request.query
    const db = request.server.db

    const where = {}
    if (buscar) where.nombreMaterial = { contains: buscar }
    if (pertenece) where.pertenece = pertenece
    if (fungible) where.fungible = fungible
    if (stockBajo === 'true') {
        where.cantidadDisponible = { lte: db.inventarioMaterial.fields.stockMinimo }
    }

    const [total, items] = await Promise.all([
        db.inventarioMaterial.count({ where }),
        db.inventarioMaterial.findMany({ where, skip, take: limit, orderBy: { nombreMaterial: 'asc' } })
    ])

    // Marcar items con stock bajo
    const itemsMarcados = items.map(item => ({
        ...item,
        stockBajo: item.cantidadDisponible < item.stockMinimo
    }))

    return paginated(reply, itemsMarcados, total, page, limit)
}

export async function obtener(request, reply) {
    const db = request.server.db
    const item = await db.inventarioMaterial.findUnique({ where: { id: parseInt(request.params.id) } })
    if (!item) return notFound(reply)
    return ok(reply, item)
}

export async function crear(request, reply) {
    const db = request.server.db
    let body = request.body
    let foto = undefined

    if (request.isMultipart()) {
        const parts = request.parts()
        const fields = {}
        for await (const part of parts) {
            if (part.file) {
                const dir = path.join(UPLOAD_DIR, 'materiales')
                await fs.mkdir(dir, { recursive: true })
                const ext = part.filename.split('.').pop()
                const filename = `material-${Date.now()}.${ext}`
                await fs.writeFile(path.join(dir, filename), await part.toBuffer())
                foto = `/uploads/materiales/${filename}`
            } else {
                fields[part.fieldname] = part.value
            }
        }
        body = fields
    }

    const data = filterData(body);
    data.fechaUltimaActualizacion = new Date();
    if (foto) data.fotografia = foto;

    const item = await db.inventarioMaterial.create({ data })
    return created(reply, item)
}

export async function actualizar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    let body = request.body
    let foto = undefined

    if (request.isMultipart()) {
        const parts = request.parts()
        const fields = {}
        for await (const part of parts) {
            if (part.file) {
                const dir = path.join(UPLOAD_DIR, 'materiales')
                await fs.mkdir(dir, { recursive: true })
                const ext = part.filename.split('.').pop()
                const filename = `material-${Date.now()}.${ext}`
                await fs.writeFile(path.join(dir, filename), await part.toBuffer())
                foto = `/uploads/materiales/${filename}`
            } else {
                fields[part.fieldname] = part.value
            }
        }
        body = fields
    }

    const data = filterData(body);
    data.fechaUltimaActualizacion = new Date();
    if (foto) data.fotografia = foto;

    try {
        const item = await db.inventarioMaterial.update({
            where: { id },
            data
        })
        return ok(reply, item)
    } catch (e) {
        request.server.log.error(e)
        if (e.code === 'P2025') return notFound(reply)
        return reply.status(500).send({ error: 'Error al actualizar el material', details: e.message })
    }
}

export async function importarExcel(request, reply) {
    const db = request.server.db;
    try {
        if (!request.isMultipart()) {
            return reply.status(400).send({ error: 'Debe subir un archivo de excel válido' });
        }
        
        const data = await request.file();
        const buffer = await data.toBuffer();
        const wb = xlsx.read(buffer, { type: 'buffer' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);
        
        let count = 0;
        for (const row of rows) {
            // Excel columns: Timestamp, Codigo del articulo, Nombre del articulo, Descripcion, Categoria, Ubicacion, Marca / Modelo, Condicion, Observaciones, Area, Responsable
            const codigo = row['Codigo del articulo'] || `CCO-EXT-${uuidv4().substring(0,8)}`;
            const nombre = row['Nombre del articulo'];
            if (!nombre) continue;

            const materialData = {
                codigo: codigo.toString().substring(0, 50),
                nombreMaterial: nombre.toString().substring(0, 255),
                categoria: (row['Categoria'] || '').toString().substring(0, 100) || null,
                area: (row['Area'] || row['Ubicacion'] || '').toString().substring(0, 100) || null,
                tipo: (row['Descripcion'] || '').toString().substring(0, 50) || null,
                marca: (row['Marca / Modelo'] || '').toString().substring(0, 100) || null,
                cantidadDisponible: 1, // Assumption: each row models a unique physical item
                stockMinimo: 1,
                pertenece: 'Iglesia',
                fungible: 'Fungible',
                fechaUltimaActualizacion: new Date()
            };

            await db.inventarioMaterial.upsert({
                where: { codigo: materialData.codigo },
                update: materialData,
                create: materialData
            });
            count++;
        }
        
        return ok(reply, { message: `Importación exitosa. ${count} registros procesados.` });
    } catch (e) {
        request.server.log.error(e);
        return reply.status(500).send({ error: 'Error procesando el archivo de excel', details: e.message, stack: e.stack });
    }
}

// PATCH /materiales/:id/despachar  — reduce stock
export async function despachar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const cantidad = parseInt(request.body.cantidad)

    const item = await db.inventarioMaterial.findUnique({ where: { id } })
    if (!item) return notFound(reply)

    if (item.cantidadDisponible < cantidad) {
        return reply.status(409).send({
            error: 'Stock insuficiente',
            disponible: item.cantidadDisponible
        })
    }

    const actualizado = await db.inventarioMaterial.update({
        where: { id },
        data: {
            cantidadDisponible: { decrement: cantidad },
            fechaUltimaActualizacion: new Date()
        }
    })
    return ok(reply, actualizado)
}

// PATCH /materiales/:id/ingresar  — aumenta stock
export async function ingresar(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    const cantidad = parseInt(request.body.cantidad)

    try {
        const actualizado = await db.inventarioMaterial.update({
            where: { id },
            data: {
                cantidadDisponible: { increment: cantidad },
                fechaUltimaActualizacion: new Date()
            }
        })
        return ok(reply, actualizado)
    } catch {
        return notFound(reply)
    }
}

// GET /materiales/alertas  — stock bajo o sin actualizar > 30 días
export async function alertas(request, reply) {
    const db = request.server.db
    const diasUmbral = parseInt(process.env.INVENTORY_STALE_DAYS || '30')
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - diasUmbral)

    // Usar count para stock bajo (más eficiente)
    const countStockBajo = await db.inventarioMaterial.count({
        where: {
            cantidadDisponible: { lt: db.inventarioMaterial.fields.stockMinimo }
        }
    })

    // Para desactualizados, solo traemos los necesarios (ej. top 50) y solo campos mínimos
    const desactualizados = await db.inventarioMaterial.findMany({
        where: { fechaUltimaActualizacion: { lt: fechaLimite } },
        take: 50,
        select: { id: true, nombreMaterial: true, codigo: true, fechaUltimaActualizacion: true }
    })

    return ok(reply, {
        stockBajoCount: countStockBajo,
        desactualizados: desactualizados.map(i => ({ ...i, razon: `Sin actualizar hace +${diasUmbral} días` }))
    })
}

export async function eliminar(request, reply) {
    const db = request.server.db
    try {
        await db.inventarioMaterial.delete({ where: { id: parseInt(request.params.id) } })
        return noContent(reply)
    } catch {
        return notFound(reply)
    }
}

export async function subirFoto(request, reply) {
    const db = request.server.db
    const id = parseInt(request.params.id)
    
    try {
        const material = await db.inventarioMaterial.findUnique({ where: { id } })
        if (!material) return notFound(reply)

        const data = await request.file()
        if (!data) return reply.status(400).send({ error: 'No se envió ningún archivo' })

        // Validar tipo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(data.mimetype)) {
            return reply.status(400).send({ error: 'Solo se permiten imágenes JPG, PNG o WebP' })
        }

        const dir = path.join(UPLOAD_DIR, 'materiales')
        await fs.mkdir(dir, { recursive: true })
        
        const ext = data.filename.split('.').pop()
        const filename = `material-${id}-${Date.now()}.${ext}`
        const filepath = path.join(dir, filename)
        
        await fs.writeFile(filepath, await data.toBuffer())
        const urlPath = `/uploads/materiales/${filename}`

        const actualizado = await db.inventarioMaterial.update({
            where: { id },
            data: { 
                fotografia: urlPath, 
                fechaUltimaActualizacion: new Date() 
            }
        })

        return ok(reply, actualizado)
    } catch (e) {
        request.server.log.error('Error en subirFoto material:', e)
        return reply.status(500).send({ 
            error: 'Error al subir la fotografía', 
            details: e.message 
        })
    }
}
