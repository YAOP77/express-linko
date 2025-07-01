const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User');

// Connexion à la base de données
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const initRooms = async () => {
  try {
    // Récupérer un utilisateur pour être admin
    const adminUser = await User.findOne();
    if (!adminUser) {
      console.log('Aucun utilisateur trouvé. Créez d\'abord un utilisateur.');
      return;
    }

    // Supprimer les salles existantes
    await Room.deleteMany({});
    console.log('Salles existantes supprimées');

    // Créer les salles de test
    const rooms = [
      {
        name: 'Groupe Amis Paris',
        type: 'Amis',
        description: 'Groupe pour les amis de Paris - discussions générales et sorties',
        admin: adminUser._id,
        members: [adminUser._id]
      },
      {
        name: 'Rencontres Célibataires',
        type: 'Rencontres',
        description: 'Groupe pour les célibataires qui cherchent l\'amour',
        admin: adminUser._id,
        members: [adminUser._id]
      },
      {
        name: 'Professionnels Tech',
        type: 'Connaissances',
        description: 'Réseau de professionnels du secteur technologique',
        admin: adminUser._id,
        members: [adminUser._id]
      },
      {
        name: 'Préparation Mariage 2024',
        type: 'Mariage',
        description: 'Groupe pour organiser et partager les préparatifs de mariage',
        admin: adminUser._id,
        members: [adminUser._id]
      },
      {
        name: 'Amis Gaming',
        type: 'Amis',
        description: 'Groupe pour les passionnés de jeux vidéo',
        admin: adminUser._id,
        members: [adminUser._id]
      },
      {
        name: 'Rencontres Sportives',
        type: 'Rencontres',
        description: 'Rencontres autour du sport et des activités physiques',
        admin: adminUser._id,
        members: [adminUser._id]
      }
    ];

    // Insérer les salles
    const createdRooms = await Room.insertMany(rooms);
    console.log(`${createdRooms.length} salles créées avec succès !`);
    
    console.log('Salles créées :');
    createdRooms.forEach(room => {
      console.log(`- ${room.name} (${room.type})`);
    });

  } catch (error) {
    console.error('Erreur lors de l\'initialisation des salles:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Exécuter le script
initRooms(); 