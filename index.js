require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectMongoDB = require("./config/db");
const fs = require('fs');
const path = require('path');

const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://linko-app.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Rendre l'instance io accessible dans les contrôleurs
app.set('io', io);

const PORT = process.env.PORT || 4000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

connectMongoDB();

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "https://linko-app.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Authorization"],
  credentials: true
}));
// Pour répondre aux requêtes préflight (OPTIONS)
app.options('*', cors());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/chatroom", require("./routes/chatroom.routes"));
app.use("/api/rooms", require("./routes/room.routes"));

require("./socket")(io);

app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// ✅ Ce message est plus neutre pour un environnement cloud
server.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});