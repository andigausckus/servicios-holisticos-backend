const Servicio = require("../models/Servicio");

exports.crearServicio = async (req, res) => {
  try {
    console.log("✅ Entrando al controlador crearServicio");
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);

    const nuevoServicio = new Servicio({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      modalidad: Array.isArray(req.body.modalidad) ? req.body.modalidad : [req.body.modalidad],
      ubicacion: req.body.ubicacion || "",
      duracion: req.body.duracion,
      precio: req.body.precio,
      categoria: req.body.categoria,
      terapeuta: req.usuarioId, // viene del auth middleware
      imagen: req.file ? req.file.filename : null,
    });

    await nuevoServicio.save();

    res.status(201).json(nuevoServicio);
  } catch (error) {
    console.error("❌ Error al crear el servicio:", error);
    res.status(500).json({ mensaje: "Error al crear el servicio" });
  }
};
