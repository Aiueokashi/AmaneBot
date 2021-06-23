const Command = require("../../Structures/Command");
const { MessageEmbed } = require("discord.js");

class React extends Command {
  constructor(client) {
    super(client, {
      name: "react",
      description: "メッセージに文字リアクションをつける。",
      usage: "react [string] <messageID>",
      example: ["pro 1234567890123", "nice 1234567890123"],
      args: true,
      category: "一般",
      cooldown: 10000,
      aliases: [],
      permLevel: 0,
      guildOnly: true
    });
  }

  async run(message, [...args]) {
    const client = this.client;
    if (client.util.hasSameStr(args[0])) {
      return super.respond("同じ文字のリアクションはつけることができません");
    }
    const msg = await message.channel.messages.fetch(args[1]);
    args[0].split("").forEach(str => {
      const emoji = client.util.strToEmoji(str);
      msg.react(emoji.unicode);
    });
  }
}

module.exports = React;
