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
        [nom_ven, ape_ven, cel_ven, id_distrito]
      );
      return rows[0];
    } catch (error) {
      console.error("Error en crear:", error);
      throw error;
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

  static async listarPaginado(pagina = 1, porPagina = 1) {
    try {
      // Get all records first
      const { rows } = await db.query("SELECT * FROM sp_lisven()");
      
      // Apply pagination
      const inicio = (pagina - 1) * porPagina;
      const fin = inicio + porPagina;  // This will ensure we get exactly porPagina items
      
      return rows.slice(inicio, fin);
    } catch (error) {
      console.error("Error en listarPaginado:", error);
      return [];
    }
  }
  
  static async contarTodos() {
    try {
      const { rows } = await db.query("SELECT * FROM sp_lisven()");
      return rows.length;
    } catch (error) {
      console.error("Error en contarTodos:", error);
      return 0;
    }
  }
  
  static async buscarPorPaginado(busqueda, tipo, pagina = 1, porPagina = 1) {
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
      
      // Ensure paging works correctly
      const rows = result.rows || [];
      const inicio = (pagina - 1) * porPagina;
      const fin = inicio + porPagina;
      
      // Return exactly porPagina items (or less if at the end)
      return rows.slice(inicio, fin);
    } catch (error) {
      console.error("Error en buscarPorPaginado:", error);
      return [];
    }
  }
  
  static async contarBusqueda(busqueda, tipo) {
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
      return (result.rows || []).length;
    } catch (error) {
      console.error("Error en contarBusqueda:", error);
      return 0;
    }
  }
  
}

module.exports = VendedorModel;