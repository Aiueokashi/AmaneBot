const Command = require("../../Structures/Command"),
  { AmaneEmbed } = require("../../Structures/Embed");

class Prefix extends Command {
  constructor(client) {
    super(client, {
      name: "amaneprefix",
      aliases: [],
      description: "サーバーで使うprefixを設定します。",
      usage: "amaneprefix <string>",
      example: ["a!", "+"],
      args: [
                {
                    id: 'prefix',
                    type: 'string',
                }
            ],
      category: "Admin",
      cooldown: 100000,
      userPerms: ["ADMINISTRATOR"],
      permLevel: 9,
      ownerOnly: false,
    });
  }

  async run(message, [prefix, ...args], data) {
    if (prefix.length > 2) {
      return super.respond("prefixは3文字未満にしてください。");
    }
    const client = this.client;
    const guild = client.findOrCreateGuild({ id: message.guild.id });
    const oldPrefix = guild.prefix;
    if (oldPrefix === prefix) {
      return supre.respond("同じprefixは設定できません。");
    }

    guild.prefix = prefix;
    await guild.save();
    let prefix_embed = new AmaneEmbed(data.userData)
      .setTitle("prefix変更")
      .addField("変更前", oldPrefix)
      .addField("変更後", prefix)
      .setTimestamp();

    super.respond(prefix_embed);
  }
}

module.exports = Prefix;
