const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const createUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const userExist = await User.findOne({ email });
        if(userExist) return res.status(400).json({ message: "Email déja utilisé"});

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({ username, email, password: passwordHash, status: "offline" });
        await newUser.save();
        res.status(201).json({ message: "Utilisateur créé avec succès"})
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'enregistrement", error: error.message});
    }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email incorrect" });

    const hashPassword = await bcrypt.hash(password, 10);
    const isMatch = await bcrypt.compare(password, hashPassword);
    if(!isMatch) return res.status(400).json({ message: "Mot de passe incorrect" });

    console.log('🔍 DEBUG loginUser:');
    console.log('  - user._id:', user._id);
    console.log('  - user.isAdmin:', user.isAdmin);
    console.log('  - user.email:', user.email);

    const token = jwt.sign({ 
      id: user._id, 
      isAdmin: user.isAdmin 
    }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    console.log('  - Token généré avec isAdmin:', user.isAdmin);

    // ✅ Et on renvoie l'utilisateur pour le front
    res.json({
      message: "Connexion réussie !",
      token,
      user: { _id: user._id, username: user.username, avatar: user.avatar } // Inclure l'avatar
    });
  } catch (error) {
    res.status(500).json({
      message: "Une erreur est survenue lors de la connexion !",
      error: error.message
    });
  }
};


module.exports = { createUser, loginUser };