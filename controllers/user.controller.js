const User = require("../models/User");
const multer = require('multer');
const path = require('path');
const Report = require('../models/Report');

// Config multer pour les avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Vérifier que c'est une image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
}).single('avatar');

exports.searchUsers = async (req, res) => {
    const query = req.query.query;
    // console.log("✅ Requête reçue :", req.query.query);
    const currentUserId = req.user.id;

    try {
        const users = await User.find({
            _id: { $ne: currentUserId },
            $or: [
                { username: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } }
            ]
        }).select("_id username avatar status");

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la recherche", error: error.message });
    }
}

// Récupérer tous les utilisateurs online
exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ status: 'online' }).select('_id username avatar status');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs online', error: error.message });
  }
};

// Récupérer un utilisateur spécifique par ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('_id username avatar status age hobby localisation relationship');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur', error: error.message });
  }
};

// Mettre à jour les informations de l'utilisateur connecté
exports.updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, age, hobby, localisation, relationship } = req.body;
    
    // Vérifier que l'utilisateur met à jour son propre profil
    if (id !== req.user.id) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que votre propre profil' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { username, age, hobby, localisation, relationship },
      { new: true }
    ).select('_id username avatar status age hobby localisation relationship');

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error: error.message });
  }
};

// Upload d'un avatar utilisateur
exports.uploadAvatar = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé' });
    }

    try {
      const { id } = req.params;
      
      // Vérifier que l'utilisateur met à jour son propre avatar
      if (id !== req.user.id) {
        return res.status(403).json({ message: 'Vous ne pouvez modifier que votre propre avatar' });
      }

      const fileName = req.file.filename;
      
      // Mettre à jour l'avatar de l'utilisateur
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { avatar: fileName },
        { new: true }
      ).select('_id username avatar status age hobby localisation');

      if (!updatedUser) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      // Émettre l'événement socket pour la mise à jour en temps réel
      // Note: req.app.get('io') sera configuré dans index.js
      const io = req.app.get('io')
      if (io) {
        io.emit('userAvatarUpdated', {
          userId: id, 
          newAvatar: fileName,
          user: updatedUser 
        });
        console.log('📤 SOCKET - Événement userAvatarUpdated émis');
      }

      res.json({
        message: 'Avatar mis à jour avec succès',
        avatar: fileName,
        user: updatedUser
      });
    } catch (error) {
      res.status(500).json({ message: 'Erreur lors de l\'upload de l\'avatar', error: error.message });
    }
  });
};

// Bloquer un utilisateur
exports.blockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    if (userId === targetId) return res.status(400).json({ message: "Vous ne pouvez pas vous bloquer vous-même." });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (!user.blockedUsers.includes(targetId)) {
      user.blockedUsers.push(targetId);
      await user.save();
    }
    
    // Émettre l'événement socket pour la mise à jour en temps réel
    const io = req.app.get('io');
    if (io) {
      io.emit('userBlocked', { 
        blockerId: userId, 
        blockedId: targetId,
        action: 'block'
      });
      console.log('📤 SOCKET - Événement userBlocked émis');
    }
    
    res.json({ message: "Utilisateur bloqué." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du blocage.", error: error.message });
  }
};

// Débloquer un utilisateur
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== targetId);
    await user.save();
    
    // Émettre l'événement socket pour la mise à jour en temps réel
    const io = req.app.get('io');
    if (io) {
      io.emit('userBlocked', { 
        blockerId: userId, 
        blockedId: targetId,
        action: 'unblock'
      });
      console.log('📤 SOCKET - Événement userBlocked émis (unblock)');
    }
    
    res.json({ message: "Utilisateur débloqué." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du déblocage.", error: error.message });
  }
};

// Vérifier si l'utilisateur courant a bloqué ou est bloqué par l'autre
exports.isBlocked = async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.id;
    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!user || !target) return res.status(404).json({ message: "Utilisateur non trouvé." });
    const iBlock = user.blockedUsers.includes(targetId);
    const blockedMe = target.blockedUsers.includes(userId);
    res.json({ iBlock, blockedMe });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la vérification du blocage.", error: error.message });
  }
};

// Récupérer tous les utilisateurs (pour l'admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id username email avatar status');
    res.json(users);
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: error.message });
  }
};

exports.setAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    const user = await User.findByIdAndUpdate(id, { isAdmin }, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la modification du rôle admin', error: error.message });
  }
};

exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, reporter, reason, timestamp } = req.body;
    if (!reportedUserId || !reporter || !reason) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }
    const report = new Report({ reportedUserId, reporter, reason, timestamp });
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du signalement', error: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'username email')
      .populate('reportedUser', 'username email')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des signalements', error: error.message });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    console.log('🔍 DEBUG deleteUser:');
    console.log('  - req.user:', req.user);
    console.log('  - req.user.isAdmin:', req.user.isAdmin);
    console.log('  - adminId:', adminId);
    console.log('  - userToDeleteId:', id);

    // Vérifier que l'utilisateur qui fait la demande est admin
    if (!req.user.isAdmin) {
      console.log('❌ Accès refusé: utilisateur non admin');
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent supprimer des utilisateurs' });
    }

    // Vérifier que l'utilisateur à supprimer existe
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      console.log('❌ Utilisateur à supprimer non trouvé');
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher un admin de se supprimer lui-même
    if (id === adminId) {
      console.log('❌ Tentative de suppression de soi-même');
      return res.status(400).json({ message: 'Un administrateur ne peut pas se supprimer lui-même' });
    }

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(id);
    console.log('✅ Utilisateur supprimé avec succès');

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteUser:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: error.message });
  }
};

// Bannir un utilisateur
exports.banUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, duration } = req.body;
    const adminId = req.user.id;

    // Vérifier que l'utilisateur qui fait la demande est admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent bannir des utilisateurs' });
    }

    // Vérifier que l'utilisateur à bannir existe
    const userToBan = await User.findById(id);
    if (!userToBan) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher un admin de se bannir lui-même
    if (id === adminId) {
      return res.status(400).json({ message: 'Un administrateur ne peut pas se bannir lui-même' });
    }

    // Calculer la date d'expiration du bannissement
    let banExpiresAt = null;
    if (duration) {
      // duration en heures (ex: 24 pour 24h)
      banExpiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);
    }
    // Si pas de duration, bannissement permanent (banExpiresAt reste null)

    // Bannir l'utilisateur
    await User.findByIdAndUpdate(id, {
      isBanned: true,
      banReason: reason,
      banExpiresAt: banExpiresAt,
      bannedBy: adminId
    });

    const banType = duration ? `${duration}h` : 'permanent';
    res.json({ 
      message: `Utilisateur banni avec succès (${banType})`,
      banExpiresAt: banExpiresAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du bannissement', error: error.message });
  }
};

// Débannir un utilisateur
exports.unbanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Vérifier que l'utilisateur qui fait la demande est admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent débannir des utilisateurs' });
    }

    // Vérifier que l'utilisateur à débannir existe
    const userToUnban = await User.findById(id);
    if (!userToUnban) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Débannir l'utilisateur
    await User.findByIdAndUpdate(id, {
      isBanned: false,
      banReason: null,
      banExpiresAt: null,
      bannedBy: null
    });

    res.json({ message: 'Utilisateur débanni avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du débannissement', error: error.message });
  }
}; 