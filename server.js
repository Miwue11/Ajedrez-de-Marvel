const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database"); // Importar la base de datos SQLite

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("publico")); // Servir archivos estáticos

// Ruta para guardar una partida en SQLite
app.post("/guardar-partida", (req, res) => {
    const { jugador_blanco, jugador_negro, movimientos } = req.body;
    const sql = "INSERT INTO partidas (jugador_blanco, jugador_negro, movimientos) VALUES (?, ?, ?)";
    
    db.run(sql, [jugador_blanco, jugador_negro, JSON.stringify(movimientos)], function (err) {
        if (err) {
            console.error("❌ Error al guardar la partida:", err);
            res.status(500).json({ mensaje: "Error al guardar la partida" });
        } else {
            res.json({ mensaje: "✅ Partida guardada correctamente", id: this.lastID });
        }
    });
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/publico/index.html");
});


// Ruta para obtener todas las partidas guardadas
app.get("/obtener-partidas", (req, res) => {
    db.all("SELECT * FROM partidas", [], (err, rows) => {
        if (err) {
            console.error("❌ Error al obtener partidas:", err);
            res.status(500).json({ mensaje: "Error al obtener partidas" });
        } else {
            res.json(rows);
        }
    });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
