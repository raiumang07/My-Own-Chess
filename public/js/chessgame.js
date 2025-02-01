const socket = io()
// only this line does the frontend work of socket io connection

// emit means sending phekna bhejna
// socket.emit("new")
// socket.on("newGame", function () {
//     console.log("New Game at frontend")
// })

const chess = new Chess()
const boardElement = document.querySelector(".chessboard")

let draggedPiece = null
let sourceSquare = null
let playerRole = null


const renderBoard = () => {
    const board = chess.board()
    boardElement.innerHTML = ""
    // console.log(board)
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div")
            squareElement.classList.add("square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            )
            squareElement.dataset.row = rowIndex
            squareElement.dataset.col = squareIndex
            if (square) {
                const pieceElement = document.createElement("div")
                pieceElement.classList.add("piece", square.color === "w" ? "white" : "black")
                pieceElement.innerText = getPieceUnicode(square.type)
                pieceElement.draggable = playerRole === square.color

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement
                        sourceSquare = { row: rowIndex, col: squareIndex }
                        e.dataTransfer.setData("text/plain", "")// so that there isno problem in the drag
                    }
                })

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null
                    sourceSquare = null
                })

                squareElement.appendChild(pieceElement)

            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault()
            })
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault()
                if (draggedPiece) {
                    const targetSquare = { row: parseInt(squareElement.dataset.row), col: parseInt(squareElement.dataset.col) }
                    handleMove(sourceSquare, targetSquare)
                }
            })
            boardElement.appendChild(squareElement)
        })
    })
    if (playerRole === "b") {
        boardElement.classList.add("flipped")
    } else {
        boardElement.classList.remove("flipped")
    }
}
const handleMove = (source, target) => {
    const move = chess.move({
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q"
    })
    if (move) {
        renderBoard()
    }
    socket.emit("move", move)
}
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙",
        // p: "\u265F",
        n: "\u265E",
        b: "\u265D",
        r: "\u265C",
        q: "\u265B",
        k: "\u265A",
        P: "\u2659",
        N: "\u2658",
        B: "\u2657",
        R: "\u2656",
        Q: "\u2655",
        K: "\u2654",
    }

    return unicodePieces[piece] || ""
}

socket.on("playerRole", (role) => {
    playerRole = role
    renderBoard()
})
socket.on("spectatorRole", () => {
    playerRole = null
    renderBoard()
})
socket.on("boardState", (stateFen) => {
    chess.load(stateFen)
    renderBoard()
})
socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});



renderBoard()