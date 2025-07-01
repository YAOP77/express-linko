require("dotenv").config();
const mongoose = require("mongoose");

const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("🔍 DB_URI utilisé:", process.env.DB_URI);
        console.log("etat de la connexion", mongoose.connection.readyState);
        console.log("connecté");
    } catch (error) {
        console.error("Erreur lors de la connexion à MongoDB", error);
        process.exit(1);
    }
}

module.exports = connectMongoDB;