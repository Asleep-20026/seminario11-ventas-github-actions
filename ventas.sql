-- Script SQL unificado para sistema de gestión de vendedores
-- Este script combina las mejores características de ambos scripts originales

-- Eliminar la base de datos si existe (opcional, comentar si no se desea usar)
-- DROP DATABASE IF EXISTS Sistema_Ventas;

-- Crear la base de datos (opcional, comentar si ya existe)
-- CREATE DATABASE IF NOT EXISTS Sistema_Ventas;

-- Usar la base de datos
USE Sistema_Ventas;  -- Cambiar por el nombre de la base de datos que se esté utilizando

-- Eliminar procedimientos almacenados si existen
DROP PROCEDURE IF EXISTS sp_ingven;
DROP PROCEDURE IF EXISTS sp_modven;
DROP PROCEDURE IF EXISTS sp_delven;
DROP PROCEDURE IF EXISTS sp_lisven;
DROP PROCEDURE IF EXISTS sp_busven;
DROP PROCEDURE IF EXISTS sp_searchven;
DROP PROCEDURE IF EXISTS sp_lisdistritos;

-- Eliminar tablas si existen (en orden correcto por las foreign keys)
DROP TABLE IF EXISTS Vendedor;
DROP TABLE IF EXISTS Distrito;

-- Crear la tabla Distrito
CREATE TABLE IF NOT EXISTS Distrito (
    id_distrito INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL
);

-- Insertar distritos directamente (si la tabla está vacía)
INSERT INTO Distrito (nombre)
SELECT * FROM (
    SELECT 'San Juan de Lurigancho' UNION
    SELECT 'San Martín de Porres' UNION
    SELECT 'Ate' UNION
    SELECT 'Comas' UNION
    SELECT 'Villa El Salvador' UNION
    SELECT 'Villa María del Triunfo' UNION
    SELECT 'San Juan de Miraflores' UNION
    SELECT 'Los Olivos' UNION
    SELECT 'Puente Piedra' UNION
    SELECT 'Santiago de Surco'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM Distrito LIMIT 1);

-- Crear la tabla Vendedor
CREATE TABLE IF NOT EXISTS Vendedor (
    id_ven INT PRIMARY KEY AUTO_INCREMENT,
    nom_ven VARCHAR(25) NOT NULL,
    ape_ven VARCHAR(25) NOT NULL,  -- Se usa ape_ven como nombre estándar para la columna de apellido
    cel_ven CHAR(9) NOT NULL,
    id_distrito INT,
    FOREIGN KEY (id_distrito) REFERENCES Distrito(id_distrito) ON DELETE SET NULL
);

-- Procedimiento almacenado para insertar (sp_ingven)
DELIMITER //
CREATE PROCEDURE sp_ingven(
    IN p_nom_ven VARCHAR(25),
    IN p_ape_ven VARCHAR(25),
    IN p_cel_ven CHAR(9),
    IN p_id_distrito INT
)
BEGIN
    DECLARE distrito_exists INT;
    
    -- Validar datos no nulos
    IF p_nom_ven IS NULL OR p_ape_ven IS NULL OR p_cel_ven IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Todos los campos son obligatorios';
    END IF;
    
    -- Validar longitud del celular
    IF LENGTH(p_cel_ven) != 9 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El número de celular debe tener exactamente 9 dígitos';
    END IF;
    
    -- Validar que el distrito existe
    IF p_id_distrito IS NOT NULL THEN
        SELECT COUNT(*) INTO distrito_exists FROM Distrito WHERE id_distrito = p_id_distrito;
        IF distrito_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El distrito especificado no existe';
        END IF;
    END IF;
    
    INSERT INTO Vendedor(nom_ven, ape_ven, cel_ven, id_distrito)
    VALUES (p_nom_ven, p_ape_ven, p_cel_ven, p_id_distrito);
    
    SELECT LAST_INSERT_ID() AS id_vendedor;
END //
DELIMITER ;

