const Command = require("../../Structures/Command");
//const { MessageAttachment } = require("discord.js");
//const fs = require("fs");
//const Canvas = require("canvas");

class Rank extends Command {
  constructor(client) {
    super(client, {
      name: "color",
      description: "テーマカラーの変更",
      usage: "color <colorname>",
      example: ["blue", "#ff00ff"],
      args: true,
      nonparse: true,
      types: [
        {
          id: "color",
          type: "color",
          default: "green"
        },
      ],
      category: "一般",
      cooldown: 10000,
      aliases: [],
      permLevel: 0,
      guildOnly: true,
    });
  }

  async run(message, args) {
    const client = this.client;
    const Color = args.color;
    let userData = await client.findOrCreateUser({ id: message.author.id });
    userData.color = Color;

    await userData.save();
    message.channel.embed(`テーマカラーを変更しました: ${Color}`,'色変更',Color);
  }
}

module.exports = Rank;
