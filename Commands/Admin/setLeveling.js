const Command = require("../../Structures/Command");

class Leveling extends Command {
  constructor(client) {
    super(client, {
      name: "leveling",
      aliases: ["lvl"],
      description: "レベリング機能のオン/オフを切り替えます。",
      usage: "leveling <true/false>",
      example: ["true"],
      args: true,
      types:[{
        id:'switch',
        type:'boolean'
      }],
      category: "Admin",
      cooldown: 10000,
      userPerms: ["ADMINISTRATOR"],
      permLevel: 9,
      ownerOnly: false,
    });
  }

  async run(message, args) {
    const client = this.client;
    let guildData = await client.findOrCreateGuild({ id: message.guild.id });
    const now = guildData.plugins.leveling.enabled;

    if (args.switch) {
      if (now === true) {
        return super.respond("既にオンです");
      } else {
        guildData.plugins.leveling.enabled = true;
        await guildData.save();
        return super.respond("設定をオンにしました。");
      }
    } else {
      if (now === false) {
        return super.respond("既にオフです");
      } else {
        guildData.plugins.leveling.enabled = false;
        await guildData.save();
        return super.respond("設定をオフにしました。");
      }
    }
  }
}

module.exports = Leveling;
