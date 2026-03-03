# Backend - Inventario CCO

## Fase 2 (Próximamente)

Este directorio contendrá el backend del sistema de inventariado.

### Endpoints Esperados

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Autenticación |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/products` | Listar productos |
| POST | `/api/products` | Crear producto |
| GET | `/api/products/:id` | Detalle producto |
| PUT | `/api/products/:id` | Actualizar producto |
| DELETE | `/api/products/:id` | Eliminar producto |
| GET | `/api/products/barcode/:barcode` | Buscar por código de barras |
| GET | `/api/categories` | Listar categorías |
| GET | `/api/brands` | Listar marcas |
| GET | `/api/dashboard/stats` | Estadísticas del dashboard |
| GET | `/api/movements` | Listar movimientos |

### Stack Sugerido
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de datos**: PostgreSQL
- **ORM**: Prisma o Sequelize
