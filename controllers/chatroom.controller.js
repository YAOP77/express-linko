const ChatRoom = require('../models/ChatRoom');
const User = require('../models/User');

// Sauvegarder un message
exports.saveMessage = async (req, res) => {
  try {
    const { from, to, message, timestamp } = req.body;
    const chatMessage = new ChatRoom({ from, to, message, timestamp });
    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la sauvegarde du message', error: error.message });
  }
};

// Récupérer l'historique entre deux utilisateurs
exports.getHistory = async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    const messages = await ChatRoom.find({
      $or: [
        { from: user1, to: user2 },
        { from: user2, to: user1 }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique', error: error.message });
  }
};

// Récupérer la liste des utilisateurs avec qui le user courant a discuté + dernier message
exports.getContacts = async (req, res) => {
  try {
    const { userId } = req.query;
    // Trouver tous les messages où userId est from ou to
    const messages = await ChatRoom.find({
      $or: [
        { from: userId },
        { to: userId }
      ]
    });
    // Extraire tous les userId distincts (hors userId courant)
    const contactIds = Array.from(new Set(
      messages.flatMap(msg => [msg.from.toString(), msg.to.toString()])
        .filter(id => id !== userId)
    ));
    // Récupérer les infos des contacts (incluant le status)
    const contacts = await User.find({ _id: { $in: contactIds } }).select('_id username avatar status');
    // Pour chaque contact, trouver le dernier message échangé
    const contactsWithLastMsg = await Promise.all(contacts.map(async (contact) => {
      const lastMsg = await ChatRoom.findOne({
        $or: [
          { from: userId, to: contact._id },
          { from: contact._id, to: userId }
        ]
      }).sort({ createdAt: -1 });
      return {
        ...contact.toObject(),
        lastMessage: lastMsg ? lastMsg.message : null,
        lastMessageTimestamp: lastMsg ? lastMsg.timestamp : null
      };
    }));
    res.json(contactsWithLastMsg);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des contacts', error: error.message });
  }
};

// Récupérer les utilisateurs online parmi les contacts
exports.getOnlineContacts = async (req, res) => {
  try {
    const { userId } = req.query;
    // Récupérer d'abord tous les contacts (comme getContacts)
    const messages = await ChatRoom.find({
      $or: [
        { from: userId },
        { to: userId }
      ]
    });
    const contactIds = Array.from(new Set(
      messages.flatMap(msg => [msg.from.toString(), msg.to.toString()])
        .filter(id => id !== userId)
    ));
    const contacts = await User.find({ _id: { $in: contactIds } }).select('_id username avatar status');
    
    // Filtrer seulement ceux qui sont online
    const onlineContacts = contacts.filter(contact => contact.status === 'online');
    res.json(onlineContacts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des contacts online', error: error.message });
  }
};

// Upload d'un fichier (image/vidéo) et création d'un message media
exports.uploadFileMessage = async (req, res) => {
  try {
    const { from, to, timestamp, type } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });
    const fileName = req.file.filename; // juste le nom du fichier
    const chatMessage = new ChatRoom({
      from,
      to,
      message: fileName,
      timestamp,
      type: type || 'media',
      mediaType: req.file.mimetype.startsWith('video') ? 'video' : 'image'
    });
    await chatMessage.save();
    res.status(201).json(chatMessage);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'upload du fichier', error: error.message });
  }
};

// Récupérer l'historique des messages d'un groupe
exports.getGroupHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await ChatRoom.find({ to: roomId, type: 'group' }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'historique du groupe", error: error.message });
  }
};

// Supprimer un message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await ChatRoom.findById(id);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });
    // Optionnel : vérifier que seul l'auteur ou un admin peut supprimer
    // if (req.user.id !== message.from.toString()) return res.status(403).json({ message: 'Non autorisé' });
    await ChatRoom.deleteOne({ _id: id });
    res.json({ message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
};

// Ajouter/retirer un message des favoris
exports.saveMessageToggle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const message = await ChatRoom.findById(id);
    if (!message) return res.status(404).json({ message: 'Message non trouvé' });
    const alreadySaved = message.savedBy.includes(userId);
    if (alreadySaved) {
      message.savedBy = message.savedBy.filter(uid => uid.toString() !== userId);
    } else {
      message.savedBy.push(userId);
    }
    await message.save();
    res.json({ message: alreadySaved ? 'Message retiré des favoris' : 'Message ajouté aux favoris', saved: !alreadySaved });
  } catch (error) {
    res.status(500).json({ message: 'Erreur favoris', error: error.message });
  }
};

// Récupérer tous les messages gardés par un utilisateur
exports.getSavedMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await ChatRoom.find({ savedBy: userId }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération favoris', error: error.message });
  }
}; 