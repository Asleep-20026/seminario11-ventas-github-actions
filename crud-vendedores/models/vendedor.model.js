const db = require("../config/db");

class VendedorModel {
  static async listarTodos() {
    const [rows] = await db.query("CALL sp_lisven()");
    return rows[0];
  }

  static async buscarPor(busqueda, tipo) {
    let rows;
    try {
      switch (tipo) {
        case "id":
          [rows] = await db.query("CALL sp_busven(?)", [busqueda]);
          break;
        case "nombre":
        case "apellido":
          [rows] = await db.query("CALL sp_searchven(?)", [busqueda]);
          break;
        default:
          [rows] = await db.query("CALL sp_lisven()");
      }
      return rows[0] || []; // Aseguramos que siempre devuelva al menos un array vacío
    } catch (error) {
      console.error("Error en buscarPor:", error);
      return []; // Devolvemos un array vacío en caso de error
    }
  }

  static async listarDistritos() {
    const [rows] = await db.query("CALL sp_lisdistritos()");
    return rows[0];
  }

  static async buscarPorId(id) {
    try {
      const [rows] = await db.query("CALL sp_busven(?)", [id]);
      return rows[0] || []; // Aseguramos que siempre devuelva al menos un array vacío
    } catch (error) {
      console.error("Error en buscarPorId:", error);
      return []; // Devolvemos un array vacío en caso de error
    }
  }

  static async crear(nom_ven, ape_ven, cel_ven, id_distrito) {
    const [result] = await db.query("CALL sp_ingven(?, ?, ?, ?)", [
      nom_ven,
      ape_ven,
      cel_ven,
      id_distrito,
    ]);
    return result[0];
  }

  static async actualizar(id_ven, nom_ven, ape_ven, cel_ven, id_distrito) {
    return await db.query("CALL sp_modven(?, ?, ?, ?, ?)", [
      id_ven,
      nom_ven,
      ape_ven,
      cel_ven,
      id_distrito,
    ]);
  }

  static async eliminar(id_ven) {
    return await db.query("CALL sp_delven(?)", [id_ven]);
  }
}

module.exports = VendedorModel;
