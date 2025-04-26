-- Script PostgreSQL unificado para sistema de gestión de vendedores
-- Este script combina las características originales adaptadas para PostgreSQL

-- Verificar si la base de datos existe y crearla si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sistema_ventas') THEN
        -- Necesita ser ejecutado por un usuario con privilegios
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE sistema_ventas');
    END IF;
EXCEPTION
    WHEN undefined_function THEN
        -- Si dblink no está disponible, mostramos un mensaje
        RAISE NOTICE 'La extensión dblink no está instalada. Por favor, cree la base de datos manualmente o instale la extensión dblink con: CREATE EXTENSION dblink;';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al verificar/crear la base de datos: %', SQLERRM;
END
$$;

-- Instrucción para conectarse a la base de datos (debe ejecutarse como comando separado)
-- \c sistema_ventas

-- IMPORTANTE: A partir de aquí, asegúrese de estar conectado a la base de datos "sistema_ventas"
-- El resto del script asume que ya está conectado a la base de datos correcta

-- Eliminar funciones si existen
DROP FUNCTION IF EXISTS sp_ingven;
DROP FUNCTION IF EXISTS sp_modven;
DROP FUNCTION IF EXISTS sp_delven;
DROP FUNCTION IF EXISTS sp_lisven;
DROP FUNCTION IF EXISTS sp_busven;
DROP FUNCTION IF EXISTS sp_searchven;
DROP FUNCTION IF EXISTS sp_lisdistritos;
DROP FUNCTION IF EXISTS sp_asignar_distrito_defecto;

-- Eliminar tablas si existen (en orden correcto por las foreign keys)
DROP TABLE IF EXISTS Vendedor;
DROP TABLE IF EXISTS Distrito;

