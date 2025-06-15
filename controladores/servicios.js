const Servicio = require("../models/Servicio");

const crearServicio = async (req, res) => {
  try {
    const nuevaImagen = req.file ? req.file.filename : null;

    const nuevoServicio = new Servicio({
      ...req.body,
      imagen: nuevaImagen
    });

    const servicioGuardado = await nuevoServicio.save();
    res.status(201).json(servicioGuardado);
  } catch (error) {
    console.error("❌ Error al crear servicio:", error);
    res.status(500).json({ message: "Error al crear el servicio" });
  }
};

module.exports = { crearServicio };
