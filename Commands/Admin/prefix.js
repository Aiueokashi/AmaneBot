const Command = require("../../Structures/Command"),
  { AmaneEmbed } = require("../../Structures/Embed");

class Prefix extends Command {
  constructor(client) {
    super(client, {
      name: "amaneprefix",
      aliases: [],
      description: "サーバーで使うprefixを設定します。",
      usage: "amaneprefix <string>",
      slash: {
        name: "amaneprefix",
        description: "サーバーで使うprefixを設定します。",
        options: [
          {
            name: "prefix",
            description: "prefixに指定する文字",
            required: true,
            type: 3,
          },
        ],
        async run(interaction, args) {
          const a = { prefix: args[0].value };
          client.commands.get(this.name).run(interaction, a);
        },
      },
      example: ["a!", "+"],
      args: true,
      types: [
        {
          id: "prefix",
          type: "string",
        },
      ],
      category: "Admin",
      cooldown: 100000,
      userPerms: ["MANAGE_GUILD"],
      permLevel: 9,
      ownerOnly: false,
    });
  }

  async run(message, args) {
    const prefix = args.prefix;
    if (prefix.length > 2) {
      return super.respond("prefixは3文字未満にしてください。");
    }
    const client = this.client;
    const guild = await client.findOrCreateGuild({ id: message.guild.id });
    const oldPrefix = guild.prefix;
    if (oldPrefix === prefix) {
      return super.respond("同じprefixは設定できません。");
    }

    guild.prefix = prefix;
    await guild.save();
    let prefix_embed = new AmaneEmbed(message.data.userData)
      .setTitle("prefix変更")
      .addField("変更前", oldPrefix)
      .addField("変更後", prefix)
      .setTimestamp();

    super.respond({ embeds: [prefix_embed] });
    return 0;
  }
}

module.exports = Prefix;