-- Crear la tabla Distrito
CREATE TABLE IF NOT EXISTS Distrito (
    id_distrito SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- Insertar distritos directamente
INSERT INTO Distrito (nombre)
SELECT t.nombre FROM (
    VALUES 
    ('San Juan de Lurigancho'),
    ('San Martín de Porres'),
    ('Ate'),
    ('Comas'),
    ('Villa El Salvador'),
    ('Villa María del Triunfo'),
    ('San Juan de Miraflores'),
    ('Los Olivos'),
    ('Puente Piedra'),
    ('Santiago de Surco')
) AS t(nombre)
WHERE NOT EXISTS (SELECT 1 FROM Distrito LIMIT 1);

-- Crear la tabla Vendedor
CREATE TABLE IF NOT EXISTS Vendedor (
    id_ven SERIAL PRIMARY KEY,
    nom_ven VARCHAR(25) NOT NULL,
    ape_ven VARCHAR(25) NOT NULL,
    cel_ven CHAR(9) NOT NULL,
    id_distrito INTEGER,
    FOREIGN KEY (id_distrito) REFERENCES Distrito(id_distrito) ON DELETE SET NULL
);

-- Función para insertar vendedor
CREATE OR REPLACE FUNCTION sp_ingven(
    p_nom_ven VARCHAR(25),
    p_ape_ven VARCHAR(25),
    p_cel_ven CHAR(9),
    p_id_distrito INTEGER
) RETURNS TABLE (id_vendedor INTEGER) AS $$
DECLARE
    distrito_exists INTEGER;
    new_id INTEGER;
BEGIN
    -- Validar datos no nulos
    IF p_nom_ven IS NULL OR p_ape_ven IS NULL OR p_cel_ven IS NULL THEN
        RAISE EXCEPTION 'Todos los campos son obligatorios';
    END IF;
    
    -- Validar longitud del celular
    IF LENGTH(p_cel_ven) != 9 THEN
        RAISE EXCEPTION 'El número de celular debe tener exactamente 9 dígitos';
    END IF;
    
    -- Validar que el distrito existe
    IF p_id_distrito IS NOT NULL THEN
        SELECT COUNT(*) INTO distrito_exists FROM Distrito WHERE id_distrito = p_id_distrito;
        IF distrito_exists = 0 THEN
            RAISE EXCEPTION 'El distrito especificado no existe';
        END IF;
    END IF;
    
    INSERT INTO Vendedor(nom_ven, ape_ven, cel_ven, id_distrito)
    VALUES (p_nom_ven, p_ape_ven, p_cel_ven, p_id_distrito)
    RETURNING id_ven INTO new_id;
    
    RETURN QUERY SELECT new_id AS id_vendedor;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar vendedor
CREATE OR REPLACE FUNCTION sp_modven(
    p_id_ven INTEGER,
    p_nom_ven VARCHAR(25),
    p_ape_ven VARCHAR(25),
    p_cel_ven CHAR(9),
    p_id_distrito INTEGER
) RETURNS VOID AS $$
DECLARE
    vendedor_exists INTEGER;
    distrito_exists INTEGER;
BEGIN
    -- Validar que el vendedor existe
    SELECT COUNT(*) INTO vendedor_exists FROM Vendedor WHERE id_ven = p_id_ven;
    IF vendedor_exists = 0 THEN
        RAISE EXCEPTION 'El vendedor especificado no existe';
    END IF;
    
    -- Validar datos no nulos
    IF p_nom_ven IS NULL OR p_ape_ven IS NULL OR p_cel_ven IS NULL THEN
        RAISE EXCEPTION 'Todos los campos son obligatorios';
    END IF;
    
    -- Validar longitud del celular
    IF LENGTH(p_cel_ven) != 9 THEN
        RAISE EXCEPTION 'El número de celular debe tener exactamente 9 dígitos';
    END IF;
    
    -- Validar que el distrito existe si se proporciona
    IF p_id_distrito IS NOT NULL THEN
        SELECT COUNT(*) INTO distrito_exists FROM Distrito WHERE id_distrito = p_id_distrito;
        IF distrito_exists = 0 THEN
            RAISE EXCEPTION 'El distrito especificado no existe';
        END IF;
    END IF;
    
    UPDATE Vendedor 
    SET nom_ven = p_nom_ven,
        ape_ven = p_ape_ven,
        cel_ven = p_cel_ven,
        id_distrito = p_id_distrito
    WHERE id_ven = p_id_ven;
END;
$$ LANGUAGE plpgsql;

-- Función para eliminar vendedor
CREATE OR REPLACE FUNCTION sp_delven(
    p_id_ven INTEGER
) RETURNS VOID AS $$
DECLARE
    vendedor_exists INTEGER;
BEGIN
    -- Validar que el vendedor existe
    SELECT COUNT(*) INTO vendedor_exists FROM Vendedor WHERE id_ven = p_id_ven;
    IF vendedor_exists = 0 THEN
        RAISE EXCEPTION 'El vendedor especificado no existe';
    END IF;
    
    DELETE FROM Vendedor WHERE id_ven = p_id_ven;
    
    -- En PostgreSQL no es común reordenar los IDs como en MySQL
    -- Se omite el reordenamiento de IDs
END;
$$ LANGUAGE plpgsql;

-- Función para listar distritos
CREATE OR REPLACE FUNCTION sp_lisdistritos()
RETURNS SETOF Distrito AS $$
BEGIN
    RETURN QUERY SELECT * FROM Distrito ORDER BY nombre;
END;
$$ LANGUAGE plpgsql;

-- Función para listar vendedores
CREATE OR REPLACE FUNCTION sp_lisven()
RETURNS TABLE (
    id_ven INTEGER,
    nom_ven VARCHAR(25),
    ape_ven VARCHAR(25),
    cel_ven CHAR(9),
    id_distrito INTEGER,
    distrito VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id_ven,
        v.nom_ven,
        v.ape_ven,
        v.cel_ven,
        v.id_distrito,
        COALESCE(d.nombre, 'Sin distrito') as distrito
    FROM Vendedor v
    LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
    ORDER BY v.id_ven;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar por ID
CREATE OR REPLACE FUNCTION sp_busven(
    p_id_ven INTEGER
) RETURNS TABLE (
    id_ven INTEGER,
    nom_ven VARCHAR(25),
    ape_ven VARCHAR(25),
    cel_ven CHAR(9),
    id_distrito INTEGER,
    distrito VARCHAR(50)
) AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM Vendedor WHERE id_ven = p_id_ven) THEN
        RAISE EXCEPTION 'El vendedor especificado no existe';
    END IF;
    
    RETURN QUERY
    SELECT 
        v.id_ven,
        v.nom_ven,
        v.ape_ven,
        v.cel_ven,
        v.id_distrito,
        COALESCE(d.nombre, 'Sin distrito') as distrito
    FROM Vendedor v
    LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
    WHERE v.id_ven = p_id_ven;
END;
$$ LANGUAGE plpgsql;

-- Función para buscar por texto
CREATE OR REPLACE FUNCTION sp_searchven(
    p_search VARCHAR(50)
) RETURNS TABLE (
    id_ven INTEGER,
    nom_ven VARCHAR(25),
    ape_ven VARCHAR(25),
    cel_ven CHAR(9),
    id_distrito INTEGER,
    distrito VARCHAR(50)
) AS $$
BEGIN
    IF p_search IS NULL THEN
        RAISE EXCEPTION 'El término de búsqueda no puede estar vacío';
    END IF;
    
    RETURN QUERY
    SELECT 
        v.id_ven,
        v.nom_ven,
        v.ape_ven,
        v.cel_ven,
        v.id_distrito,
        d.nombre as distrito
    FROM Vendedor v
    LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
    WHERE v.nom_ven ILIKE CONCAT('%', p_search, '%')
       OR v.ape_ven ILIKE CONCAT('%', p_search, '%')
       OR d.nombre ILIKE CONCAT('%', p_search, '%')
       OR v.cel_ven LIKE CONCAT('%', p_search, '%')
    ORDER BY v.id_ven;
END;
$$ LANGUAGE plpgsql;

-- Función para asignar distrito por defecto (opcional)
CREATE OR REPLACE FUNCTION sp_asignar_distrito_defecto()
RETURNS VOID AS $$
DECLARE
    primer_distrito INTEGER;
BEGIN
    -- Obtener el ID del primer distrito
    SELECT id_distrito INTO primer_distrito FROM Distrito ORDER BY id_distrito LIMIT 1;
    
    -- Actualizar vendedores sin distrito
    UPDATE Vendedor SET id_distrito = primer_distrito WHERE id_distrito IS NULL;
END;
$$ LANGUAGE plpgsql;