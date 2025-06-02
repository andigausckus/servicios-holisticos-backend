const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Esquema temporal (si aún no tenés un modelo separado)
const reservaSchema = new mongoose.Schema({
  usuarioNombre: String,
  usuarioEmail: String,
  fecha: Date,
  terapeutaId: String,
});

const Reserva = mongoose.model('Reserva', reservaSchema);

router.post('/', async (req, res) => {
  try {
    const nuevaReserva = new Reserva(req.body);
    await nuevaReserva.save();
    res.status(201).json({ mensaje: '✅ Reserva registrada', reserva: nuevaReserva });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al guardar reserva', error });
  }
});

module.exports = router;
