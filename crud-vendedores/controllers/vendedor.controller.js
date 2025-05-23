const VendedorModel = require("../models/vendedor.model");
const path = require("path");

class VendedorController {
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
      console.log("Buscando vendedor con ID:", req.params.id);
      const vendedor = await VendedorModel.buscarPorId(req.params.id);
      console.log("Resultado de la búsqueda:", vendedor);
      
      if (!vendedor) {
        console.error("Vendedor no encontrado para ID:", req.params.id);
        return res.status(404).send("Vendedor no encontrado");
      }
      
      // Verificar si el vendedor tiene un id_ven
      if (!vendedor.id_ven) {
        console.error("Vendedor encontrado pero sin ID para:", req.params.id);
        return res.status(404).send("Datos de vendedor incompletos");
      }
      
      const distritos = await VendedorModel.listarDistritos();
      res.render("editar", { vendedor, distritos });
    } catch (error) {
      console.error("Error al buscar vendedor:", error);
      res.status(500).send("Error al recuperar vendedor");
    }
  }

  static async actualizar(req, res) {
    const { nom_ven, ape_ven, cel_ven, id_distrito } = req.body;
    const id_ven = req.params.id;
    try {
      // Verificar primero si el vendedor existe
      const vendedor = await VendedorModel.buscarPorId(id_ven);
      if (!vendedor) {
        return res.status(404).json({
          success: false,
          message: "El vendedor especificado no existe",
        });
      }

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
      if (!vendedor) {
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
    try {
      // Asegúrate de que pagina sea un número y tenga un valor predeterminado
      const pagina = parseInt(req.query.pagina) || 1;
      const { busqueda, tipo } = req.query;
      const porPagina = 10; // Establecemos 10 vendedores por página
      
      let vendedores = [];
      let totalRegistros = 0;
      
      console.log("Página actual:", pagina);
      
      // Obtener vendedores según la búsqueda y paginación
      if (busqueda && tipo) {
        // Obtener vendedores filtrados con paginación
        vendedores = await VendedorModel.buscarPorPaginado(busqueda, tipo, pagina, porPagina);
        // Contar total de registros que coinciden con la búsqueda
        totalRegistros = await VendedorModel.contarBusqueda(busqueda, tipo);
      } else {
        // Obtener todos los vendedores con paginación
        vendedores = await VendedorModel.listarPaginado(pagina, porPagina);
        // Contar total de registros
        totalRegistros = await VendedorModel.contarTodos();
      }
      
      console.log("Total de registros:", totalRegistros);
      
      // Configuración de la paginación
      const totalPaginas = Math.ceil(totalRegistros / porPagina);
      console.log("Total de páginas:", totalPaginas);
      
      // Generar array con números de página para mostrar en la paginación
      const paginasMostrar = 5; // Máximo número de páginas a mostrar
      let inicio = Math.max(1, pagina - Math.floor(paginasMostrar / 2));
      let fin = Math.min(totalPaginas, inicio + paginasMostrar - 1);
      
      // Ajustar inicio si estamos cerca del final
      if (fin - inicio + 1 < paginasMostrar) {
        inicio = Math.max(1, fin - paginasMostrar + 1);
      }
      
      // Crear arreglo con números de página
      let paginas = [];
      for (let i = inicio; i <= fin; i++) {
        paginas.push(i);
      }
      
      const hayAnterior = pagina > 1;
      const haySiguiente = pagina < totalPaginas;
      
      const distritos = await VendedorModel.listarDistritos();
      
      const calculatedTotalPaginas = Math.max(1, totalPaginas);
      
      console.log("Renderizando con:", {
        totalPaginas: calculatedTotalPaginas, 
        paginaActual: pagina,
        hayAnterior,
        haySiguiente
      });
  
      // Renderizamos la vista con todos los datos necesarios
      res.render("index", {
        vendedores,
        distritos,
        busqueda: busqueda || "",
        tipo: tipo || "todos",
        paginaActual: pagina,
        totalPaginas: calculatedTotalPaginas,
        paginas,
        hayAnterior,
        haySiguiente,
        totalRegistros
      });
    } catch (error) {
      console.error("Error al listar vendedores:", error);
      
      // Manejo de errores conservando estructura de paginación
      const distritos = await VendedorModel.listarDistritos().catch(() => []);
      res.status(500).render("index", {
        vendedores: [],
        distritos,
        busqueda: req.query.busqueda || "",
        tipo: req.query.tipo || "todos",
        paginaActual: 1,
        totalPaginas: 1,
        paginas: [1],
        hayAnterior: false,
        haySiguiente: false,
        totalRegistros: 0,
        error: "Error al cargar vendedores"
      });
    }
  }
}

module.exports = VendedorController;