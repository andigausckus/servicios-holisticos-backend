const Servicio = require("../modelos/Servicio");

exports.crearServicio = async (req, res) => {
  try {
    console.log("✅ Entrando al controlador crearServicio");
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);

    const nuevoServicio = new Servicio({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      modalidad: req.body.modalidad,
      duracion: req.body.duracion,
      precio: req.body.precio,
      plataforma: req.body.plataforma,
      terapeuta: req.user.id, // este dato viene del token gracias a `auth`
      imagen: req.file ? req.file.filename : null
    });

    await nuevoServicio.save();

    res.status(201).json(nuevoServicio);
  } catch (error) {
    console.error("❌ Error al crear el servicio:", error);
    res.status(500).json({ mensaje: "Error al crear el servicio" });
  }
};
