// ✅ Login de terapeuta
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const terapeuta = await Terapeuta.findOne({ email });
    if (!terapeuta) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const nuevoTerapeuta = new Terapeuta({
  ...req.body,
  aprobado: false  // 🔴 <- Esto es fundamental
});

    const passwordOk = await bcrypt.compare(password, terapeuta.password);
    if (!passwordOk) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    // 🛑 Verificamos si fue aprobado por el admin
    if (!terapeuta.aprobado) {
      return res.status(403).json({
        message:
          "Tu cuenta aún no fue aprobada. Te avisaremos por email cuando esté lista.",
      });
    }

    const token = jwt.sign(
      { id: terapeuta._id, email: terapeuta.email },
      secret,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      terapeuta: { id: terapeuta._id, nombre: terapeuta.nombreCompleto },
    });
  } catch (err) {
    res.status(500).json({ message: "Error en el servidor" });
  }
});
