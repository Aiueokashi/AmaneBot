const Command = require("../../Structures/Command");
const { MessageAttachment } = require("discord.js");
const fs = require("fs");
const Canvas = require("canvas");
const { Hex_Colors } = require("../../Structures/Utils/Constants");

const resolveColor = (color) => {
  if (!color.startsWith("#")) {
    const Hex_Code = Hex_Colors.find(
      (c) => c.name.toLowerCase() === color.toLowerCase()
    );
    if (Hex_Code === undefined) {
      return Hex_Colors[0].hex;
    } else {
      return Hex_Code.hex;
    }
  } else {
    if (color.length === 7) {
      return color.toUpperCase();
    } else {
      return Hex_Colors[0].hex;
    }
  }
};

class Rank extends Command {
  constructor(client) {
    super(client, {
      name: "color",
      description: "テーマカラーの変更",
      usage: "color <colorname>",
      example: ["blue", "#ff00ff"],
      args: true,
      category: "一般",
      cooldown: 10000,
      aliases: [],
      permLevel: 0,
      guildOnly: true,
    });
  }

  async run(message, [...args]) {
    const client = this.client;
    const Color = resolveColor(args.join(" "));
    let userData = await client.findOrCreateUser({ id: message.author.id });
    userData.color = Color;

    await userData.save();
    super.respond(`テーマカラーを変更しました: ${Color}`);
  }
}

module.exports = Rank;
