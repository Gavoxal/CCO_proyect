# CCO KidScam — API REST

> Backend del Sistema de Gestión Integral del Centro Cristiano de Obrapía y el Ministerio Vías en Acción.

**Stack:** Fastify v5 · Node.js v20+ · Prisma v6 · MySQL 8.0

---

## Requisitos previos

- Node.js >= 20.0.0
- MySQL 8.0 corriendo localmente
- npm o pnpm

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno y configurar
cp .env.example .env
# Editar .env con los datos de tu MySQL local

# 3. Generar cliente Prisma
npm run db:generate

# 4. Correr migraciones (crea las tablas en MySQL)
npm run db:migrate

# 5. Cargar datos iniciales (usuarios de prueba)
npm run db:seed

# 6. Arrancar en modo desarrollo
npm run dev
```

El servidor estará disponible en: **http://localhost:3000**

---

## Verificación rápida

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin2026!"}'
```

---

## Credenciales iniciales (seed)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin2026!` | Administrador |
| `secretaria` | `Secretaria2026!` | Secretaría |
| `tutor1` | `Tutor2026!` | Tutor |

> ⚠️ Cambiar contraseñas antes de despliegue en producción.

---

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado del servidor |
| `POST` | `/api/v1/auth/login` | Iniciar sesión |
| `GET` | `/api/v1/auth/me` | Perfil del usuario logueado |
| `GET/POST/PUT/DELETE` | `/api/v1/usuarios` | Gestión de usuarios |
| `GET/POST/PUT/DELETE` | `/api/v1/infantes` | Gestión de infantes |
| `POST` | `/api/v1/infantes/:id/foto` | Subir foto del infante |
| `GET` | `/api/v1/infantes/sin-visita-anio` | Infantes sin visita este año |
| `GET` | `/api/v1/asistencia` | Historial de asistencia |
| `POST` | `/api/v1/asistencia/bulk` | Registrar asistencia masiva |
| `GET` | `/api/v1/asistencia/resumen` | Resumen de asistencia por infante |
| `GET/POST/DELETE` | `/api/v1/visitas` | Visitas domiciliarias |
| `GET/POST/PATCH/DELETE` | `/api/v1/inventario/materiales` | Inventario de materiales |
| `GET` | `/api/v1/inventario/materiales/alertas` | Alertas de stock y desactualización |
| `PATCH` | `/api/v1/inventario/materiales/:id/despachar` | Despachar material |
| `PATCH` | `/api/v1/inventario/materiales/:id/ingresar` | Ingresar material |
| `GET/POST/PATCH/DELETE` | `/api/v1/inventario/alimentos` | Inventario de alimentos |
| `GET/POST` | `/api/v1/solicitudes` | Solicitudes de materiales |
| `PATCH` | `/api/v1/solicitudes/:id/estado` | Aprobar/rechazar/entregar solicitud |
| `GET/POST/PUT/DELETE` | `/api/v1/regalos` | Regalos y kits escolares |
| `GET` | `/api/v1/regalos/pendientes` | Regalos pendientes por año |
| `GET/POST/PUT/DELETE` | `/api/v1/miembros` | Miembros de la iglesia |
| `GET/POST/PUT/DELETE` | `/api/v1/casas-de-paz` | Casas de paz |
| `GET/POST/PUT/DELETE` | `/api/v1/eventos` | Calendario de eventos |
| `POST` | `/api/v1/import/infantes` | Importar infantes desde Excel/CSV |
| `POST` | `/api/v1/import/regalos` | Importar regalos desde Excel/CSV |

---

## Estructura de carpetas

```
backend/
├── prisma/
│   ├── schema.prisma      # Modelo de datos MySQL
│   └── seed.js            # Datos iniciales
├── src/
│   ├── app.js             # Fastify app con plugins y rutas
│   ├── server.js          # Entry point
│   ├── plugins/           # JWT, CORS, Prisma, RateLimit
│   ├── middleware/        # roles.js — control de acceso
│   ├── utils/             # response.js, pagination.js
│   └── modules/           # Un módulo por dominio
│       ├── auth/
│       ├── usuarios/
│       ├── infantes/
│       ├── asistencia/
│       ├── visitas/
│       ├── inventario/materiales/
│       ├── inventario/alimentos/
│       ├── solicitudes/
│       ├── regalos/
│       ├── miembros/
│       ├── casasDePaz/
│       ├── eventos/
│       └── import/
└── uploads/               # Fotos e archivos (auto-creado)
```

---

## Notas de diseño

- Los infantes **patrocinados y no patrocinados son la misma entidad** — solo varía el campo `esPatrocinado`.
- El módulo médico fue **excluido** del sistema en esta versión.
- Las **fotos de infantes** se almacenan localmente en `uploads/infantes/` con fecha de actualización registrada en BD.
- Al entregar una solicitud (`estado = Entregada`), el stock del material se descuenta **automáticamente** en una transacción atómica.
- El sistema es **sujeto a cambios** conforme llegue nueva información de los usuarios del Ministerio.
