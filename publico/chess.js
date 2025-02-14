document.addEventListener("DOMContentLoaded", () => {
    const boardElement = document.getElementById("chessboard");

    let board = [
        ["r","n","b","q","k","b","n","r"],
        ["p","p","p","p","p","p","p","p"],
        [".",".",".",".",".",".",".","."],
        [".",".",".",".",".",".",".","."],
        [".",".",".",".",".",".",".","."],
        [".",".",".",".",".",".",".","."],
        ["P","P","P","P","P","P","P","P"],
        ["R","N","B","Q","K","B","N","R"]
    ];

    let currentPlayer = 'w';
    let gameOver = false;
    let selectedSquare = null;
    let movimientosRealizados = [];

    const pieceImages = {
        'P': '/img/black-panther.gif',
        'R': '/img/WM.gif',
        'N': '/img/spidey.gif',
        'B': '/img/vision.gif',
        'Q': '/img/wanda.gif',
        'K': '/img/toni.gif',
        'p': '/img/falcon.gif',
        'r': '/img/antman.gif',
        'n': '/img/WS.gif',
        'b': '/img/hawkeye.gif',
        'q': '/img/MM.gif',
        'k': '/img/CM.gif'
    };

    function drawBoard() {
        boardElement.innerHTML = "";
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const sqDiv = document.createElement("div");
                sqDiv.classList.add("square", ((row+col)%2===0)? "light":"dark");
                sqDiv.dataset.row = row;
                sqDiv.dataset.col = col;

                const piece = board[row][col];
                if (piece !== ".") {
                    const img = document.createElement("img");
                    img.src = pieceImages[piece];
                    sqDiv.appendChild(img);
                }
                boardElement.appendChild(sqDiv);
            }
        }
    }

    async function guardarPartida(jugadorBlanco, jugadorNegro, movimientos) {
        const response = await fetch("/guardar-partida", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                jugador_blanco: jugadorBlanco,
                jugador_negro: jugadorNegro,
                movimientos: movimientos
            })
        });

        const result = await response.json();
        console.log(result.mensaje);
    }

    function finalizarPartida() {
        const jugadorBlanco = prompt("Nombre del jugador de piezas blancas:");
        const jugadorNegro = prompt("Nombre del jugador de piezas negras:");
        guardarPartida(jugadorBlanco, jugadorNegro, movimientosRealizados);
    }

    document.getElementById("formulario").addEventListener("submit", async function(event) {
        event.preventDefault();
        const nombre = document.getElementById("nombre").value;
        
        const response = await fetch("/guardar-partida", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jugador_blanco: nombre, jugador_negro: "Desconocido", movimientos: [] })
        });

        const result = await response.json();
        document.getElementById("mensaje").innerText = result.mensaje;
    });

    drawBoard();
});
