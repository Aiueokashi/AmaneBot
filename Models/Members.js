const mongoose = require("mongoose");

module.exports = mongoose.model("Member", new mongoose.Schema({

	id: { type: String },
	guildID: { type: String },

	money: { type: Number, default: 0 },
	exp: { type: Number, default: 0 }, 
	level: { type: Number, default: 1 },

	registeredAt: { type: Number, default: Date.now() },

	voice: { type: Object, default: {
	  channel: null,
	  joining: false,
	  joinedtimestamp: 0,
	  total: 0
	}},

	punishments: { type: Array, default: [] },
	
	mute: { type: Object, default: { 
		muted: false,
		case: null,
		endDate: null
	}},
    
}));