const Room = require("../models/Room");
const User = require("../models/User");

// Récupérer toutes les salles disponibles
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar')
      .select('name type description members admin avatar createdAt');
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des salles', error: error.message });
  }
};

// Récupérer les salles d'un utilisateur
exports.getUserRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const rooms = await Room.find({ 
      isActive: true,
      $or: [
        { members: userId },
        { admin: userId }
      ]
    })
    .populate('admin', 'username avatar')
    .populate('members', 'username avatar')
    .select('name type description members admin avatar createdAt');
    
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des salles utilisateur', error: error.message });
  }
};

// Créer une nouvelle salle
exports.createRoom = async (req, res) => {
  try {
    const { name, type, description } = req.body;
    const adminId = req.user.id;
    
    const newRoom = new Room({
      name,
      type,
      description,
      admin: adminId,
      members: [adminId] // L'admin est automatiquement membre
    });
    
    await newRoom.save();
    
    const populatedRoom = await Room.findById(newRoom._id)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');
    
    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la salle', error: error.message });
  }
};

// Rejoindre une salle
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    
    if (!room.isActive) {
      return res.status(400).json({ message: 'Cette salle n\'est plus active' });
    }
    
    // Vérifier si l'utilisateur est déjà membre
    if (room.members.includes(userId)) {
      return res.status(400).json({ message: 'Vous êtes déjà membre de cette salle' });
    }
    
    // Ajouter l'utilisateur à la salle
    room.members.push(userId);
    await room.save();
    
    const updatedRoom = await Room.findById(roomId)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');
    
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'intégration à la salle', error: error.message });
  }
};

// Quitter une salle
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    
    // L'admin ne peut pas quitter sa propre salle
    if (room.admin.toString() === userId) {
      return res.status(400).json({ message: 'L\'administrateur ne peut pas quitter sa propre salle' });
    }
    
    // Retirer l'utilisateur de la salle
    room.members = room.members.filter(memberId => memberId.toString() !== userId);
    await room.save();
    
    res.json({ message: 'Vous avez quitté la salle avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du départ de la salle', error: error.message });
  }
};

// Mettre à jour une salle
exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    // On ne permet la modification que par l'admin de la salle
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    if (room.admin.toString() !== userId) {
      return res.status(403).json({ message: 'Seul l\'administrateur peut modifier la salle' });
    }

    room.name = name || room.name;
    room.description = description || room.description;
    await room.save();

    const updatedRoom = await Room.findById(roomId)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la salle', error: error.message });
  }
};

// Transférer l'admin d'une salle à un autre membre
exports.transferAdmin = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { newAdminId } = req.body;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    if (room.admin.toString() !== userId) {
      return res.status(403).json({ message: 'Seul l\'admin actuel peut transférer le rôle' });
    }
    if (!room.members.map(id => id.toString()).includes(newAdminId)) {
      return res.status(400).json({ message: 'Le nouvel admin doit être membre de la salle' });
    }
    room.admin = newAdminId;
    await room.save();
    const updatedRoom = await Room.findById(roomId)
      .populate('admin', 'username avatar')
      .populate('members', 'username avatar');
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du transfert d\'admin', error: error.message });
  }
};

// Supprimer une salle
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    console.log('🔍 DEBUG deleteRoom:');
    console.log('  - userId:', userId);
    console.log('  - room.admin:', room ? room.admin : 'room not found');
    if (!room) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }

    // Seul l'admin de la salle peut la supprimer
    if (String(room.admin) !== String(userId)) {
      console.log('❌ Accès refusé: userId !== room.admin');
      return res.status(403).json({ message: 'Seul l\'administrateur de la salle peut la supprimer' });
    }

    // Supprimer la salle
    await Room.findByIdAndDelete(roomId);
    console.log('✅ Salle supprimée avec succès');
    res.json({ message: 'Salle supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteRoom:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la salle', error: error.message });
  }
}; 