-- Procedimiento almacenado para actualizar (sp_modven)
DELIMITER //
CREATE PROCEDURE sp_modven(
    IN p_id_ven INT,
    IN p_nom_ven VARCHAR(25),
    IN p_ape_ven VARCHAR(25),
    IN p_cel_ven CHAR(9),
    IN p_id_distrito INT
)
BEGIN
    DECLARE vendedor_exists INT;
    DECLARE distrito_exists INT;
    
    -- Validar que el vendedor existe
    SELECT COUNT(*) INTO vendedor_exists FROM Vendedor WHERE id_ven = p_id_ven;
    IF vendedor_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El vendedor especificado no existe';
    END IF;
    
    -- Validar datos no nulos
    IF p_nom_ven IS NULL OR p_ape_ven IS NULL OR p_cel_ven IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Todos los campos son obligatorios';
    END IF;
    
    -- Validar longitud del celular
    IF LENGTH(p_cel_ven) != 9 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El número de celular debe tener exactamente 9 dígitos';
    END IF;
    
    -- Validar que el distrito existe si se proporciona
    IF p_id_distrito IS NOT NULL THEN
        SELECT COUNT(*) INTO distrito_exists FROM Distrito WHERE id_distrito = p_id_distrito;
        IF distrito_exists = 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El distrito especificado no existe';
        END IF;
    END IF;
    
    UPDATE Vendedor 
    SET nom_ven = p_nom_ven,
        ape_ven = p_ape_ven,
        cel_ven = p_cel_ven,
        id_distrito = p_id_distrito
    WHERE id_ven = p_id_ven;
END //
DELIMITER ;

-- Procedimiento almacenado para eliminar (sp_delven)
DELIMITER //
CREATE PROCEDURE sp_delven(
    IN p_id_ven INT
)
BEGIN
    DECLARE vendedor_exists INT;
    
    -- Validar que el vendedor existe
    SELECT COUNT(*) INTO vendedor_exists FROM Vendedor WHERE id_ven = p_id_ven;
    IF vendedor_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El vendedor especificado no existe';
    END IF;
    
    DELETE FROM Vendedor WHERE id_ven = p_id_ven;
    
    -- Opción para reordenar IDs (comentar si no se desea esta funcionalidad)
    -- SET @num := 0;
    -- UPDATE Vendedor SET id_ven = @num := (@num + 1) ORDER BY id_ven;
    -- ALTER TABLE Vendedor AUTO_INCREMENT = 1;
END //
DELIMITER ;

-- Procedimiento almacenado para listar distritos
DELIMITER //
CREATE PROCEDURE sp_lisdistritos()
BEGIN
    SELECT * FROM Distrito ORDER BY nombre;
END //
DELIMITER ;

-- Procedimiento almacenado para listar (sp_lisven)
DELIMITER //
CREATE PROCEDURE sp_lisven()
BEGIN
    SELECT 
        v.*,
        COALESCE(d.nombre, 'Sin distrito') as distrito
    FROM Vendedor v
    LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
    ORDER BY v.id_ven;
END //
DELIMITER ;

-- Procedimiento almacenado para buscar por ID (sp_busven)
DELIMITER //
CREATE PROCEDURE sp_busven(
    IN p_id_ven INT
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Vendedor WHERE id_ven = p_id_ven) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El vendedor especificado no existe';
    END IF;
    
    SELECT 
        v.*,
        COALESCE(d.nombre, 'Sin distrito') as distrito
    FROM Vendedor v
    LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
    WHERE v.id_ven = p_id_ven;
END //
DELIMITER ;

-- Procedimiento almacenado para buscar por texto (sp_searchven)
DELIMITER //
CREATE PROCEDURE sp_searchven(
    IN p_search VARCHAR(50)
)
BEGIN
    IF p_search IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El término de búsqueda no puede estar vacío';
    END IF;
    
    SELECT v.*, d.nombre as distrito
    FROM Vendedor v
    LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
    WHERE v.nom_ven LIKE CONCAT('%', p_search, '%')
       OR v.ape_ven LIKE CONCAT('%', p_search, '%')
       OR d.nombre LIKE CONCAT('%', p_search, '%')
       OR v.cel_ven LIKE CONCAT('%', p_search, '%')
    ORDER BY v.id_ven;
END //
DELIMITER ;

-- Procedimiento para asignar distrito por defecto (opcional - comentar si no se requiere)
DELIMITER //
CREATE PROCEDURE sp_asignar_distrito_defecto()
BEGIN
    DECLARE primer_distrito INT;
    
    -- Obtener el ID del primer distrito
    SELECT id_distrito INTO primer_distrito FROM Distrito ORDER BY id_distrito LIMIT 1;
    
    -- Actualizar vendedores sin distrito
    UPDATE Vendedor SET id_distrito = primer_distrito WHERE id_distrito IS NULL;
END //
DELIMITER ;