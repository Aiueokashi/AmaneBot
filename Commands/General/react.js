const Command = require("../../Structures/Command");

class React extends Command {
  constructor(client) {
    super(client, {
      name: "react",
      description: "メッセージに文字リアクションをつける。",
      usage: "react [string] <messageID>",
      example: ["pro 1234567890123", "nice 1234567890123"],
      args: true,
      types:[{
        id:'emoji',
        type:'string',
      },{
        id:'message',
        type:'message',
      }],
      category: "一般",
      cooldown: 1000,
      aliases: [],
      permLevel: 0,
      guildOnly: true,
    });
  }

  async run(message, args, data) {
    const client = this.client;
    if (client.util.hasSameStr(args.emoji)) {
      return super.respond("同じ文字のリアクションはつけることができません");
    }
    args.emoji.split("").forEach((str) => {
      const emoji = client.util.strToEmoji(str);
      args.message.react(emoji.unicode);
    });
  }
}

module.exports = React;
