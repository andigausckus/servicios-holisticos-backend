const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Terapeuta = require("../models/Terapeuta");

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const terapeuta = await Terapeuta.findOne({ email });
    if (!terapeuta) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const contraseñaValida = await bcrypt.compare(password, terapeuta.password);
    if (!contraseñaValida) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // Por ahora, simplemente devolvemos los datos (sin token)
    res.json({
      id: terapeuta._id,
      nombreCompleto: terapeuta.nombreCompleto,
      email: terapeuta.email
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
});

module.exports = router;
