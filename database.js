const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./marvel_chess.db", (err) => {
    if (err) {
        console.error("❌ Error al conectar a SQLite:", err);
    } else {
        console.log("✅ Conectado a la base de datos SQLite");
    }
});

// Crear la tabla si no existe
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS partidas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jugador_blanco TEXT,
            jugador_negro TEXT,
            movimientos TEXT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;
