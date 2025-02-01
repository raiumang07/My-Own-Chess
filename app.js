const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js")
const path = require("path");
const { title } = require("process");

const app = express()
const server = http.createServer(app)

const io = socket(server)

const chess = new Chess()

let players = {}
let currentPlayer = "W"

app.set("view engine", "ejs")
app.use(express.static(path.join(__dirname, "public")))

app.get("/", (req, res) => {
    res.render("index", { title: "My Own Chess" })
})

io.on("connection", function (uniqueSocket) {// unique information is in uniqueSocket of connected user
    console.log("A user connected")
    // uniqueSocket.on("new", function () {
    //     console.log("New Game at backend")
    //     io.emit("newGame")
    // })
    // uniqueSocket.on("disconnect", function () {
    //     console.log("A user disconnected")
    // })
    if (!players.white) {
        players.white = uniqueSocket.id
        uniqueSocket.emit("playerRole", "w")
    } else if (!players.black) {
        players.black = uniqueSocket.id
        uniqueSocket.emit("playerRole", "b")
    } else {
        uniqueSocket.emit("spectatorRole")
    }

    uniqueSocket.on("disconnect", function () {
        if (uniqueSocket.id == players.white) {
            delete players.white
        } else if (uniqueSocket.id == players.black) {
            delete players.black
        }
    })

    uniqueSocket.on("move", (move) => {// omve event form frontend
        try {
            if (chess.turn() == "w" && uniqueSocket.id !== players.white) return
            if (chess.turn() == "b" && uniqueSocket.id !== players.black) return
            const result = chess.move(move)// move the returned move
            if (result) {
                currentPlayer = chess.turn()
                io.emit("move", move)// move sent form backend to frontend
                io.emit("boardState", chess.fen())// board state sent form backend to frontend
                // it sends the fen equation of the current state
            } else {
                console.log("Invalid Move : ", move)
                uniqueSocket.emit("invalidMove", move)// only to me emit
            }
        } catch (err) {
            console.log(err)
            uniqueSocket.emit("invalidMove", move)// only to me emit
        }
    })
})
const PORT = process.env.PORT || 3000;
server.listen(PORT, function () {
    console.log("Server listening on port 3000")
})