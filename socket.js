const ChatRoom = require('./models/ChatRoom');
const User = require('./models/User');

// Map userId -> Set of socketIds
const userSockets = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('🔌 Client connecté :', socket.id);

        socket.on('join', (userId) => {
            socket.join(userId);
            // Ajouter ce socket à la liste des sockets de l'utilisateur
            if (!userSockets.has(userId)) userSockets.set(userId, new Set());
            userSockets.get(userId).add(socket.id);

            // Mettre à jour le statut online
            User.findByIdAndUpdate(userId, { status: 'online' }, { new: true })
                .then(() => console.log(`✅ Statut online mis à jour en base pour ${userId}`))
                .catch(err => console.error(`❌ Erreur mise à jour statut online: ${err.message}`));
            io.emit('userOnline', userId);
        });

        socket.on('sendMessage', async ({ from, to, message, timestamp, type, mediaType }) => {
            console.log(`📨 SOCKET - Message de ${from} à ${to} : ${message}`);
            console.log(`🎯 SOCKET - Envoi à la room : ${to}`);
            // Sauvegarder le message en base
            let savedMsg;
            try {
                savedMsg = await ChatRoom.create({ from, to, message, timestamp, type, mediaType });
                console.log('💾 SOCKET - Message sauvegardé en base');
            } catch (err) {
                console.error('❌ SOCKET - Erreur sauvegarde message :', err.message);
            }
            // Envoyer le message avec plus d'informations
            const messageData = { from, to, message, timestamp };
            if (type) messageData.type = type;
            if (mediaType) messageData.mediaType = mediaType;
            if (savedMsg && savedMsg._id) messageData._id = savedMsg._id.toString();
            console.log('📤 SOCKET - Envoi messageData:', messageData);
            io.to(to).emit('receiveMessage', messageData);
            io.to(from).emit('receiveMessage', messageData);
            const room = io.sockets.adapter.rooms.get(to);
            console.log(`🏠 SOCKET - Room ${to} existe :`, !!room, `Clients dans la room :`, room ? room.size : 0);
        });

        // Événement pour la mise à jour d'avatar
        socket.on('avatarUpdated', async ({ userId, newAvatar }) => {
            console.log(`🖼️ SOCKET - Avatar mis à jour pour ${userId} : ${newAvatar}`);
            try {
                // Mettre à jour l'avatar en base de données
                await User.findByIdAndUpdate(userId, { avatar: newAvatar });
                console.log('💾 SOCKET - Avatar sauvegardé en base');
                
                // Émettre l'événement à tous les utilisateurs connectés
                io.emit('userAvatarUpdated', { userId, newAvatar });
                console.log('📤 SOCKET - Événement avatarUpdated émis à tous les utilisateurs');
            } catch (err) {
                console.error('❌ SOCKET - Erreur mise à jour avatar :', err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log("❌ Un utilisateur s'est déconnecté :", socket.id);
            let disconnectedUserId = null;
            for (const [userId, sockets] of userSockets.entries()) {
                if (sockets.has(socket.id)) {
                    sockets.delete(socket.id);
                    disconnectedUserId = userId;
                    // Si plus aucun socket pour cet utilisateur, il est vraiment offline
                    if (sockets.size === 0) {
                        userSockets.delete(userId);
                        console.log(`👤 Utilisateur ${userId} est maintenant OFFLINE (en attente)`);
                        setTimeout(() => {
                            // Vérifier qu'aucun nouveau socket n'est arrivé entre-temps
                            if (!userSockets.has(userId)) {
                                User.findByIdAndUpdate(userId, { status: 'offline' }, { new: true })
                                    .then(() => console.log(`✅ Statut offline mis à jour en base pour ${userId}`))
                                    .catch(err => console.error(`❌ Erreur mise à jour statut offline: ${err.message}`));
                                io.emit('userOffline', userId);
                            } else {
                                console.log(`⏩ Utilisateur ${userId} est revenu online avant le délai, pas de passage offline.`);
                            }
                        }, 8000); // 8 secondes
                    }
                    break;
                }
            }
        });

        // Gestion des rooms de groupe
        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`👥 SOCKET - Socket ${socket.id} a rejoint la room de groupe ${roomId}`);
        });

        socket.on('leaveRoom', (roomId) => {
            socket.leave(roomId);
            console.log(`👥 SOCKET - Socket ${socket.id} a quitté la room de groupe ${roomId}`);
        });

        socket.on('sendGroupMessage', async (msg) => {
            // msg: { roomId, from, text, timestamp }
            try {
                // Sauvegarde en base
                await ChatRoom.create({ from: msg.from, to: msg.roomId, message: msg.text, timestamp: msg.timestamp, type: 'group' });
                io.to(msg.roomId).emit('receiveGroupMessage', msg);
                console.log(`📢 SOCKET - Message de groupe envoyé à la room ${msg.roomId} :`, msg.text);
            } catch (err) {
                console.error('❌ SOCKET - Erreur envoi message de groupe :', err.message);
            }
        });

        // Suppression instantanée d'un message de groupe
        socket.on('deleteGroupMessage', async ({ messageId, roomId }) => {
            try {
                await ChatRoom.deleteOne({ _id: messageId });
                io.to(roomId).emit('groupMessageDeleted', { messageId });
                console.log(`🗑️ SOCKET - Message ${messageId} supprimé dans la room ${roomId}`);
            } catch (err) {
                console.error('❌ SOCKET - Erreur suppression message groupe :', err.message);
            }
        });

        // Suppression instantanée d'un message privé
        socket.on('deletePrivateMessage', async ({ messageId, to }) => {
            try {
                await ChatRoom.deleteOne({ _id: messageId });
                // Notifie l'expéditeur et le destinataire
                socket.emit('privateMessageDeleted', { messageId });
                io.to(to).emit('privateMessageDeleted', { messageId });
                console.log(`🗑️ SOCKET - Message privé ${messageId} supprimé pour les deux utilisateurs`);
            } catch (err) {
                console.error('❌ SOCKET - Erreur suppression message privé :', err.message);
            }
        });
    });
};