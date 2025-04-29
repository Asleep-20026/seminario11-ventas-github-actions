const db = require("../config/db");

class VendedorModel {
  static async listarTodos() {
    try {
      const { rows } = await db.query("SELECT * FROM sp_lisven()");
      return rows;
    } catch (error) {
      console.error("Error en listarTodos:", error);
      return [];
    }
  }

  static async buscarPor(busqueda, tipo) {
    try {
      let result;
      switch (tipo) {
        case "id":
          result = await db.query("SELECT * FROM sp_busven($1)", [busqueda]);
          break;
        case "nombre":
        case "apellido":
          result = await db.query("SELECT * FROM sp_searchven($1)", [busqueda]);
          break;
        default:
          result = await db.query("SELECT * FROM sp_lisven()");
      }
      return result.rows || [];
    } catch (error) {
      console.error("Error en buscarPor:", error);
      return [];
    }
  }

  static async listarDistritos() {
    try {
      const { rows } = await db.query("SELECT * FROM sp_lisdistritos()");
      return rows;
    } catch (error) {
      console.error("Error en listarDistritos:", error);
      return [];
    }
  }

  static async buscarPorId(id) {
    try {
        const { rows } = await db.query("SELECT * FROM sp_busven($1)", [id]);
        return rows[0] || null;
    } catch (error) {
        console.error("Error en buscarPorId:", error);
        return null;
    }
}

  static async crear(nom_ven, ape_ven, cel_ven, id_distrito) {
    try {
        const { rows } = await db.query(
            "SELECT * FROM sp_ingven($1, $2, $3, $4)",
            [nom_ven, ape_ven, String(cel_ven).trim(), id_distrito]
        );
        return rows[0];
    } catch (error) {
        console.error("Error al crear vendedor:", error);
        throw new Error(`Error al crear vendedor: ${error.message}`);
    }
  }

  static async actualizar(id_ven, nom_ven, ape_ven, cel_ven, id_distrito) {
    try {
      await db.query("SELECT sp_modven($1, $2, $3, $4, $5)", [
        id_ven,
        nom_ven,
        ape_ven,
        cel_ven,
        id_distrito,
      ]);
      return true;
    } catch (error) {
      console.error("Error en actualizar:", error);
      throw error;
    }
  }

  static async eliminar(id_ven) {
    try {
      await db.query("SELECT sp_delven($1)", [id_ven]);
      return true;
    } catch (error) {
      console.error("Error en eliminar:", error);
      throw error;
    }
  }

  // Métodos de paginación sin cambios
  static async listarPaginado(pagina, porPagina) {
    try {
        const offset = (pagina - 1) * porPagina;
        const query = `
            SELECT 
                v.id_ven,
                v.nom_ven,
                v.ape_ven,
                v.cel_ven,
                v.id_distrito,
                COALESCE(d.nombre, 'Sin distrito') as distrito
            FROM Vendedor v
            LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
            ORDER BY v.id_ven
            LIMIT $1 OFFSET $2
        `;
        const { rows } = await db.query(query, [porPagina, offset]);
        return rows;
    } catch (error) {
        console.error("Error en listarPaginado:", error);
        throw error;
    }
}

  static async contarTodos() {
    try {
      const query = "SELECT COUNT(*) FROM Vendedor";
      const { rows } = await db.query(query);
      return parseInt(rows[0].count);
    } catch (error) {
      console.error("Error en contarTodos:", error);
      throw error;
    }
  }

  static async buscarPorPaginado(busqueda, tipo, pagina, porPagina) {
    try {
      const offset = (pagina - 1) * porPagina;
      let query;
      let params;

      switch (tipo) {
        case "id":
          query = `
            SELECT 
              v.id_ven,
              v.nom_ven,
              v.ape_ven,
              v.cel_ven::varchar,
              COALESCE(d.nombre, 'Sin distrito') as distrito
            FROM Vendedor v
            LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
            WHERE v.id_ven = $1
            ORDER BY v.id_ven
            LIMIT $2 OFFSET $3
          `;
          params = [busqueda, porPagina, offset];
          break;
        case "nombre":
          query = `
            SELECT 
              v.id_ven,
              v.nom_ven,
              v.ape_ven,
              v.cel_ven::varchar,
              COALESCE(d.nombre, 'Sin distrito') as distrito
            FROM Vendedor v
            LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
            WHERE v.nom_ven ILIKE $1
            ORDER BY v.id_ven
            LIMIT $2 OFFSET $3
          `;
          params = [`%${busqueda}%`, porPagina, offset];
          break;
        case "apellido":
          query = `
            SELECT 
              v.id_ven,
              v.nom_ven,
              v.ape_ven,
              v.cel_ven::varchar,
              COALESCE(d.nombre, 'Sin distrito') as distrito
            FROM Vendedor v
            LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
            WHERE v.ape_ven ILIKE $1
            ORDER BY v.id_ven
            LIMIT $2 OFFSET $3
          `;
          params = [`%${busqueda}%`, porPagina, offset];
          break;
        default:
          query = `
            SELECT 
              v.id_ven,
              v.nom_ven,
              v.ape_ven,
              v.cel_ven::varchar,
              COALESCE(d.nombre, 'Sin distrito') as distrito
            FROM Vendedor v
            LEFT JOIN Distrito d ON v.id_distrito = d.id_distrito
            WHERE 
              v.id_ven::text ILIKE $1 OR
              v.nom_ven ILIKE $1 OR
              v.ape_ven ILIKE $1 OR
              v.cel_ven ILIKE $1
            ORDER BY v.id_ven
            LIMIT $2 OFFSET $3
          `;
          params = [`%${busqueda}%`, porPagina, offset];
      }

      const { rows } = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error("Error en buscarPorPaginado:", error);
      return [];
    }
  }

  static async contarBusqueda(busqueda, tipo) {
    try {
      let query;
      let params;

      switch (tipo) {
        case "id":
          query = "SELECT COUNT(*) FROM Vendedor WHERE id_ven = $1";
          params = [busqueda];
          break;
        case "nombre":
          query = "SELECT COUNT(*) FROM Vendedor WHERE nom_ven ILIKE $1";
          params = [`%${busqueda}%`];
          break;
        case "apellido":
          query = "SELECT COUNT(*) FROM Vendedor WHERE ape_ven ILIKE $1";
          params = [`%${busqueda}%`];
          break;
        default:
          query = `
            SELECT COUNT(*) FROM Vendedor 
            WHERE 
              id_ven::text ILIKE $1 OR
              nom_ven ILIKE $1 OR
              ape_ven ILIKE $1 OR
              cel_ven ILIKE $1
          `;
          params = [`%${busqueda}%`];
      }

      const { rows } = await db.query(query, params);
      return parseInt(rows[0].count);
    } catch (error) {
      console.error("Error en contarBusqueda:", error);
      return 0;
    }
  }
}

module.exports = VendedorModel;