const mongoose = require("mongoose");
const AmaneError = require("../Structures/Extender/Error");
const { Hex_Colors } = require("../Structures/Utils/Constants");

const resolveColor = color => {
  if (!color.startsWith("#")) {
    const Hex_Code = Hex_Colors.find(
      c => c.name.toLowerCase() === color.toLowerCase()
    );
    if (Hex_Code === undefined) {
      return Hex_Colors[0];
    } else {
      return Hex_Code;
    }
  } else {
    if (color.length === 7) {
      return { hex: color.toUpperCase() };
    } else {
      return Hex_Colors[0];
    }
  }
};

const genToken = () => {
  let token = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwzy0123456789.-_";
  for (let i = 0; i < 32; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

const userSchema = new mongoose.Schema({
  id: { type: String, required: true },

  color: { type: String, default: "#FFFFFF" },

  voiceType: { type: Number, default: 1, min: 1, max: 6 },
  speed: { type: Number, default: 100, min: 50, max: 400 },
  pitch: { type: Number, default: 100, min: 50, max: 200 },
  TTSMode: { type: Number, default: 2, min: 1, max: 2 },

  birthdate: { type: Number, default: 0 },
  registeredAt: { type: Number, default: Date.now() },
  follow: { type: Array, default: [] },
  follower: { type: Array, default: [] },

  afk: { type: String, default: null },
  apiToken: { type: String, default: genToken() },

  plugins: {
    type: Object,
    default: {
      welcome: {
        color: { hex: "#FFFFFF" },
        image: null
      },

      goodbye: {
        color: { hex: "#FFFFFF" },
        image: null
      },

      rank: {
        color: { hex: "#FFFFFF" },
        image: null
      }
    }
  }
});

userSchema.method("genApiToken", async function() {
  this.apiToken = genToken();
  await this.save();
  return this.apiToken;
});

module.exports = mongoose.model("User", userSchema);
