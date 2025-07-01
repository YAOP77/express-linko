const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    type: { 
        type: String, 
        enum: ["Amis", "Rencontres", "Connaissances", "Mariage"], 
        required: true 
    },
    description: { 
        type: String, 
        required: false 
    },
    members: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user' 
    }],
    admin: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    avatar: { 
        type: String, 
        required: false 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model("Room", RoomSchema); 