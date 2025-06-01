const express = require("express");
const router = express.Router();
const Terapeuta = require("../models/Terapeuta");

// Obtener todos los terapeutas
router.get("/", async (req, res) => {
  try {
    const terapeutas = await Terapeuta.find();
    res.json(terapeutas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
