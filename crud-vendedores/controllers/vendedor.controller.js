const VendedorModel = require("../models/vendedor.model");
const path = require("path");

class VendedorController {
  static async listar(req, res) {
    const { busqueda, tipo } = req.query;
    try {
      let vendedores;
      if (busqueda && tipo) {
        vendedores = await VendedorModel.buscarPor(busqueda, tipo);
      } else {
        vendedores = await VendedorModel.listarTodos();
      }
      const distritos = await VendedorModel.listarDistritos();
      res.render("index", {
        vendedores,
        distritos,
        busqueda: busqueda || "",
        tipo: tipo || "todos",
      });
    } catch (error) {
      console.error("Error al listar vendedores:", error);
      res.status(500).render("index", {
        vendedores: [],
        distritos: [],
        error: `Error al recuperar vendedores: ${error.message}`,
        busqueda: busqueda || "",
        tipo: tipo || "todos",
      });
    }
  }

  static async mostrarFormularioNuevo(req, res) {
    try {
      const distritos = await VendedorModel.listarDistritos();
      res.render("nuevo", { distritos });
    } catch (error) {
      console.error("Error al cargar distritos:", error);
      res.status(500).send("Error al cargar el formulario");
    }
  }

  static async crear(req, res) {
    const { nom_ven, ape_ven, cel_ven, id_distrito } = req.body;
    try {
      await VendedorModel.crear(nom_ven, ape_ven, cel_ven, id_distrito);
      res.json({ success: true, message: "Vendedor creado exitosamente" });
    } catch (error) {
      console.error("Error al crear vendedor:", error);
      res.status(500).json({
        success: false,
        message: `Error al crear vendedor: ${error.message}`,
      });
    }
  }

  static async mostrarFormularioEditar(req, res) {
    try {
      const vendedor = await VendedorModel.buscarPorId(req.params.id);
      if (!vendedor || vendedor.length === 0) {
        return res.status(404).send("Vendedor no encontrado");
      }
      const distritos = await VendedorModel.listarDistritos();
      res.render("editar", { vendedor: vendedor[0], distritos });
    } catch (error) {
      console.error("Error al buscar vendedor:", error);
      res.status(500).send("Error al recuperar vendedor");
    }
  }

  static async actualizar(req, res) {
    const { nom_ven, ape_ven, cel_ven, id_distrito } = req.body;
    const id_ven = req.params.id;
    try {
      await VendedorModel.actualizar(
        id_ven,
        nom_ven,
        ape_ven,
        cel_ven,
        id_distrito
      );
      res.json({ success: true, message: "Vendedor actualizado exitosamente" });
    } catch (error) {
      console.error("Error al actualizar vendedor:", error);
      res.status(500).json({
        success: false,
        message: `Error al actualizar vendedor: ${error.message}`,
      });
    }
  }

  static async eliminar(req, res) {
    try {
      const id = req.params.id;
      // Verificar primero si el vendedor existe
      const vendedor = await VendedorModel.buscarPorId(id);
      if (!vendedor || vendedor.length === 0) {
        return res.status(404).json({
          success: false,
          message: "El vendedor especificado no existe",
        });
      }

      await VendedorModel.eliminar(id);
      res.json({ success: true, message: "Vendedor eliminado exitosamente" });
    } catch (error) {
      console.error("Error al eliminar vendedor:", error);
      res.status(500).json({
        success: false,
        message: `Error al eliminar vendedor: ${error.message}`,
      });
    }
  }

  static async exportarPDF(req, res) {
    console.log("Iniciando exportación a PDF...");
    try {
      // 1. Obtener los datos de vendedores
      const vendedores = await VendedorModel.listarTodos();
      console.log(`Datos obtenidos: ${vendedores.length} vendedores`);

      // 2. Verificar que PdfPrinter esté disponible
      let PdfPrinter;
      try {
        PdfPrinter = require("pdfmake");
        console.log("PdfPrinter cargado correctamente");
      } catch (error) {
        console.error("Error al cargar pdfmake:", error);
        return res.status(500).json({
          success: false,
          message:
            "Error: No se pudo cargar la biblioteca PDF. Instale pdfmake con: npm install pdfmake --save",
        });
      }

      // 3. Configurar fuentes - usar fuentes estándar sin rutas específicas
      const fonts = {
        Roboto: {
          normal: "Helvetica",
          bold: "Helvetica-Bold",
          italics: "Helvetica-Oblique",
          bolditalics: "Helvetica-BoldOblique",
        },
      };

      // Si tienes problemas con las fuentes, descomenta estas líneas y comenta las anteriores
      /*
      const fonts = {
        Roboto: {
          normal: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf'),
          bold: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf'),
          italics: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf'),
          bolditalics: path.join(__dirname, '../node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf')
        }
      };
      */

      // 4. Crear instancia de PdfPrinter
      const printer = new PdfPrinter(fonts);
      console.log("Instancia de PdfPrinter creada");

      // 5. Crear definición del documento
      const docDefinition = {
        content: [
          { text: "Lista de Vendedores", style: "header" },
          {
            table: {
              headerRows: 1,
              widths: ["auto", "*", "*", "auto", "*"],
              body: [
                ["ID", "Nombre", "Apellido", "Celular", "Distrito"],
                ...vendedores.map((v) => [
                  v.id_ven,
                  v.nom_ven,
                  v.ape_ven,
                  v.cel_ven,
                  v.distrito
                ]),
              ],
            },
          },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 10],
          },
        },
      };
      console.log("Definición del documento PDF creada");

