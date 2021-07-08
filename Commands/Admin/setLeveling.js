const Command = require("../../Structures/Command");

class Leveling extends Command {
  constructor(client) {
    super(client, {
      name: "leveling",
      aliases: ["lvl"],
      description: "レベリング機能のオン/オフを切り替えます。",
      usage: "leveling <enable/disable>",
      example: ["enable"],
      args: [
                {
                    id: 'switch',
                    type: 'string',
                }
            ],
      category: "Admin",
      cooldown: 10000,
      userPerms: ["ADMINISTRATOR"],
      permLevel: 9,
      ownerOnly: false,
    });
  }

  async run(message, [...args]) {
    if (args[0] !== "enable" && args[0] !== "disable") {
      return super.respond("`enable`か`disable`のどちらかを指定してください。");
    }
    const client = this.client;
    let guildData = await client.findOrCreateGuild({ id: message.guild.id });
    const now = guildData.plugins.leveling.enabled;

    if (args[0] === "enable") {
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
        await guildData.save("設定をオフにしました。");
      }
    }
  }
}

module.exports = Leveling;
