-- CreateTable
CREATE TABLE `personas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres` VARCHAR(255) NOT NULL,
    `apellidos` VARCHAR(255) NOT NULL,
    `cedula` VARCHAR(512) NULL,
    `cedulaHash` VARCHAR(64) NULL,
    `telefono1` VARCHAR(512) NULL,
    `telefono2` VARCHAR(512) NULL,
    `email` VARCHAR(255) NULL,
    `direccion` TEXT NULL,
    `fechaNacimiento` DATE NULL,
    `ubicacionGps` VARCHAR(512) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `personas_cedula_key`(`cedula`),
    UNIQUE INDEX `personas_cedulaHash_key`(`cedulaHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `rol` ENUM('admin', 'director', 'proteccion', 'secretaria', 'tutor_especial', 'tutor') NOT NULL DEFAULT 'tutor',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `ultimoAcceso` DATETIME(3) NULL,
    `tokenVersion` INTEGER NOT NULL DEFAULT 0,
    `personaId` INTEGER NULL,
    `passwordUpdatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_username_key`(`username`),
    UNIQUE INDEX `usuarios_email_key`(`email`),
    UNIQUE INDEX `usuarios_personaId_key`(`personaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `mensaje` TEXT NOT NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` ENUM('INFO', 'ALERTA', 'EVENTO') NOT NULL DEFAULT 'INFO',
    `referenciaId` INTEGER NULL,

    INDEX `notificaciones_usuarioId_idx`(`usuarioId`),
    INDEX `notificaciones_fechaCreacion_idx`(`fechaCreacion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `infantes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `enfermedades` TEXT NULL,
    `alergias` TEXT NULL,
    `cuidador` VARCHAR(255) NULL,
    `celular2` VARCHAR(20) NULL,
    `esPatrocinado` BOOLEAN NOT NULL DEFAULT false,
    `tipoPrograma` ENUM('Ministerio', 'Comedor', 'Ambos') NOT NULL DEFAULT 'Ministerio',
    `fuentePatrocinio` ENUM('Compassion', 'Plan', 'Ninguno') NOT NULL DEFAULT 'Ninguno',
    `fotografia` VARCHAR(500) NULL,
    `fechaActualizacionFoto` DATE NULL,
    `personaId` INTEGER NOT NULL,
    `tutorId` INTEGER NULL,
    `tarifaDiaria` DECIMAL(10, 2) NOT NULL DEFAULT 0.60,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `infantes_codigo_key`(`codigo`),
    UNIQUE INDEX `infantes_personaId_key`(`personaId`),
    INDEX `infantes_tutorId_fkey`(`tutorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tutores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `profesion` VARCHAR(255) NULL,
    `fotografia` VARCHAR(500) NULL,
    `fechaActualizacionFoto` DATE NULL,
    `personaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tutores_codigo_key`(`codigo`),
    UNIQUE INDEX `tutores_personaId_key`(`personaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asistencias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `estado` ENUM('Mes', 'Semana', 'PagoDia', 'Pendiente', 'Punto', 'Ausente') NOT NULL DEFAULT 'Ausente',
    `montoPagado` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `infanteId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `asistencias_infanteId_idx`(`infanteId`),
    INDEX `asistencias_fecha_idx`(`fecha`),
    UNIQUE INDEX `asistencias_infanteId_fecha_key`(`infanteId`, `fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `estado` ENUM('Realizada', 'NoRealizada') NOT NULL DEFAULT 'Realizada',
    `razonVisita` ENUM('Inasistencia', 'Enfermedad', 'OtraCausa', 'Seguimiento') NOT NULL DEFAULT 'Seguimiento',
    `decision` ENUM('ContinuaMinisterio', 'DarDeBaja', 'Otra') NOT NULL DEFAULT 'ContinuaMinisterio',
    `resultados` TEXT NULL,
    `observaciones` TEXT NULL,
    `fotoVisita` VARCHAR(500) NULL,
    `infanteId` INTEGER NOT NULL,
    `tutorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `visitas_infanteId_idx`(`infanteId`),
    INDEX `visitas_tutorId_fkey`(`tutorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reportes_incidentes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `descripcion` TEXT NOT NULL,
    `tipoAbuso` VARCHAR(100) NOT NULL,
    `reportadoPorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `reportes_incidentes_fecha_idx`(`fecha`),
    INDEX `reportes_incidentes_reportadoPorId_fkey`(`reportadoPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seguimientos_incidentes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `texto` TEXT NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `incidenteId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventario_materiales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nombreMaterial` VARCHAR(255) NOT NULL,
    `cantidadDisponible` INTEGER NOT NULL DEFAULT 0,
    `stockMinimo` INTEGER NOT NULL DEFAULT 5,
    `fechaUltimaActualizacion` DATE NOT NULL,
    `categoria` VARCHAR(100) NULL,
    `area` VARCHAR(100) NULL,
    `tipo` VARCHAR(50) NULL,
    `marca` VARCHAR(100) NULL,
    `numeroSerie` VARCHAR(100) NULL,
    `descripcion` TEXT NULL,
    `donacion` BOOLEAN NOT NULL DEFAULT false,
    `fechaIngreso` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ubicacion` VARCHAR(255) NULL,
    `condicion` VARCHAR(100) NULL,
    `responsable` VARCHAR(255) NULL,
    `observaciones` TEXT NULL,
    `fotografia` VARCHAR(500) NULL,
    `costoUnidad` DECIMAL(10, 2) NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `fungible` VARCHAR(50) NULL DEFAULT 'Fungible',
    `pertenece` VARCHAR(50) NULL DEFAULT 'Iglesia',

    UNIQUE INDEX `inventario_materiales_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `regalos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('regalo_navidad', 'kit_escolar', 'atencion_especial') NOT NULL,
    `fechaEntrega` DATE NULL,
    `estado` ENUM('pendiente', 'entregado') NOT NULL DEFAULT 'pendiente',
    `observaciones` TEXT NULL,
    `foto` VARCHAR(500) NULL,
    `anio` INTEGER NOT NULL,
    `infanteId` INTEGER NOT NULL,
    `entregadoPorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `regalos_infanteId_anio_idx`(`infanteId`, `anio`),
    INDEX `regalos_entregadoPorId_idx`(`entregadoPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eventos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NULL,
    `tipo` ENUM('Ministerio', 'Iglesia', 'Emergencia', 'Feriado') NOT NULL DEFAULT 'Ministerio',
    `notificar` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `eventos_fechaInicio_idx`(`fechaInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bolsa_visitas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tutorId` INTEGER NOT NULL,
    `infanteId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `bolsa_visitas_tutorId_infanteId_key`(`tutorId`, `infanteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_incidenteinfantes` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_incidenteinfantes_AB_unique`(`A`, `B`),
    INDEX `_incidenteinfantes_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_personaId_fkey` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificaciones` ADD CONSTRAINT `notificaciones_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infantes` ADD CONSTRAINT `infantes_personaId_fkey` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `infantes` ADD CONSTRAINT `infantes_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `tutores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tutores` ADD CONSTRAINT `tutores_personaId_fkey` FOREIGN KEY (`personaId`) REFERENCES `personas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asistencias` ADD CONSTRAINT `asistencias_infanteId_fkey` FOREIGN KEY (`infanteId`) REFERENCES `infantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_infanteId_fkey` FOREIGN KEY (`infanteId`) REFERENCES `infantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visitas` ADD CONSTRAINT `visitas_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `tutores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reportes_incidentes` ADD CONSTRAINT `reportes_incidentes_reportadoPorId_fkey` FOREIGN KEY (`reportadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimientos_incidentes` ADD CONSTRAINT `seguimientos_incidentes_incidenteId_fkey` FOREIGN KEY (`incidenteId`) REFERENCES `reportes_incidentes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `seguimientos_incidentes` ADD CONSTRAINT `seguimientos_incidentes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regalos` ADD CONSTRAINT `regalos_infanteId_fkey` FOREIGN KEY (`infanteId`) REFERENCES `infantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `regalos` ADD CONSTRAINT `regalos_entregadoPorId_fkey` FOREIGN KEY (`entregadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bolsa_visitas` ADD CONSTRAINT `bolsa_visitas_tutorId_fkey` FOREIGN KEY (`tutorId`) REFERENCES `tutores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bolsa_visitas` ADD CONSTRAINT `bolsa_visitas_infanteId_fkey` FOREIGN KEY (`infanteId`) REFERENCES `infantes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_incidenteinfantes` ADD CONSTRAINT `_incidenteinfantes_A_fkey` FOREIGN KEY (`A`) REFERENCES `infantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_incidenteinfantes` ADD CONSTRAINT `_incidenteinfantes_B_fkey` FOREIGN KEY (`B`) REFERENCES `reportes_incidentes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

