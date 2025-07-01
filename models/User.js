const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true, lowercase: true },
    age: { type: Number, required: false },
    genre : { type: String, enum: ["homme", "femme"], required: false },
    hobby: { type: String, required: false },
    relationship: { type: String, required: false },
    localisation : { type: String, required: false },
    avatar: { type: String, required: false },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, required: false },
    banExpiresAt: { type: Date, required: false },
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: false }
},
    { timestamps: true }
);

UserSchema.pre("save", async function (next) {
    if(this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

UserSchema.methods.comparePassword = async function (comparePassword) {
    await bcrypt.compare(comparePassword, this.password);
}

module.exports = mongoose.model("user", UserSchema);