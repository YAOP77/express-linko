const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Accès refusé" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("Utilisateur authentifié :", req.user);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token invalide" });
    }
};