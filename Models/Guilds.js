const mongoose = require("mongoose"),
  config = require("../config"),
	Schema = mongoose.Schema;
	
module.exports = mongoose.model("Guild", new Schema({
  id: { type: String, required: true },
  
  membersData: { type: Object, default: {} },
  members: { type: [Schema.Types.ObjectId], ref:"Member" },
  prefix: { type: String, default: config.prefix },
  premium: { type: Boolean, default: false },
  
  plugins: { type: Object, default: {
    
    leveling: {
      enabled: true,
    },
    
    welcome: {
      enabled: false,
      message: null,
      channel: null,
      withImg: false,
    },
    
    goodbye: {
      enabled: false,
      message: null,
      channel: null,
      withImg: false,
    },
    
    autorole: {
      enabled: false,
      role: [],
    },
    
    automod: {
      enabled: false,
      options: {},
    },
    
    fortniteshop: {
      enabled: false,
      channel: null,
    },
    
    logs: {
      enabled: false,
      channel: null,
    },
    
    modlog: {
      enabled: false,
      channel: null,
    },
    
    tickets: {
      enabled: false,
      category: null,
    }
    
    }},
    
    ignoredChannels: { type: Array, default: [] },
    customCommands: { type: Array, default: [] },
    commands: { type: Array, default: [] },
    autoDeleteModCommands: { type: Boolean, default: false },
    disabledCategories: { type: Array, default: [] }
  
}))