-- Script de migración para CCO KidScam:
-- 1. Actualizar tarifa diaria de infantes (de 0.50 a 0.60)
-- 2. Agregar soporte para montoPagado en asistencias (pagos parciales)
-- 3. Sincronizar registros históricos de PagoDia

-- 1. Modificar default de tarifaDiaria y actualizar infantes con valor anterior de 0.50
ALTER TABLE `infantes` ALTER COLUMN `tarifaDiaria` SET DEFAULT 0.60;
UPDATE `infantes` SET `tarifaDiaria` = 0.60 WHERE `tarifaDiaria` = 0.50;

-- 2. Agregar columna montoPagado en asistencias (si no existe)
-- Nota: En MySQL 8.0.19+ se soporta IF NOT EXISTS.
-- Si tu versión de MySQL es anterior y falla con IF NOT EXISTS, ejecuta: ALTER TABLE `asistencias` ADD COLUMN `montoPagado` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'asistencias' 
      AND COLUMN_NAME = 'montoPagado'
);

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE `asistencias` ADD COLUMN `montoPagado` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `estado`', 
    'SELECT "Columna montoPagado ya existe"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Inicializar montoPagado para los registros históricos que ya estaban registrados como 'PagoDia'
UPDATE `asistencias` a
JOIN `infantes` i ON a.`infanteId` = i.`id`
SET a.`montoPagado` = i.`tarifaDiaria`
WHERE a.`estado` = 'PagoDia' AND (a.`montoPagado` IS NULL OR a.`montoPagado` = 0.00);

SELECT "Migración completada con éxito." AS resultado;
