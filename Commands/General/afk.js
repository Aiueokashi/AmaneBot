const Command = require("../../Structures/Command");
const { AmaneEmbed } = require("../../Structures/Embed");

class Afk extends Command {
  constructor(client) {
    super(client, {
      name: "afk",
      description: "afkになります",
      usage: "afk [理由]",
      example: ["寝てます", "風呂入ってます"],
      args: true,
      types: [
        {
          id: "afk",
          type: "string",
        },
      ],
      category: "一般",
      cooldown: 0,
      permLevel: 0,
      guildOnly: false,
      disable: false,
      nonparse: true,
    });
  }

  async run(message, args) {
    const client = this.client;
    const AFK = args.afk;
    let d = await client.findOrCreateUser({ id: message.author.id });
    d.afk = AFK;
    await d.save();
    message.channel.embed(
      `何か発言すると解除されます${client.getEmoji(
        "atlanta_channels"
      )}\n理由: ${AFK}`,
      `${client.getEmoji("atlanta_afk")} AFKを設定しました。`,
      message.data.userData.color
    );
  }
}

module.exports = Afk;
