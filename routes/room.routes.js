const express = require("express");
const router = express.Router();
const { getAllRooms, getUserRooms, createRoom, joinRoom, leaveRoom, updateRoom, deleteRoom } = require("../controllers/room.controller");
const verifyToken = require("../middelware/verifyToken");

// Récupérer toutes les salles disponibles
router.get("/all", verifyToken, getAllRooms);

// Récupérer les salles d'un utilisateur
router.get("/user/:userId", verifyToken, getUserRooms);

// Créer une nouvelle salle (route RESTful)
router.post("/", verifyToken, createRoom);

// Rejoindre une salle
router.post("/:roomId/join", verifyToken, joinRoom);

// Quitter une salle
router.post("/:roomId/leave", verifyToken, leaveRoom);

// Mettre à jour une salle
router.put("/:roomId", verifyToken, updateRoom);

// Supprimer une salle
router.delete("/:roomId", verifyToken, deleteRoom);

// Transférer l'admin d'une salle à un autre membre
router.post('/:roomId/transfer-admin', verifyToken, require('../controllers/room.controller').transferAdmin);

module.exports = router; 