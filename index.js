require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectMongoDB = require("./config/db");

const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Rendre l'instance io accessible dans les contrôleurs
app.set('io', io);

const PORT = process.env.PORT || 4000;

connectMongoDB();

app.use(express.json());
app.use(cors({ exposedHeaders: ["Authorization"] })); // ✅ Permet au client d'envoyer le header

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/chatroom", require("./routes/chatroom.routes"));
app.use("/api/rooms", require("./routes/room.routes"));

// --- Import de la logique socket.io ---
require("./socket")(io);

app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});