      // 6. Crear el documento PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      console.log("Documento PDF creado con éxito");

      // 7. Establecer cabeceras de respuesta
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=vendedores.pdf"
      );

      // 8. Enviar el PDF al cliente mediante pipe
      pdfDoc.pipe(res);
      pdfDoc.end();

      console.log("PDF enviado al cliente correctamente");
    } catch (error) {
      console.error("Error en exportarPDF:", error);
      // Si ya se han enviado encabezados, no podemos enviar una respuesta JSON
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: `Error al generar PDF: ${error.message}`,
        });
      } else {
        // Intentar finalizar la respuesta de alguna manera
        try {
          res.end();
        } catch (e) {
          console.error("No se pudo finalizar la respuesta:", e);
        }
      }
    }
  }

  static async exportarCSV(req, res) {
    try {
      const vendedores = await VendedorModel.listarTodos();
      // json2csv se requiere aquí dentro del método
      const { Parser } = require("json2csv");

      const fields = ["id_ven", "nom_ven", "ape_ven", "cel_ven", "distrito"];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(vendedores);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=vendedores.csv"
      );
      res.send(csv);
    } catch (error) {
      console.error("Error al generar CSV:", error);
      res.status(500).json({ success: false, message: "Error al generar CSV" });
    }
  }

  // Método alternativo que genera HTML en lugar de PDF, útil en caso de problemas con pdfmake
  static async exportarHTML(req, res) {
    try {
      const vendedores = await VendedorModel.listarTodos();

      // Crear una tabla HTML simple
      let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Lista de Vendedores</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          h1 { color: #333; }
          .print-btn { margin: 20px 0; padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Lista de Vendedores</h1>
        <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Celular</th>
              <th>Distrito</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Añadir filas de datos
      vendedores.forEach((v) => {
        html += `
          <tr>
            <td>${v.id_ven}</td>
            <td>${v.nom_ven}</td>
            <td>${v.ape_ven}</td>
            <td>${v.cel_ven}</td>
            <td>${v.distrito}</td>
          </tr>
        `;
      });

      // Cerrar la tabla y el documento
      html += `
          </tbody>
        </table>
        <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
      </body>
      </html>
      `;

      // Enviar el HTML como respuesta
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Error al generar HTML:", error);
      res
        .status(500)
        .send(
          `<p>Error al generar la vista: ${error.message}</p><p><a href="/vendedores">Volver</a></p>`
        );
    }
  }
  static async listar(req, res) {
    const { busqueda, tipo } = req.query;
    try {
      let vendedores = [];
      if (busqueda && tipo) {
        vendedores = await VendedorModel.buscarPor(busqueda, tipo);
      } else {
        vendedores = await VendedorModel.listarTodos();
      }
      const distritos = await VendedorModel.listarDistritos();

      // Renderizamos la vista sin mostrar mensaje de error incluso cuando no hay vendedores
      res.render("index", {
        vendedores,
        distritos,
        busqueda: busqueda || "",
        tipo: tipo || "todos",
        // No pasamos un mensaje de error
      });
    } catch (error) {
      console.error("Error al listar vendedores:", error);

      // Incluso con error, evitamos mostrar el mensaje en la interfaz
      const distritos = await VendedorModel.listarDistritos().catch(() => []);
      res.status(500).render("index", {
        vendedores: [],
        distritos,
        busqueda: busqueda || "",
        tipo: tipo || "todos",
        // No pasamos mensaje de error visible
      });
    }
  }
}

module.exports = VendedorController;
