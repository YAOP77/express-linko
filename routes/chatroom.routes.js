const express = require('express');
const router = express.Router();
const chatroomController = require('../controllers/chatroom.controller');
const multer = require('multer');
const path = require('path');
const verifyToken = require('../middelware/verifyToken');

// Config multer pour stocker les fichiers dans /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Sauvegarder un message
router.post('/message', chatroomController.saveMessage);

// Upload de fichier (image/vidéo)
router.post('/upload', upload.single('file'), chatroomController.uploadFileMessage);

// Récupérer l'historique
router.get('/history', chatroomController.getHistory);

// Récupérer les contacts
router.get('/contacts', chatroomController.getContacts);

// Récupérer les contacts online
router.get('/online-contacts', chatroomController.getOnlineContacts);

// Récupérer l'historique des messages de groupe
router.get('/group-history/:roomId', chatroomController.getGroupHistory);

// Supprimer un message
router.delete('/message/:id', verifyToken, chatroomController.deleteMessage);

// Ajouter/retirer un message des favoris
router.patch('/message/:id/save', verifyToken, chatroomController.saveMessageToggle);

// Récupérer les messages gardés
router.get('/saved/:userId', verifyToken, chatroomController.getSavedMessages);

module.exports = router; 