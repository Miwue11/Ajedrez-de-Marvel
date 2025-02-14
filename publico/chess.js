// chess.js (FRONT-END: se ejecuta en el navegador)
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
    let enPassantTarget = null;
    let castlingRights = {
      wK: true,
      wR0: true,
      wR7: true,
      bK: true,
      bR0: true,
      bR7: true
    };
    let selectedSquare = null;
    let movimientosRealizados = [];
  
    const pieceImages = {
      'P': 'img/black-panther.gif',
      'R': 'img/WM.gif',
      'N': 'img/spidey.gif',
      'B': 'img/vision.gif',
      'Q': 'img/wanda.gif',
      'K': 'img/toni.gif',
      'p': 'img/falcon.gif',
      'r': 'img/antman.gif',
      'n': 'img/WS.gif',
      'b': 'img/hawkeye.gif',
      'q': 'img/MM.gif',
      'k': 'img/CM.gif'
    };
  
    // Ejemplo de llamada a tu formulario (en tu HTML tienes un <form id="formulario">)
    document.getElementById("formulario").addEventListener("submit", async function(event) {
      event.preventDefault();
      const nombre = document.getElementById("nombre").value;
      // Aquí solo demostración, no confundir con /guardar-partida
      const response = await fetch("/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre })
      });
      const result = await response.json();
      document.getElementById("mensaje").innerText = result.mensaje;
    });
  
    // -------------------------------------------
    // FUNCIONES DE LÓGICA DE AJEDREZ
    // -------------------------------------------
  
    function pieceColor(p) {
      if (p === ".") return null;
      return (p === p.toUpperCase()) ? 'w' : 'b';
    }
  
    function drawBoard() {
      boardElement.innerHTML = "";
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const sqDiv = document.createElement("div");
          sqDiv.classList.add("square", ((row + col) % 2 === 0) ? "light" : "dark");
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
  
    function inBounds(r, c) {
      return (r >= 0 && r < 8 && c >= 0 && c < 8);
    }
  
    function isSquareAttacked(row, col, colorUnderAttack) {
      const enemy = (colorUnderAttack === 'w') ? 'b' : 'w';
      const enemyMoves = generateAllMoves(enemy);
      return enemyMoves.some(m => (m.end.r === row && m.end.c === col));
    }
  
    // Genera todos los movimientos pseudo-legales de un color
    function generateAllMoves(color) {
      const moves = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (pieceColor(board[r][c]) === color) {
            const sqMoves = generateMovesForSquare(r, c);
            moves.push(...sqMoves);
          }
        }
      }
      return moves;
    }
  
    // Genera los movimientos de una pieza en (row, col)
    function generateMovesForSquare(row, col) {
      const p = board[row][col];
      if (p === ".") return [];
      const color = pieceColor(p);
      const moves = [];
      const directionsKnight = [
        [-2, -1], [-2, 1], [2, -1], [2, 1],
        [-1, -2], [-1, 2], [1, -2], [1, 2]
      ];
      const directionsRook = [[1,0],[-1,0],[0,1],[0,-1]];
      const directionsBishop = [[1,1],[1,-1],[-1,1],[-1,-1]];
      const directionsKing = [
        [1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]
      ];
  
      switch (p.toUpperCase()) {
        case 'P': {
          const forward = (color==='w') ? -1 : 1;
          const startRank = (color==='w') ? 6 : 1;
          const fr = row + forward;
  
          // Avance simple
          if (inBounds(fr, col) && board[fr][col] === ".") {
            moves.push({ start: {r: row, c: col}, end: {r: fr, c: col} });
            // Avance doble
            if (row === startRank) {
              const fr2 = row + 2 * forward;
              if (inBounds(fr2, col) && board[fr2][col] === ".") {
                moves.push({
                  start: {r: row, c: col},
                  end: {r: fr2, c: col},
                  special: 'double'
                });
              }
            }
          }
  
          // Capturas diagonales
          for (let dc of [-1, 1]) {
            const cc = col + dc;
            if (inBounds(fr, cc) && board[fr][cc] !== "." &&
                pieceColor(board[fr][cc]) !== color) {
              moves.push({ start: {r: row, c: col}, end: {r: fr, c: cc} });
            }
          }
  
          // En passant
          if (enPassantTarget) {
            const { row: epRow, col: epCol } = enPassantTarget;
            if (fr === epRow && Math.abs(epCol - col) === 1) {
              moves.push({
                start: {r: row, c: col},
                end: {r: epRow, c: epCol},
                special: 'enpassant'
              });
            }
          }
          break;
        }
        case 'N': {
          for (let d of directionsKnight) {
            const nr = row + d[0], nc = col + d[1];
            if (inBounds(nr, nc) && pieceColor(board[nr][nc]) !== color) {
              moves.push({ start: {r: row, c: col}, end: {r: nr, c: nc} });
            }
          }
          break;
        }
        case 'R': {
          for (let d of directionsRook) {
            let nr = row, nc = col;
            while(true) {
              nr += d[0]; 
              nc += d[1];
              if (!inBounds(nr, nc)) break;
              if (pieceColor(board[nr][nc]) === color) break;
              moves.push({ start: {r: row, c: col}, end: {r: nr, c: nc} });
              if (pieceColor(board[nr][nc]) !== null) break;
            }
          }
          break;
        }
        case 'B': {
          for (let d of directionsBishop) {
            let nr = row, nc = col;
            while(true) {
              nr += d[0]; 
              nc += d[1];
              if (!inBounds(nr, nc)) break;
              if (pieceColor(board[nr][nc]) === color) break;
              moves.push({ start: {r: row, c: col}, end: {r: nr, c: nc} });
              if (pieceColor(board[nr][nc]) !== null) break;
            }
          }
          break;
        }
        case 'Q': {
          // Dama = Torre + Alfil
          const dirs = [...directionsRook, ...directionsBishop];
          for (let d of dirs) {
            let nr = row, nc = col;
            while(true) {
              nr += d[0]; 
              nc += d[1];
              if (!inBounds(nr, nc)) break;
              if (pieceColor(board[nr][nc]) === color) break;
              moves.push({ start: {r: row, c: col}, end: {r: nr, c: nc} });
              if (pieceColor(board[nr][nc]) !== null) break;
            }
          }
          break;
        }
        case 'K': {
          // Movimientos normales
          for (let d of directionsKing) {
            const nr = row + d[0], nc = col + d[1];
            if (inBounds(nr, nc) && pieceColor(board[nr][nc]) !== color) {
              moves.push({ start: {r: row, c: col}, end: {r: nr, c: nc} });
            }
          }
          // Enroque
          if (color === 'w') {
            if (row === 7 && col === 4) {
              // Enroque corto (Rey e1 a g1) => castlingRights.wK && castlingRights.wR7
              if (castlingRights.wK && castlingRights.wR7) {
                if (board[7][5] === '.' && board[7][6] === '.' &&
                    !isSquareAttacked(7, 4, 'w') &&
                    !isSquareAttacked(7, 5, 'w') &&
                    !isSquareAttacked(7, 6, 'w')) {
                  moves.push({
                    start: {r: 7, c: 4},
                    end: {r: 7, c: 6},
                    special: 'castleShort'
                  });
                }
              }
              // Enroque largo (Rey e1 a c1) => castlingRights.wK && castlingRights.wR0
              if (castlingRights.wK && castlingRights.wR0) {
                if (board[7][1] === '.' && board[7][2] === '.' && board[7][3] === '.' &&
                    !isSquareAttacked(7, 4, 'w') &&
                    !isSquareAttacked(7, 3, 'w') &&
                    !isSquareAttacked(7, 2, 'w')) {
                  moves.push({
                    start: {r: 7, c: 4},
                    end: {r: 7, c: 2},
                    special: 'castleLong'
                  });
                }
              }
            }
          } else {
            if (row === 0 && col === 4) {
              // Enroque corto (Rey e8 a g8)
              if (castlingRights.bK && castlingRights.bR7) {
                if (board[0][5] === '.' && board[0][6] === '.' &&
                    !isSquareAttacked(0, 4, 'b') &&
                    !isSquareAttacked(0, 5, 'b') &&
                    !isSquareAttacked(0, 6, 'b')) {
                  moves.push({
                    start: {r: 0, c: 4},
                    end: {r: 0, c: 6},
                    special: 'castleShort'
                  });
                }
              }
              // Enroque largo (Rey e8 a c8)
              if (castlingRights.bK && castlingRights.bR0) {
                if (board[0][1] === '.' && board[0][2] === '.' && board[0][3] === '.' &&
                    !isSquareAttacked(0, 4, 'b') &&
                    !isSquareAttacked(0, 3, 'b') &&
                    !isSquareAttacked(0, 2, 'b')) {
                  moves.push({
                    start: {r: 0, c: 4},
                    end: {r: 0, c: 2},
                    special: 'castleLong'
                  });
                }
              }
            }
          }
          break;
        }
      }
      return moves;
    }
  
    function makeMove(move) {
      const { start, end, special } = move;
      const piece = board[start.r][start.c];
      const captured = board[end.r][end.c];
  
      // Realizar movimiento
      board[end.r][end.c] = piece;
      board[start.r][start.c] = ".";
  
      // Peón avanza doble => habilita enPassantTarget
      if (special === 'double') {
        const middleRow = (start.r + end.r) / 2;
        enPassantTarget = { row: middleRow, col: start.c };
      } else {
        enPassantTarget = null;
      }
  
      // En Passant
      if (special === 'enpassant') {
        if (piece === 'P') {
          // Peón blanco captura al paso => peón negro está una fila abajo
          board[end.r + 1][end.c] = ".";
        } else if (piece === 'p') {
          // Peón negro => peón blanco está una fila arriba
          board[end.r - 1][end.c] = ".";
        }
      }
  
      // Promoción a dama
      if ((piece === 'P' && end.r === 0) || (piece === 'p' && end.r === 7)) {
        board[end.r][end.c] = (piece === 'P') ? 'Q' : 'q';
      }
  
      // Enroque
      if (special === 'castleShort') {
        if (piece === 'K') {
          board[end.r][5] = 'R';
          board[end.r][7] = '.';
        } else if (piece === 'k') {
          board[end.r][5] = 'r';
          board[end.r][7] = '.';
        }
      } else if (special === 'castleLong') {
        if (piece === 'K') {
          board[end.r][3] = 'R';
          board[end.r][0] = '.';
        } else if (piece === 'k') {
          board[end.r][3] = 'r';
          board[end.r][0] = '.';
        }
      }
  
      updateCastlingRights(piece, start, end);
  
      return { piece, captured, special };
    }
  
    function undoMove(move, data) {
      const { start, end, special } = move;
      const { piece, captured } = data;
  
      board[start.r][start.c] = piece;
      board[end.r][end.c] = captured;
  
      if (special === 'enpassant') {
        if (piece === 'P') {
          board[end.r + 1][end.c] = 'p';
        } else if (piece === 'p') {
          board[end.r - 1][end.c] = 'P';
        }
      }
  
      if (special === 'castleShort') {
        if (piece === 'K') {
          board[start.r][7] = 'R';
          board[start.r][5] = '.';
        } else if (piece === 'k') {
          board[start.r][7] = 'r';
          board[start.r][5] = '.';
        }
      } else if (special === 'castleLong') {
        if (piece === 'K') {
          board[start.r][0] = 'R';
          board[start.r][3] = '.';
        } else if (piece === 'k') {
          board[start.r][0] = 'r';
          board[start.r][3] = '.';
        }
      }
    }
  
    function updateCastlingRights(piece, start, end) {
      const c = pieceColor(piece);
      // Si mueve el rey, pierde todo el derecho de enroque
      if (piece.toUpperCase() === 'K') {
        if (c === 'w') {
          castlingRights.wK = false;
          castlingRights.wR0 = false;
          castlingRights.wR7 = false;
        } else {
          castlingRights.bK = false;
          castlingRights.bR0 = false;
          castlingRights.bR7 = false;
        }
      }
      // Si mueve una torre, pierde el derecho de enroque de ese lado
      if (piece.toUpperCase() === 'R') {
        if (c === 'w') {
          if (start.r === 7 && start.c === 0) castlingRights.wR0 = false; // Torre a1
          if (start.r === 7 && start.c === 7) castlingRights.wR7 = false; // Torre h1
        } else {
          if (start.r === 0 && start.c === 0) castlingRights.bR0 = false; // Torre a8
          if (start.r === 0 && start.c === 7) castlingRights.bR7 = false; // Torre h8
        }
      }
    }
  
    function isInCheck(color) {
      let kingPos = null;
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p !== "." && pieceColor(p) === color && p.toUpperCase() === 'K') {
            kingPos = { r, c };
            break;
          }
        }
        if (kingPos) break;
      }
      if (!kingPos) return false;
      return isSquareAttacked(kingPos.r, kingPos.c, color);
    }
  
    // Comprueba si el color dado puede mover
    function canMove(color) {
      const allMoves = generateAllMoves(color);
      for (let mv of allMoves) {
        const moveData = makeMove(mv);
        if (!isInCheck(color)) {
          undoMove(mv, moveData);
          return true;
        }
        undoMove(mv, moveData);
      }
      return false;
    }
  
    // Verifica si (start->end) es un movimiento pseudo-legal
    function isValidMovePseudo(startSquare, endSquare, moverColor) {
      const sR = startSquare.r, sC = startSquare.c;
      const eR = endSquare.r, eC = endSquare.c;
      const piece = board[sR][sC];
      if (!piece || pieceColor(piece) !== moverColor) return false;
      const pseudoMoves = generateMovesForSquare(sR, sC);
      return pseudoMoves.some(pm => pm.end.r === eR && pm.end.c === eC);
    }
  
    function tryMove(start, end) {
      if (gameOver) return false;
      const piece = board[start.r][start.c];
      const color = pieceColor(piece);
      if (!piece || color !== currentPlayer) return false;
  
      if (!isValidMovePseudo(start, end, color)) {
        return false;
      }
  
      const allPseudo = generateMovesForSquare(start.r, start.c);
      const moveObj = allPseudo.find(m => m.end.r === end.r && m.end.c === end.c);
      const moveData = makeMove(moveObj);
  
      // Si quedo en jaque tras mi jugada, se deshace
      if (isInCheck(color)) {
        undoMove(moveObj, moveData);
        return false;
      }
  
      // Guardamos el movimiento en historial (opcional)
      movimientosRealizados.push({
        piece,
        start,
        end,
        captured: moveData.captured,
        special: moveData.special
      });
  
      // Cambiamos de jugador
      const prevPlayer = currentPlayer;
      currentPlayer = (currentPlayer === 'w') ? 'b' : 'w';
  
      // Comprobamos jaque al nuevo jugador
      if (isInCheck(currentPlayer)) {
        alert(`¡Jaque a las ${(currentPlayer === 'w') ? 'blancas' : 'negras'}!`);
        // Si no puede moverse, es mate
        if (!canMove(currentPlayer)) {
          alert(`¡Jaque mate! Ganan las ${(prevPlayer === 'w') ? 'blancas' : 'negras'}.`);
          gameOver = true;
        }
      } else {
        // Si no está en jaque, pero tampoco puede mover => ahogado (tablas)
        if (!canMove(currentPlayer)) {
          alert("¡Tablas por ahogado!");
          gameOver = true;
        }
      }
  
      return true;
    }
  
    // Manejador de clicks en el tablero
    boardElement.addEventListener('click', (ev) => {
      if (gameOver) return;
      const target = ev.target;
      if (!target.classList.contains('square') && target.tagName !== 'IMG') return;
  
      const squareDiv = target.classList.contains('square') ? target : target.parentElement;
      const row = +squareDiv.dataset.row;
      const col = +squareDiv.dataset.col;
  
      if (!selectedSquare) {
        const piece = board[row][col];
        if (piece !== '.' && pieceColor(piece) === currentPlayer) {
          selectedSquare = { r: row, c: col };
          squareDiv.classList.add('selected');
        }
      } else {
        const squares = boardElement.querySelectorAll('.square');
        squares.forEach(sq => sq.classList.remove('selected'));
  
        tryMove(selectedSquare, { r: row, c: col });
        selectedSquare = null;
        drawBoard();
      }
    });
  
    drawBoard();
  
    // EJEMPLO de guardar partida al final:
    // Llamar a esta función cuando se termine la partida
    async function finalizarPartida() {
      // Pedimos nombres a los jugadores
      const jugadorBlanco = prompt("Nombre del jugador de piezas blancas:");
      const jugadorNegro = prompt("Nombre del jugador de piezas negras:");
  
      // Petición al servidor Node
      const response = await fetch("/guardar-partida", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jugador_blanco: jugadorBlanco,
          jugador_negro: jugadorNegro,
          movimientos: movimientosRealizados
        })
      });
      const result = await response.json();
      console.log(result.mensaje);
    }
  
  });
  